from typing import List, Dict
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from ..db.session import get_session
from ..core.auth import get_current_user, CurrentUser
from ..models.fixed_expense import FixedExpense
from ..schemas.fixed_expense import FixedExpenseCreate, FixedExpenseUpdate, FixedExpenseRead, UpcomingFixedExpense
from ..services.fixed_expenses import compute_next_due_date

router = APIRouter(prefix="/fixed-expenses", tags=["fixed-expenses"])


@router.get("/upcoming", response_model=Dict[str, List[UpcomingFixedExpense]])
def get_upcoming(
    days: int = Query(default=7, ge=1, le=365),
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    today = date.today()
    items = session.exec(
        select(FixedExpense).where(
            FixedExpense.user_id == current_user.user_id,
            FixedExpense.is_active == True,
        )
    ).all()
    upcoming = []
    overdue = []
    for fe in items:
        next_due = compute_next_due_date(fe.payment_day, fe.frequency, fe.last_paid, today)
        days_until = (next_due - today).days
        item = UpcomingFixedExpense(
            id=fe.id, name=fe.name, amount=fe.amount,
            payment_day=fe.payment_day, next_due_date=next_due,
            days_until_due=days_until, account_id=fe.account_id,
        )
        if days_until < 0:
            overdue.append(item)
        elif days_until <= days:
            upcoming.append(item)
    return {
        "upcoming": sorted(upcoming, key=lambda x: x.days_until_due),
        "overdue": sorted(overdue, key=lambda x: x.days_until_due),
    }


@router.get("", response_model=List[FixedExpenseRead])
def list_fixed_expenses(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    return session.exec(
        select(FixedExpense).where(FixedExpense.user_id == current_user.user_id).order_by(FixedExpense.name)
    ).all()


@router.post("", response_model=FixedExpenseRead, status_code=201)
def create_fixed_expense(
    body: FixedExpenseCreate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    fe = FixedExpense(user_id=current_user.user_id, **body.model_dump())
    session.add(fe)
    session.commit()
    session.refresh(fe)
    return fe


@router.get("/{fe_id}", response_model=FixedExpenseRead)
def get_fixed_expense(
    fe_id: int,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    fe = session.exec(
        select(FixedExpense).where(FixedExpense.id == fe_id, FixedExpense.user_id == current_user.user_id)
    ).first()
    if not fe:
        raise HTTPException(status_code=404, detail="Fixed expense not found")
    return fe


@router.put("/{fe_id}", response_model=FixedExpenseRead)
def update_fixed_expense(
    fe_id: int,
    body: FixedExpenseUpdate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    fe = session.exec(
        select(FixedExpense).where(FixedExpense.id == fe_id, FixedExpense.user_id == current_user.user_id)
    ).first()
    if not fe:
        raise HTTPException(status_code=404, detail="Fixed expense not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(fe, field, value)
    session.add(fe)
    session.commit()
    session.refresh(fe)
    return fe


@router.delete("/{fe_id}", status_code=204)
def delete_fixed_expense(
    fe_id: int,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    fe = session.exec(
        select(FixedExpense).where(FixedExpense.id == fe_id, FixedExpense.user_id == current_user.user_id)
    ).first()
    if not fe:
        raise HTTPException(status_code=404, detail="Fixed expense not found")
    session.delete(fe)
    session.commit()
