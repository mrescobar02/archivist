from typing import Optional
from sqlmodel import SQLModel, Field
from decimal import Decimal
from sqlalchemy import Numeric, Column


class IncomeDistribution(SQLModel, table=True):
    __tablename__ = "income_distributions"

    id: Optional[int] = Field(default=None, primary_key=True)
    category: str = Field(unique=True, index=True)
    percentage: Decimal = Field(sa_column=Column(Numeric(5, 2)))
