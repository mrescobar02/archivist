from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from sqlmodel import SQLModel, Field
from sqlalchemy import Numeric, Column


class SavingsFund(SQLModel, table=True):
    __tablename__ = "savings_funds"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    amount: Decimal = Field(default=Decimal("0.00"), sa_column=Column(Numeric(12, 2)))
    goal_id: Optional[int] = Field(default=None, foreign_key="goals.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SavingsContribution(SQLModel, table=True):
    __tablename__ = "savings_contributions"

    id: Optional[int] = Field(default=None, primary_key=True)
    fund_id: int = Field(foreign_key="savings_funds.id")
    amount: Decimal = Field(sa_column=Column(Numeric(12, 2)))
    date: date
    note: str = Field(default="")
