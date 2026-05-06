from typing import Optional
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict


class JournalEntryCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    title: str
    content: str
    mood: Optional[Literal["stressed", "neutral", "positive"]] = None


class JournalEntryUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    mood: Optional[Literal["stressed", "neutral", "positive"]] = None


class JournalEntryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    content: str
    mood: Optional[str]
    created_at: datetime
    updated_at: datetime
