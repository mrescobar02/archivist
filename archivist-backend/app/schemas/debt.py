from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, field_validator


class DebtCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    name: str
    creditor: str = ""
    total_amount: Decimal
    remaining_balance: Decimal
    interest_rate: Decimal = Decimal("0.00")
    minimum_payment: Decimal = Decimal("0.00")
    cut_date: Optional[int] = None
    payment_due_day: Optional[int] = None

    @field_validator('total_amount', 'remaining_balance')
    @classmethod
    def amount_positive(cls, v):
        if v <= 0:
            raise ValueError('Amount must be a positive number')
        return v


class DebtUpdate(BaseModel):
    name: Optional[str] = None
    creditor: Optional[str] = None
    total_amount: Optional[Decimal] = None
    remaining_balance: Optional[Decimal] = None
    interest_rate: Optional[Decimal] = None
    minimum_payment: Optional[Decimal] = None
    cut_date: Optional[int] = None
    payment_due_day: Optional[int] = None


class DebtRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    creditor: str
    total_amount: float
    remaining_balance: float
    interest_rate: float
    minimum_payment: float
    cut_date: Optional[int]
    payment_due_day: Optional[int]
    created_at: datetime


class DebtPaymentCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    amount: Decimal
    date: date
    note: str = ""

    @field_validator('amount')
    @classmethod
    def amount_positive(cls, v):
        if v <= 0:
            raise ValueError('Amount must be a positive number')
        return v


class DebtPaymentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    debt_id: int
    amount: float
    date: date
    note: str
