from typing import List
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..db.session import get_session
from ..models.debt import Debt, DebtPayment
from ..schemas.debt import DebtCreate, DebtUpdate, DebtRead, DebtPaymentCreate, DebtPaymentRead

router = APIRouter(prefix="/debts", tags=["debts"])


@router.get("", response_model=List[DebtRead])
def list_debts(session: Session = Depends(get_session)):
    return session.exec(select(Debt).order_by(Debt.name)).all()


@router.post("", response_model=DebtRead, status_code=201)
def create_debt(body: DebtCreate, session: Session = Depends(get_session)):
    debt = Debt(**body.model_dump())
    session.add(debt)
    session.commit()
    session.refresh(debt)
    return debt


@router.get("/{debt_id}", response_model=DebtRead)
def get_debt(debt_id: int, session: Session = Depends(get_session)):
    debt = session.get(Debt, debt_id)
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    return debt


@router.put("/{debt_id}", response_model=DebtRead)
def update_debt(debt_id: int, body: DebtUpdate, session: Session = Depends(get_session)):
    debt = session.get(Debt, debt_id)
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(debt, field, value)
    session.add(debt)
    session.commit()
    session.refresh(debt)
    return debt


@router.delete("/{debt_id}", status_code=204)
def delete_debt(debt_id: int, session: Session = Depends(get_session)):
    debt = session.get(Debt, debt_id)
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    has_payments = session.exec(select(DebtPayment).where(DebtPayment.debt_id == debt_id)).first()
    if has_payments:
        raise HTTPException(status_code=409, detail="Debt has payment history — delete payments first")
    session.delete(debt)
    session.commit()


@router.get("/{debt_id}/payments", response_model=List[DebtPaymentRead])
def list_payments(debt_id: int, session: Session = Depends(get_session)):
    return session.exec(
        select(DebtPayment).where(DebtPayment.debt_id == debt_id).order_by(DebtPayment.date.desc())
    ).all()


@router.post("/{debt_id}/payments", response_model=DebtPaymentRead, status_code=201)
def create_payment(debt_id: int, body: DebtPaymentCreate, session: Session = Depends(get_session)):
    debt = session.get(Debt, debt_id)
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    payment = DebtPayment(debt_id=debt_id, **body.model_dump())
    debt.remaining_balance = max(Decimal("0.00"), debt.remaining_balance - body.amount)
    session.add(payment)
    session.add(debt)
    session.commit()
    session.refresh(payment)
    return payment


@router.delete("/{debt_id}/payments/{payment_id}", status_code=204)
def delete_payment(debt_id: int, payment_id: int, session: Session = Depends(get_session)):
    payment = session.get(DebtPayment, payment_id)
    if not payment or payment.debt_id != debt_id:
        raise HTTPException(status_code=404, detail="Payment not found")
    debt = session.get(Debt, debt_id)
    if debt:
        debt.remaining_balance += payment.amount
        session.add(debt)
    session.delete(payment)
    session.commit()
