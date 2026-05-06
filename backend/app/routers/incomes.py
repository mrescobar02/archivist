from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from ..db.session import get_session
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
):
    q = select(Income)
    if account_id:
        q = q.where(Income.account_id == account_id)
    if start_date:
        q = q.where(Income.date >= start_date)
    if end_date:
        q = q.where(Income.date <= end_date)
    return session.exec(q.order_by(Income.date.desc())).all()


@router.post("", response_model=IncomeRead, status_code=201)
def create_income(body: IncomeCreate, session: Session = Depends(get_session)):
    account = session.get(Account, body.account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    income = Income(**body.model_dump())
    account.balance += body.amount
    session.add(income)
    session.add(account)
    session.commit()
    session.refresh(income)
    return income


@router.put("/{income_id}", response_model=IncomeRead)
def update_income(income_id: int, body: IncomeUpdate, session: Session = Depends(get_session)):
    income = session.get(Income, income_id)
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    old_amount = income.amount
    old_account_id = income.account_id
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(income, field, value)
    # Reverse old amount, apply new
    old_account = session.get(Account, old_account_id)
    if old_account:
        old_account.balance -= old_amount
        session.add(old_account)
    new_account = session.get(Account, income.account_id)
    if new_account:
        new_account.balance += income.amount
        session.add(new_account)
    session.add(income)
    session.commit()
    session.refresh(income)
    return income


@router.delete("/{income_id}", status_code=204)
def delete_income(income_id: int, session: Session = Depends(get_session)):
    income = session.get(Income, income_id)
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    account = session.get(Account, income.account_id)
    if account:
        account.balance -= income.amount
        session.add(account)
    session.delete(income)
    session.commit()
