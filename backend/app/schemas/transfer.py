from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, field_validator


class TransferCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    from_account_id: int
    to_account_id: int
    amount: Decimal
    date: date
    note: str = ""

    @field_validator('amount')
    @classmethod
    def amount_positive(cls, v):
        if v <= 0:
            raise ValueError('Amount must be a positive number')
        return v


class TransferRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    from_account_id: int
    to_account_id: int
    amount: Decimal
    date: date
    note: str
    created_at: datetime
