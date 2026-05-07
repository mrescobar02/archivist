from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..db.session import get_session
from ..core.auth import get_current_user, CurrentUser
from ..models.journal import JournalEntry
from ..schemas.journal import JournalEntryCreate, JournalEntryUpdate, JournalEntryRead

router = APIRouter(prefix="/journal", tags=["journal"])


@router.get("", response_model=List[JournalEntryRead])
def list_entries(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    return session.exec(
        select(JournalEntry).where(JournalEntry.user_id == current_user.user_id).order_by(JournalEntry.created_at.desc())
    ).all()


@router.post("", response_model=JournalEntryRead, status_code=201)
def create_entry(
    body: JournalEntryCreate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    entry = JournalEntry(user_id=current_user.user_id, **body.model_dump())
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return entry


@router.put("/{entry_id}", response_model=JournalEntryRead)
def update_entry(
    entry_id: int,
    body: JournalEntryUpdate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    entry = session.exec(
        select(JournalEntry).where(JournalEntry.id == entry_id, JournalEntry.user_id == current_user.user_id)
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)
    entry.updated_at = datetime.utcnow()
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=204)
def delete_entry(
    entry_id: int,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    entry = session.exec(
        select(JournalEntry).where(JournalEntry.id == entry_id, JournalEntry.user_id == current_user.user_id)
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    session.delete(entry)
    session.commit()
