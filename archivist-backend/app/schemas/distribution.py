from typing import List
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, field_validator


class DistributionItem(BaseModel):
    model_config = ConfigDict(extra='forbid')
    category: str
    percentage: Decimal

    @field_validator('percentage')
    @classmethod
    def valid_percentage(cls, v):
        if not (Decimal("0") <= v <= Decimal("100")):
            raise ValueError('Percentage must be between 0 and 100')
        return v


class DistributionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    category: str
    percentage: float


class DistributionUpdate(BaseModel):
    items: List[DistributionItem]
