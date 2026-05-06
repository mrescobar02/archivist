from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from ..models.enums import ReceiptScanStatus


class ReceiptScanUpdate(BaseModel):
    merchant: Optional[str] = None
    amount: Optional[Decimal] = None
    date: Optional[date] = None
    category_id: Optional[int] = None


class ReceiptScanSave(BaseModel):
    account_id: int
    description: str = ""
    expense_type: str = "variable"


class ReceiptScanRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    image_path: str
    merchant: Optional[str]
    amount: Optional[Decimal]
    date: Optional[date]
    category_id: Optional[int]
    raw_text: Optional[str]
    status: ReceiptScanStatus
    created_at: datetime
