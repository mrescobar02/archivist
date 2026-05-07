from decimal import Decimal
from sqlmodel import Session, select
from ..models.category import Category
from ..models.distribution import IncomeDistribution

DEFAULT_CATEGORIES = [
    {"name": "Housing", "icon": "home", "color": "#5f5e5e"},
    {"name": "Food", "icon": "restaurant", "color": "#5f5e5e"},
    {"name": "Transport", "icon": "directions_car", "color": "#5f5e5e"},
    {"name": "Entertainment", "icon": "movie", "color": "#5f5e5e"},
    {"name": "Utilities", "icon": "bolt", "color": "#5f5e5e"},
    {"name": "Health", "icon": "health_and_safety", "color": "#5f5e5e"},
    {"name": "Savings", "icon": "savings", "color": "#5f5e5e"},
    {"name": "Education", "icon": "school", "color": "#5f5e5e"},
    {"name": "Shopping", "icon": "shopping_bag", "color": "#5f5e5e"},
    {"name": "Other", "icon": "label", "color": "#5f5e5e"},
]

DEFAULT_DISTRIBUTION = [
    {"category": "fixed_expenses", "percentage": Decimal("40.00")},
    {"category": "variable_expenses", "percentage": Decimal("20.00")},
    {"category": "savings", "percentage": Decimal("20.00")},
    {"category": "goals", "percentage": Decimal("10.00")},
    {"category": "debts", "percentage": Decimal("10.00")},
]


def seed_categories(session: Session, user_id: str) -> None:
    existing = session.exec(
        select(Category).where(Category.user_id == user_id)
    ).first()
    if existing is not None:
        return
    for cat in DEFAULT_CATEGORIES:
        session.add(Category(user_id=user_id, **cat))
    session.commit()


def seed_distribution(session: Session, user_id: str) -> None:
    existing = session.exec(
        select(IncomeDistribution).where(IncomeDistribution.user_id == user_id)
    ).first()
    if existing is not None:
        return
    for d in DEFAULT_DISTRIBUTION:
        session.add(IncomeDistribution(user_id=user_id, **d))
    session.commit()
