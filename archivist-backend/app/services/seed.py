from sqlmodel import Session, select
from ..models.category import Category

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


def seed_categories(session: Session):
    existing = session.exec(select(Category)).first()
    if existing is not None:
        return
    for cat in DEFAULT_CATEGORIES:
        session.add(Category(**cat))
    session.commit()
