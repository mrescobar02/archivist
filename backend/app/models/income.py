from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from sqlmodel import SQLModel, Field
from sqlalchemy import Numeric, Column


class Income(SQLModel, table=True):
    __tablename__ = "incomes"

    id: Optional[int] = Field(default=None, primary_key=True)
    amount: Decimal = Field(sa_column=Column(Numeric(12, 2)))
    date: date
    type: str = Field(default="salary")
    description: str = Field(default="")
    account_id: int = Field(foreign_key="accounts.id")
    source: str = Field(default="")
    created_at: datetime = Field(default_factory=datetime.utcnow)
