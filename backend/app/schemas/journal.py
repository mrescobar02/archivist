from typing import Optional
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class JournalEntryCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    title: str = Field(..., max_length=200)
    content: str = Field(..., max_length=20_000)
    mood: Optional[Literal["stressed", "neutral", "positive"]] = None


class JournalEntryUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    content: Optional[str] = Field(None, max_length=20_000)
    mood: Optional[Literal["stressed", "neutral", "positive"]] = None


class JournalEntryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    content: str
    mood: Optional[str]
    created_at: datetime
    updated_at: datetime
