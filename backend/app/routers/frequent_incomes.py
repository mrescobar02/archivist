from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..db.session import get_session
from ..core.auth import get_current_user, CurrentUser
from ..models.frequent_income import FrequentIncome
from ..schemas.frequent_income import FrequentIncomeCreate, FrequentIncomeRead

router = APIRouter(prefix="/frequent-incomes", tags=["frequent-incomes"])


@router.get("", response_model=List[FrequentIncomeRead])
def list_frequent_incomes(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    return session.exec(
        select(FrequentIncome)
        .where(FrequentIncome.user_id == current_user.user_id)
        .order_by(FrequentIncome.name)
    ).all()


@router.post("", response_model=FrequentIncomeRead, status_code=201)
def create_frequent_income(
    body: FrequentIncomeCreate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    fi = FrequentIncome(user_id=current_user.user_id, **body.model_dump())
    session.add(fi)
    session.commit()
    session.refresh(fi)
    return fi


@router.delete("/{fi_id}", status_code=204)
def delete_frequent_income(
    fi_id: int,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    fi = session.exec(
        select(FrequentIncome).where(
            FrequentIncome.id == fi_id,
            FrequentIncome.user_id == current_user.user_id,
        )
    ).first()
    if not fi:
        raise HTTPException(status_code=404, detail="Not found")
    session.delete(fi)
    session.commit()
