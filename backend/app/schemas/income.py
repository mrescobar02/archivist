from typing import Optional
import datetime as dt
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field, field_validator

_ALLOWED_TYPES = {"salary", "freelance", "investment", "rental", "business", "gift", "other"}


class IncomeCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    amount: Decimal
    date: dt.date
    type: str = Field("salary", max_length=50)
    description: str = Field("", max_length=500)
    account_id: int
    source: str = Field("", max_length=200)

    @field_validator('amount')
    @classmethod
    def amount_positive(cls, v):
        if v <= 0:
            raise ValueError('Amount must be a positive number')
        return v

    @field_validator('type')
    @classmethod
    def type_allowed(cls, v: str) -> str:
        if v not in _ALLOWED_TYPES:
            raise ValueError(f"type must be one of {_ALLOWED_TYPES}")
        return v


class IncomeUpdate(BaseModel):
    amount: Optional[Decimal] = None
    date: Optional[dt.date] = None
    type: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    account_id: Optional[int] = None
    source: Optional[str] = Field(None, max_length=200)

    @field_validator('type')
    @classmethod
    def type_allowed(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in _ALLOWED_TYPES:
            raise ValueError(f"type must be one of {_ALLOWED_TYPES}")
        return v

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
