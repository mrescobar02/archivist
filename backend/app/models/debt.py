from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from sqlmodel import SQLModel, Field
from sqlalchemy import Numeric, Column


class Debt(SQLModel, table=True):
    __tablename__ = "debts"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    name: str
    creditor: str = Field(default="")
    total_amount: Decimal = Field(sa_column=Column(Numeric(12, 2)))
    remaining_balance: Decimal = Field(sa_column=Column(Numeric(12, 2)))
    interest_rate: Decimal = Field(default=Decimal("0.00"), sa_column=Column(Numeric(5, 2)))
    minimum_payment: Decimal = Field(default=Decimal("0.00"), sa_column=Column(Numeric(12, 2)))
    cut_date: Optional[int] = Field(default=None)
    payment_due_day: Optional[int] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DebtPayment(SQLModel, table=True):
    __tablename__ = "debt_payments"

    id: Optional[int] = Field(default=None, primary_key=True)
    debt_id: int = Field(foreign_key="debts.id")
    amount: Decimal = Field(sa_column=Column(Numeric(12, 2)))
    date: date
    note: str = Field(default="")
