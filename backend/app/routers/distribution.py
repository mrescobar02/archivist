from typing import List
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..db.session import get_session
from ..core.auth import get_current_user, CurrentUser
from ..models.distribution import IncomeDistribution
from ..schemas.distribution import DistributionRead, DistributionUpdate
from ..services.seed import seed_distribution

router = APIRouter(prefix="/distribution", tags=["distribution"])


@router.get("", response_model=List[DistributionRead])
def get_distribution(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    items = session.exec(
        select(IncomeDistribution).where(IncomeDistribution.user_id == current_user.user_id)
    ).all()
    if not items:
        seed_distribution(session, current_user.user_id)
        items = session.exec(
            select(IncomeDistribution).where(IncomeDistribution.user_id == current_user.user_id)
        ).all()
    return items


@router.put("", response_model=List[DistributionRead])
def update_distribution(
    body: DistributionUpdate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    total = sum(item.percentage for item in body.items)
    if not (Decimal("99.9") <= total <= Decimal("100.1")):
        raise HTTPException(status_code=422, detail=f"Percentages must sum to 100 (got {total})")
    for existing in session.exec(
        select(IncomeDistribution).where(IncomeDistribution.user_id == current_user.user_id)
    ).all():
        session.delete(existing)
    session.flush()
    for item in body.items:
        session.add(IncomeDistribution(
            user_id=current_user.user_id,
            category=item.category,
            percentage=item.percentage,
        ))
    session.commit()
    return session.exec(
        select(IncomeDistribution).where(IncomeDistribution.user_id == current_user.user_id)
    ).all()
