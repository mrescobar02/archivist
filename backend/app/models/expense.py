from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from sqlmodel import SQLModel, Field
from sqlalchemy import Numeric, Column
from .enums import ExpenseType


class Expense(SQLModel, table=True):
    __tablename__ = "expenses"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    amount: Decimal = Field(sa_column=Column(Numeric(12, 2)))
    date: date
    category_id: Optional[int] = Field(default=None, foreign_key="categories.id")
    description: str = Field(default="")
    account_id: int = Field(foreign_key="accounts.id")
    expense_type: ExpenseType = Field(default=ExpenseType.variable)
    created_at: datetime = Field(default_factory=datetime.utcnow)
