from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from ..db.session import get_session
from ..models.account import Account
from ..models.expense import Expense
from ..models.enums import ExpenseType
from ..schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseRead

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.get("", response_model=List[ExpenseRead])
def list_expenses(
    account_id: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    expense_type: Optional[ExpenseType] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    session: Session = Depends(get_session),
):
    q = select(Expense)
    if account_id:
        q = q.where(Expense.account_id == account_id)
    if category_id:
        q = q.where(Expense.category_id == category_id)
    if expense_type:
        q = q.where(Expense.expense_type == expense_type)
    if start_date:
        q = q.where(Expense.date >= start_date)
    if end_date:
        q = q.where(Expense.date <= end_date)
    return session.exec(q.order_by(Expense.date.desc())).all()


@router.post("", response_model=ExpenseRead, status_code=201)
def create_expense(body: ExpenseCreate, session: Session = Depends(get_session)):
    account = session.get(Account, body.account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    expense = Expense(**body.model_dump())
    account.balance -= body.amount
    session.add(expense)
    session.add(account)
    session.commit()
    session.refresh(expense)
    return expense


@router.put("/{expense_id}", response_model=ExpenseRead)
def update_expense(expense_id: int, body: ExpenseUpdate, session: Session = Depends(get_session)):
    expense = session.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    old_amount = expense.amount
    old_account_id = expense.account_id
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(expense, field, value)
    old_account = session.get(Account, old_account_id)
    if old_account:
        old_account.balance += old_amount
        session.add(old_account)
    new_account = session.get(Account, expense.account_id)
    if new_account:
        new_account.balance -= expense.amount
        session.add(new_account)
    session.add(expense)
    session.commit()
    session.refresh(expense)
    return expense


@router.delete("/{expense_id}", status_code=204)
def delete_expense(expense_id: int, session: Session = Depends(get_session)):
    expense = session.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    account = session.get(Account, expense.account_id)
    if account:
        account.balance += expense.amount
        session.add(account)
    session.delete(expense)
    session.commit()
