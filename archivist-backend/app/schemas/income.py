from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, field_validator


class IncomeCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    amount: Decimal
    date: date
    type: str = "salary"
    description: str = ""
    account_id: int
    source: str = ""

    @field_validator('amount')
    @classmethod
    def amount_positive(cls, v):
        if v <= 0:
            raise ValueError('Amount must be a positive number')
        return v


class IncomeUpdate(BaseModel):
    amount: Optional[Decimal] = None
    date: Optional[date] = None
    type: Optional[str] = None
    description: Optional[str] = None
    account_id: Optional[int] = None
    source: Optional[str] = None


class IncomeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    amount: float
    date: date
    type: str
    description: str
    account_id: int
    source: str
    created_at: datetime
