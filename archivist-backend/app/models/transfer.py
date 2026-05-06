from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from sqlmodel import SQLModel, Field
from sqlalchemy import Numeric, Column


class Transfer(SQLModel, table=True):
    __tablename__ = "transfers"

    id: Optional[int] = Field(default=None, primary_key=True)
    from_account_id: int = Field(foreign_key="accounts.id")
    to_account_id: int = Field(foreign_key="accounts.id")
    amount: Decimal = Field(sa_column=Column(Numeric(12, 2)))
    date: date
    note: str = Field(default="")
    created_at: datetime = Field(default_factory=datetime.utcnow)
