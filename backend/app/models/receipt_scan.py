from typing import Optional
from datetime import date as DateType, datetime
from decimal import Decimal
from sqlmodel import SQLModel, Field
from sqlalchemy import Numeric, Column, String, Date
from .enums import ReceiptScanStatus


class ReceiptScan(SQLModel, table=True):
    __tablename__ = "receipt_scans"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    image_path: str = Field(default="")
    merchant: Optional[str] = Field(default=None, sa_column=Column(String, nullable=True))
    amount: Optional[Decimal] = Field(default=None, sa_column=Column(Numeric(12, 2), nullable=True))
    date: Optional[DateType] = Field(default=None, sa_column=Column(Date, nullable=True))
    category_id: Optional[int] = Field(default=None, foreign_key="categories.id")
    raw_text: Optional[str] = Field(default=None, sa_column=Column(String, nullable=True))
    status: ReceiptScanStatus = Field(default=ReceiptScanStatus.pending)
    created_at: datetime = Field(default_factory=datetime.utcnow)
