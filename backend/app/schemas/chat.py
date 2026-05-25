from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator

_ALLOWED_ROLES = {"user", "assistant"}
_ALLOWED_KINDS = {"text"}


class ChatConversationCreate(BaseModel):
    title: str = Field("New conversation", max_length=200)


class ChatConversationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    created_at: datetime


class ChatMessageCreate(BaseModel):
    role: str = Field(..., max_length=20)
    content: str = Field(..., max_length=10_000)
    kind: str = Field("text", max_length=20)

    @field_validator("role")
    @classmethod
    def role_allowed(cls, v: str) -> str:
        if v not in _ALLOWED_ROLES:
            raise ValueError(f"role must be one of {_ALLOWED_ROLES}")
        return v

    @field_validator("kind")
    @classmethod
    def kind_allowed(cls, v: str) -> str:
        if v not in _ALLOWED_KINDS:
            raise ValueError(f"kind must be one of {_ALLOWED_KINDS}")
        return v


class ChatMessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    conversation_id: int
    role: str
    content: str
    kind: str
    created_at: datetime
