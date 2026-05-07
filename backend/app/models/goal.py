from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from sqlmodel import SQLModel, Field
from sqlalchemy import Numeric, Column


class Goal(SQLModel, table=True):
    __tablename__ = "goals"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    name: str
    target_amount: Decimal = Field(sa_column=Column(Numeric(12, 2)))
    current_amount: Decimal = Field(default=Decimal("0.00"), sa_column=Column(Numeric(12, 2)))
    target_date: Optional[date] = None
    icon: str = Field(default="savings")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class GoalContribution(SQLModel, table=True):
    __tablename__ = "goal_contributions"

    id: Optional[int] = Field(default=None, primary_key=True)
    goal_id: int = Field(foreign_key="goals.id")
    amount: Decimal = Field(sa_column=Column(Numeric(12, 2)))
    date: date
    note: str = Field(default="")
