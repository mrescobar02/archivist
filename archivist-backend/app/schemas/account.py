from typing import Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, field_validator
from ..models.enums import AccountType


class AccountCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    name: str
    type: AccountType = AccountType.checking
    initial_balance: Decimal = Decimal("0.00")

    @field_validator('initial_balance')
    @classmethod
    def balance_non_negative(cls, v):
        if v < 0:
            raise ValueError('initial_balance must be >= 0')
        return v


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[AccountType] = None
    balance: Optional[Decimal] = None


class AccountRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    type: AccountType
    balance: float
    initial_balance: float
    created_at: datetime
