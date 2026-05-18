from decimal import Decimal
from pydantic import BaseModel, ConfigDict, field_validator


class FrequentIncomeCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    name: str
    amount: Decimal
    type: str = "salary"
    source: str = ""

    @field_validator('amount')
    @classmethod
    def amount_positive(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        return v


class FrequentIncomeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    amount: float
    type: str
    source: str
