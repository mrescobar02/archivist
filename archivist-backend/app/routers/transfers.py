from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from ..db.session import get_session
from ..models.account import Account
from ..models.transfer import Transfer
from ..schemas.transfer import TransferCreate, TransferRead

router = APIRouter(prefix="/transfers", tags=["transfers"])


@router.get("", response_model=List[TransferRead])
def list_transfers(
    account_id: Optional[int] = Query(None),
    session: Session = Depends(get_session),
):
    q = select(Transfer)
    if account_id:
        q = q.where(
            (Transfer.from_account_id == account_id) | (Transfer.to_account_id == account_id)
        )
    return session.exec(q.order_by(Transfer.date.desc())).all()


@router.post("", response_model=TransferRead, status_code=201)
def create_transfer(body: TransferCreate, session: Session = Depends(get_session)):
    if body.from_account_id == body.to_account_id:
        raise HTTPException(status_code=422, detail="Source and destination accounts must be different")
    from_acc = session.get(Account, body.from_account_id)
    to_acc = session.get(Account, body.to_account_id)
    if not from_acc:
        raise HTTPException(status_code=404, detail="Source account not found")
    if not to_acc:
        raise HTTPException(status_code=404, detail="Destination account not found")
    from_acc.balance -= body.amount
    to_acc.balance += body.amount
    transfer = Transfer(**body.model_dump())
    session.add(from_acc)
    session.add(to_acc)
    session.add(transfer)
    session.commit()
    session.refresh(transfer)
    return transfer


@router.delete("/{transfer_id}", status_code=204)
def delete_transfer(transfer_id: int, session: Session = Depends(get_session)):
    transfer = session.get(Transfer, transfer_id)
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    from_acc = session.get(Account, transfer.from_account_id)
    to_acc = session.get(Account, transfer.to_account_id)
    if from_acc:
        from_acc.balance += transfer.amount
        session.add(from_acc)
    if to_acc:
        to_acc.balance -= transfer.amount
        session.add(to_acc)
    session.delete(transfer)
    session.commit()
