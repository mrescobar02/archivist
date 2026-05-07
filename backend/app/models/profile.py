from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field


class UserProfile(SQLModel, table=True):
    __tablename__ = "user_profile"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(unique=True, index=True)
    display_name: Optional[str] = None
    financial_status: Optional[str] = None
    financial_goals_text: Optional[str] = None
    concerns: Optional[str] = None
    risk_tolerance: str = Field(default="moderate")
    notes: Optional[str] = None
    rewards_enabled: bool = Field(default=True)
    language: str = Field(default="es")
    updated_at: datetime = Field(default_factory=datetime.utcnow)
