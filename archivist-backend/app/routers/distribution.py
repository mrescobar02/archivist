from typing import List
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..db.session import get_session
from ..models.distribution import IncomeDistribution
from ..schemas.distribution import DistributionRead, DistributionUpdate

router = APIRouter(prefix="/distribution", tags=["distribution"])

DEFAULT_DISTRIBUTION = [
    {"category": "fixed_expenses", "percentage": Decimal("40.00")},
    {"category": "variable_expenses", "percentage": Decimal("20.00")},
    {"category": "savings", "percentage": Decimal("20.00")},
    {"category": "goals", "percentage": Decimal("10.00")},
    {"category": "debts", "percentage": Decimal("10.00")},
]


@router.get("", response_model=List[DistributionRead])
def get_distribution(session: Session = Depends(get_session)):
    items = session.exec(select(IncomeDistribution)).all()
    if not items:
        # Seed defaults
        for d in DEFAULT_DISTRIBUTION:
            session.add(IncomeDistribution(**d))
        session.commit()
        items = session.exec(select(IncomeDistribution)).all()
    return items


@router.put("", response_model=List[DistributionRead])
def update_distribution(body: DistributionUpdate, session: Session = Depends(get_session)):
    total = sum(item.percentage for item in body.items)
    if not (Decimal("99.9") <= total <= Decimal("100.1")):
        raise HTTPException(status_code=422, detail=f"Percentages must sum to 100 (got {total})")
    # Replace all
    for existing in session.exec(select(IncomeDistribution)).all():
        session.delete(existing)
    session.flush()
    new_items = []
    for item in body.items:
        d = IncomeDistribution(category=item.category, percentage=item.percentage)
        session.add(d)
        new_items.append(d)
    session.commit()
    return session.exec(select(IncomeDistribution)).all()
