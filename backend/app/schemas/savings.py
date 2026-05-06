from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, field_validator


class SavingsFundCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    name: str
    amount: Decimal = Decimal("0.00")
    goal_id: Optional[int] = None

    @field_validator('amount')
    @classmethod
    def amount_non_negative(cls, v):
        if v < 0:
            raise ValueError('Amount must be >= 0')
        return v


class SavingsFundUpdate(BaseModel):
    name: Optional[str] = None
    goal_id: Optional[int] = None


class SavingsFundRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    amount: float
    goal_id: Optional[int]
    created_at: datetime


class SavingsContributionCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    fund_id: int
    amount: Decimal
    date: date
    note: str = ""

    @field_validator('amount')
    @classmethod
    def amount_positive(cls, v):
        if v <= 0:
            raise ValueError('Amount must be a positive number')
        return v


class SavingsContributionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    fund_id: int
    amount: Decimal
    date: date
    note: str
