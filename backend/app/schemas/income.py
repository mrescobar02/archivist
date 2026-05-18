from typing import Optional
import datetime as dt
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, field_validator


class IncomeCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    amount: Decimal
    date: dt.date
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
    date: Optional[dt.date] = None
    type: Optional[str] = None
    description: Optional[str] = None
    account_id: Optional[int] = None
    source: Optional[str] = None

    @field_validator('date', mode='before')
    @classmethod
    def parse_date(cls, v):
        if v is None:
            return None
        if isinstance(v, dt.date):
            return v
        try:
            return dt.date.fromisoformat(str(v))
        except (ValueError, TypeError):
            raise ValueError(f'Invalid date: {v}')


class IncomeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    amount: float
    date: dt.date
    type: str
    description: str
    account_id: int
    source: str
    created_at: dt.datetime
