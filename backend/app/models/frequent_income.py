from typing import Optional
from decimal import Decimal
from datetime import datetime
from sqlmodel import SQLModel, Field
from sqlalchemy import Numeric, Column


class FrequentIncome(SQLModel, table=True):
    __tablename__ = "frequent_incomes"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    name: str
    amount: Decimal = Field(sa_column=Column(Numeric(12, 2)))
    type: str = Field(default="salary")
    source: str = Field(default="")
    created_at: datetime = Field(default_factory=datetime.utcnow)
