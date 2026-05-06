from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, Text


class FinancialAnalysis(SQLModel, table=True):
    __tablename__ = "financial_analyses"
    id: Optional[int] = Field(default=None, primary_key=True)
    text: str = Field(sa_column=Column(Text))
    created_at: datetime = Field(default_factory=datetime.utcnow)
