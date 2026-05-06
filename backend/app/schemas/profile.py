from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Literal


class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    financial_status: Optional[str] = None
    financial_goals_text: Optional[str] = None
    concerns: Optional[str] = None
    risk_tolerance: Optional[Literal["conservative", "moderate", "aggressive"]] = None
    notes: Optional[str] = None
    language: Optional[Literal["es", "en"]] = None


class ProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    display_name: Optional[str]
    financial_status: Optional[str]
    financial_goals_text: Optional[str]
    concerns: Optional[str]
    risk_tolerance: str
    notes: Optional[str]
    language: str
    rewards_enabled: bool
    updated_at: datetime
