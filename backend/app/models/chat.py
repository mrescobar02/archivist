from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field, Column, Text


class ChatConversation(SQLModel, table=True):
    __tablename__ = "chat_conversations"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    title: str = Field(default="New conversation")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ChatMessage(SQLModel, table=True):
    __tablename__ = "chat_messages"

    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="chat_conversations.id")
    role: str
    content: str = Field(sa_column=Column(Text))
    kind: str = Field(default="text")
    created_at: datetime = Field(default_factory=datetime.utcnow)
