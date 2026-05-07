from typing import Optional
from datetime import datetime
from decimal import Decimal
from sqlmodel import SQLModel, Field
from sqlalchemy import Numeric, Column
from .enums import AccountType


class Account(SQLModel, table=True):
    __tablename__ = "accounts"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    name: str = Field(index=True)
    type: AccountType = Field(default=AccountType.checking)
    balance: Decimal = Field(default=Decimal("0.00"), sa_column=Column(Numeric(12, 2)))
    initial_balance: Decimal = Field(default=Decimal("0.00"), sa_column=Column(Numeric(12, 2)))
    created_at: datetime = Field(default_factory=datetime.utcnow)
