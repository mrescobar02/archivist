from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from ..db.session import get_session
from ..core.auth import get_current_user, CurrentUser
from ..models.savings import SavingsFund, SavingsContribution
from ..schemas.savings import (
    SavingsFundCreate, SavingsFundUpdate, SavingsFundRead,
    SavingsContributionCreate, SavingsContributionRead,
)

router = APIRouter(prefix="/savings", tags=["savings"])


@router.get("/funds", response_model=List[SavingsFundRead])
def list_funds(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    return session.exec(
        select(SavingsFund).where(SavingsFund.user_id == current_user.user_id).order_by(SavingsFund.name)
    ).all()


@router.post("/funds", response_model=SavingsFundRead, status_code=201)
def create_fund(
    body: SavingsFundCreate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    fund = SavingsFund(user_id=current_user.user_id, **body.model_dump())
    session.add(fund)
    session.commit()
    session.refresh(fund)
    return fund


@router.put("/funds/{fund_id}", response_model=SavingsFundRead)
def update_fund(
    fund_id: int,
    body: SavingsFundUpdate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    fund = session.exec(
        select(SavingsFund).where(SavingsFund.id == fund_id, SavingsFund.user_id == current_user.user_id)
    ).first()
    if not fund:
        raise HTTPException(status_code=404, detail="Savings fund not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(fund, field, value)
    session.add(fund)
    session.commit()
    session.refresh(fund)
    return fund


@router.delete("/funds/{fund_id}", status_code=204)
def delete_fund(
    fund_id: int,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    fund = session.exec(
        select(SavingsFund).where(SavingsFund.id == fund_id, SavingsFund.user_id == current_user.user_id)
    ).first()
    if not fund:
        raise HTTPException(status_code=404, detail="Savings fund not found")
    for c in session.exec(select(SavingsContribution).where(SavingsContribution.fund_id == fund_id)).all():
        session.delete(c)
    session.delete(fund)
    session.commit()


@router.get("/contributions", response_model=List[SavingsContributionRead])
def list_contributions(
    fund_id: Optional[int] = Query(None),
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    if fund_id:
        fund = session.exec(
            select(SavingsFund).where(SavingsFund.id == fund_id, SavingsFund.user_id == current_user.user_id)
        ).first()
        if not fund:
            raise HTTPException(status_code=404, detail="Savings fund not found")
        q = select(SavingsContribution).where(SavingsContribution.fund_id == fund_id)
    else:
        user_fund_ids = [
            f.id for f in session.exec(
                select(SavingsFund).where(SavingsFund.user_id == current_user.user_id)
            ).all()
        ]
        q = select(SavingsContribution).where(SavingsContribution.fund_id.in_(user_fund_ids))
    return session.exec(q.order_by(SavingsContribution.date.desc())).all()


@router.post("/contributions", response_model=SavingsContributionRead, status_code=201)
def create_contribution(
    body: SavingsContributionCreate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    fund = session.exec(
        select(SavingsFund).where(SavingsFund.id == body.fund_id, SavingsFund.user_id == current_user.user_id)
    ).first()
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
def delete_contribution(
    contribution_id: int,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    contribution = session.get(SavingsContribution, contribution_id)
    if not contribution:
        raise HTTPException(status_code=404, detail="Contribution not found")
    fund = session.exec(
        select(SavingsFund).where(SavingsFund.id == contribution.fund_id, SavingsFund.user_id == current_user.user_id)
    ).first()
    if not fund:
        raise HTTPException(status_code=404, detail="Contribution not found")
    fund.amount -= contribution.amount
    session.add(fund)
    session.delete(contribution)
    session.commit()
