from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field


class JournalEntry(SQLModel, table=True):
    __tablename__ = "journal_entries"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    content: str
    mood: Optional[str] = None  # stressed / neutral / positive
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
