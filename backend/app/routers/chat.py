from typing import List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..db.session import get_session
from ..core.auth import get_current_user, CurrentUser
from ..models.chat import ChatConversation, ChatMessage
from ..schemas.chat import ChatConversationCreate, ChatConversationRead, ChatMessageCreate, ChatMessageRead

router = APIRouter(prefix="/chat", tags=["chat"])

HISTORY_DAYS = 7


@router.get("/conversations", response_model=List[ChatConversationRead])
def list_conversations(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    cutoff = datetime.utcnow() - timedelta(days=HISTORY_DAYS)
    return session.exec(
        select(ChatConversation)
        .where(
            ChatConversation.user_id == current_user.user_id,
            ChatConversation.created_at >= cutoff,
        )
        .order_by(ChatConversation.created_at.desc())
    ).all()


@router.post("/conversations", response_model=ChatConversationRead, status_code=201)
def create_conversation(
    body: ChatConversationCreate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    conv = ChatConversation(user_id=current_user.user_id, title=body.title)
    session.add(conv)
    session.commit()
    session.refresh(conv)
    return conv


@router.delete("/conversations/{conv_id}", status_code=204)
def delete_conversation(
    conv_id: int,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    conv = session.exec(
        select(ChatConversation).where(
            ChatConversation.id == conv_id,
            ChatConversation.user_id == current_user.user_id,
        )
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    for msg in session.exec(select(ChatMessage).where(ChatMessage.conversation_id == conv_id)).all():
        session.delete(msg)
    session.delete(conv)
    session.commit()


@router.get("/conversations/{conv_id}/messages", response_model=List[ChatMessageRead])
def list_messages(
    conv_id: int,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    conv = session.exec(
        select(ChatConversation).where(
            ChatConversation.id == conv_id,
            ChatConversation.user_id == current_user.user_id,
        )
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return session.exec(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conv_id)
        .order_by(ChatMessage.created_at.asc())
    ).all()


@router.post("/conversations/{conv_id}/messages", response_model=ChatMessageRead, status_code=201)
def add_message(
    conv_id: int,
    body: ChatMessageCreate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    conv = session.exec(
        select(ChatConversation).where(
            ChatConversation.id == conv_id,
            ChatConversation.user_id == current_user.user_id,
        )
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    msg = ChatMessage(conversation_id=conv_id, role=body.role, content=body.content, kind=body.kind)
    session.add(msg)
    session.commit()
    session.refresh(msg)
    return msg
