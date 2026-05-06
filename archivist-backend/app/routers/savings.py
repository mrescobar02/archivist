from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from ..db.session import get_session
from ..models.savings import SavingsFund, SavingsContribution
from ..schemas.savings import (
    SavingsFundCreate, SavingsFundUpdate, SavingsFundRead,
    SavingsContributionCreate, SavingsContributionRead,
)

router = APIRouter(prefix="/savings", tags=["savings"])


@router.get("/funds", response_model=List[SavingsFundRead])
def list_funds(session: Session = Depends(get_session)):
    return session.exec(select(SavingsFund).order_by(SavingsFund.name)).all()


@router.post("/funds", response_model=SavingsFundRead, status_code=201)
def create_fund(body: SavingsFundCreate, session: Session = Depends(get_session)):
    fund = SavingsFund(**body.model_dump())
    session.add(fund)
    session.commit()
    session.refresh(fund)
    return fund


@router.put("/funds/{fund_id}", response_model=SavingsFundRead)
def update_fund(fund_id: int, body: SavingsFundUpdate, session: Session = Depends(get_session)):
    fund = session.get(SavingsFund, fund_id)
    if not fund:
        raise HTTPException(status_code=404, detail="Savings fund not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(fund, field, value)
    session.add(fund)
    session.commit()
    session.refresh(fund)
    return fund


@router.delete("/funds/{fund_id}", status_code=204)
def delete_fund(fund_id: int, session: Session = Depends(get_session)):
    fund = session.get(SavingsFund, fund_id)
    if not fund:
        raise HTTPException(status_code=404, detail="Savings fund not found")
    contributions = session.exec(
        select(SavingsContribution).where(SavingsContribution.fund_id == fund_id)
    ).all()
    for c in contributions:
        session.delete(c)
    session.delete(fund)
    session.commit()


@router.get("/contributions", response_model=List[SavingsContributionRead])
def list_contributions(
    fund_id: Optional[int] = Query(None),
    session: Session = Depends(get_session),
):
    q = select(SavingsContribution)
    if fund_id:
        q = q.where(SavingsContribution.fund_id == fund_id)
    return session.exec(q.order_by(SavingsContribution.date.desc())).all()


@router.post("/contributions", response_model=SavingsContributionRead, status_code=201)
def create_contribution(body: SavingsContributionCreate, session: Session = Depends(get_session)):
    fund = session.get(SavingsFund, body.fund_id)
    if not fund:
        raise HTTPException(status_code=404, detail="Savings fund not found")
    contribution = SavingsContribution(**body.model_dump())
    fund.amount += body.amount
    session.add(contribution)
    session.add(fund)
    session.commit()
    session.refresh(contribution)
    return contribution


@router.delete("/contributions/{contribution_id}", status_code=204)
def delete_contribution(contribution_id: int, session: Session = Depends(get_session)):
    contribution = session.get(SavingsContribution, contribution_id)
    if not contribution:
        raise HTTPException(status_code=404, detail="Contribution not found")
    fund = session.get(SavingsFund, contribution.fund_id)
    if fund:
        fund.amount -= contribution.amount
        session.add(fund)
    session.delete(contribution)
    session.commit()
