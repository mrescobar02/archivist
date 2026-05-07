from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from ..db.session import get_session
from ..core.auth import get_current_user, CurrentUser
from ..models.account import Account
from ..models.income import Income
from ..schemas.income import IncomeCreate, IncomeUpdate, IncomeRead

router = APIRouter(prefix="/incomes", tags=["incomes"])


@router.get("", response_model=List[IncomeRead])
def list_incomes(
    account_id: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    q = select(Income).where(Income.user_id == current_user.user_id)
    if account_id:
        q = q.where(Income.account_id == account_id)
    if start_date:
        q = q.where(Income.date >= start_date)
    if end_date:
        q = q.where(Income.date <= end_date)
    return session.exec(q.order_by(Income.date.desc())).all()


@router.post("", response_model=IncomeRead, status_code=201)
def create_income(
    body: IncomeCreate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    account = session.exec(
        select(Account).where(Account.id == body.account_id, Account.user_id == current_user.user_id)
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    income = Income(user_id=current_user.user_id, **body.model_dump())
    account.balance += body.amount
    session.add(income)
    session.add(account)
    session.commit()
    session.refresh(income)
    return income


@router.put("/{income_id}", response_model=IncomeRead)
def update_income(
    income_id: int,
    body: IncomeUpdate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    income = session.exec(
        select(Income).where(Income.id == income_id, Income.user_id == current_user.user_id)
    ).first()
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    old_amount = income.amount
    old_account_id = income.account_id
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(income, field, value)
    old_account = session.exec(
        select(Account).where(Account.id == old_account_id, Account.user_id == current_user.user_id)
    ).first()
    if old_account:
        old_account.balance -= old_amount
        session.add(old_account)
    new_account = session.exec(
        select(Account).where(Account.id == income.account_id, Account.user_id == current_user.user_id)
    ).first()
    if new_account:
        new_account.balance += income.amount
        session.add(new_account)
    session.add(income)
    session.commit()
    session.refresh(income)
    return income


@router.delete("/{income_id}", status_code=204)
def delete_income(
    income_id: int,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    income = session.exec(
        select(Income).where(Income.id == income_id, Income.user_id == current_user.user_id)
    ).first()
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    account = session.exec(
        select(Account).where(Account.id == income.account_id, Account.user_id == current_user.user_id)
    ).first()
    if account:
        account.balance -= income.amount
        session.add(account)
    session.delete(income)
    session.commit()
