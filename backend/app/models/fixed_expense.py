from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from sqlmodel import SQLModel, Field
from sqlalchemy import Numeric, Column
from .enums import Frequency


class FixedExpense(SQLModel, table=True):
    __tablename__ = "fixed_expenses"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    name: str
    amount: Decimal = Field(sa_column=Column(Numeric(12, 2)))
    category_id: Optional[int] = Field(default=None, foreign_key="categories.id")
    payment_day: int = Field(default=1, ge=1, le=31)
    renewal_date: Optional[date] = None
    frequency: Frequency = Field(default=Frequency.monthly)
    last_paid: Optional[date] = None
    account_id: Optional[int] = Field(default=None, foreign_key="accounts.id")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
