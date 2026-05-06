from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field


class UserReward(SQLModel, table=True):
    __tablename__ = "user_rewards"

    id: Optional[int] = Field(default=None, primary_key=True)
    reward_key: str = Field(index=True)
    earned_at: datetime = Field(default_factory=datetime.utcnow)
    is_seen: bool = Field(default=False)
