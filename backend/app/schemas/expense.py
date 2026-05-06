from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, field_validator
from ..models.enums import ExpenseType


class ExpenseCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    amount: Decimal
    date: date
    category_id: Optional[int] = None
    description: str = ""
    account_id: int
    expense_type: ExpenseType = ExpenseType.variable

    @field_validator('amount')
    @classmethod
    def amount_positive(cls, v):
        if v <= 0:
            raise ValueError('Amount must be a positive number')
        return v


class ExpenseUpdate(BaseModel):
    amount: Optional[Decimal] = None
    date: Optional[date] = None
    category_id: Optional[int] = None
    description: Optional[str] = None
    account_id: Optional[int] = None
    expense_type: Optional[ExpenseType] = None


class ExpenseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    amount: float
    date: date
    category_id: Optional[int]
    description: str
    account_id: int
    expense_type: ExpenseType
    created_at: datetime
