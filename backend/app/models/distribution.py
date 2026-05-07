from typing import Optional, Tuple, Any
from sqlmodel import SQLModel, Field
from sqlalchemy import Numeric, Column, UniqueConstraint
from decimal import Decimal


class IncomeDistribution(SQLModel, table=True):
    __tablename__ = "income_distributions"
    __table_args__: Tuple[Any, ...] = (UniqueConstraint("category", "user_id"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    category: str = Field(index=True)
    percentage: Decimal = Field(sa_column=Column(Numeric(5, 2)))
