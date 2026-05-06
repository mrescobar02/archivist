from typing import Optional
from pydantic import BaseModel, ConfigDict


class CategoryCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    name: str
    icon: str = "label"
    color: str = "#5f5e5e"


class CategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    icon: str
    color: str
