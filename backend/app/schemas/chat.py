from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ChatConversationCreate(BaseModel):
    title: str = "New conversation"


class ChatConversationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    created_at: datetime


class ChatMessageCreate(BaseModel):
    role: str
    content: str
    kind: str = "text"


class ChatMessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    conversation_id: int
    role: str
    content: str
    kind: str
    created_at: datetime
