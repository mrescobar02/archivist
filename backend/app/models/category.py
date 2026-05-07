from typing import Optional, Tuple, Any
from sqlmodel import SQLModel, Field
from sqlalchemy import UniqueConstraint


class Category(SQLModel, table=True):
    __tablename__ = "categories"
    __table_args__: Tuple[Any, ...] = (UniqueConstraint("name", "user_id"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    name: str = Field(index=True)
    icon: str = Field(default="label")
    color: str = Field(default="#5f5e5e")
