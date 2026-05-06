from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, field_validator


class GoalCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    name: str
    target_amount: Decimal
    target_date: Optional[date] = None
    icon: str = "savings"

    @field_validator('target_amount')
    @classmethod
    def amount_positive(cls, v):
        if v <= 0:
            raise ValueError('Target amount must be a positive number')
        return v


class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[Decimal] = None
    current_amount: Optional[Decimal] = None
    target_date: Optional[date] = None
    icon: Optional[str] = None


class GoalRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    target_amount: float
    current_amount: float
    target_date: Optional[date]
    icon: str
    created_at: datetime


class GoalContributionCreate(BaseModel):
    amount: Decimal
    date: date
    note: str = ""


class GoalContributionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    goal_id: int
    amount: float
    date: date
    note: str
