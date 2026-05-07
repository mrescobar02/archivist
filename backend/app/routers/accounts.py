from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..db.session import get_session
from ..core.auth import get_current_user, CurrentUser
from ..models.account import Account
from ..models.income import Income
from ..models.expense import Expense
from ..models.fixed_expense import FixedExpense
from ..models.transfer import Transfer
from ..schemas.account import AccountCreate, AccountUpdate, AccountRead

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("", response_model=List[AccountRead])
def list_accounts(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    return session.exec(
        select(Account).where(Account.user_id == current_user.user_id).order_by(Account.name)
    ).all()


@router.post("", response_model=AccountRead, status_code=201)
def create_account(
    body: AccountCreate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    account = Account(
        user_id=current_user.user_id,
        name=body.name,
        type=body.type,
        initial_balance=body.initial_balance,
        balance=body.initial_balance,
    )
    session.add(account)
    session.commit()
    session.refresh(account)
    return account


@router.get("/{account_id}", response_model=AccountRead)
def get_account(
    account_id: int,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    account = session.exec(
        select(Account).where(Account.id == account_id, Account.user_id == current_user.user_id)
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


@router.put("/{account_id}", response_model=AccountRead)
def update_account(
    account_id: int,
    body: AccountUpdate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    account = session.exec(
        select(Account).where(Account.id == account_id, Account.user_id == current_user.user_id)
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(account, field, value)
    session.add(account)
    session.commit()
    session.refresh(account)
    return account


@router.delete("/{account_id}", status_code=204)
def delete_account(
    account_id: int,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    account = session.exec(
        select(Account).where(Account.id == account_id, Account.user_id == current_user.user_id)
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    refs = [
        session.exec(select(Income).where(Income.account_id == account_id, Income.user_id == current_user.user_id)).first(),
        session.exec(select(Expense).where(Expense.account_id == account_id, Expense.user_id == current_user.user_id)).first(),
        session.exec(select(FixedExpense).where(FixedExpense.account_id == account_id, FixedExpense.user_id == current_user.user_id)).first(),
        session.exec(select(Transfer).where(
            Transfer.user_id == current_user.user_id,
            (Transfer.from_account_id == account_id) | (Transfer.to_account_id == account_id)
        )).first(),
    ]
    if any(refs):
        raise HTTPException(status_code=409, detail="Account is referenced by existing transactions")
    session.delete(account)
    session.commit()
