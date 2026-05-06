from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, field_validator
from ..models.enums import Frequency


class FixedExpenseCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    name: str
    amount: Decimal
    category_id: Optional[int] = None
    payment_day: int = 1
    renewal_date: Optional[date] = None
    frequency: Frequency = Frequency.monthly
    last_paid: Optional[date] = None
    account_id: Optional[int] = None
    is_active: bool = True

    @field_validator('amount')
    @classmethod
    def amount_positive(cls, v):
        if v <= 0:
            raise ValueError('Amount must be a positive number')
        return v


class FixedExpenseUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[Decimal] = None
    category_id: Optional[int] = None
    payment_day: Optional[int] = None
    renewal_date: Optional[date] = None
    frequency: Optional[Frequency] = None
    last_paid: Optional[date] = None
    account_id: Optional[int] = None
    is_active: Optional[bool] = None


class FixedExpenseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    amount: float
    category_id: Optional[int]
    payment_day: int
    renewal_date: Optional[date]
    frequency: Frequency
    last_paid: Optional[date]
    account_id: Optional[int]
    is_active: bool
    created_at: datetime


class UpcomingFixedExpense(BaseModel):
    id: int
    name: str
    amount: float
    payment_day: int
    next_due_date: date
    days_until_due: int
    account_id: Optional[int]
