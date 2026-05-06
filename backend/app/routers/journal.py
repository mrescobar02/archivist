from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..db.session import get_session
from ..models.journal import JournalEntry
from ..schemas.journal import JournalEntryCreate, JournalEntryUpdate, JournalEntryRead

router = APIRouter(prefix="/journal", tags=["journal"])


@router.get("", response_model=List[JournalEntryRead])
def list_entries(session: Session = Depends(get_session)):
    return session.exec(select(JournalEntry).order_by(JournalEntry.created_at.desc())).all()


@router.post("", response_model=JournalEntryRead, status_code=201)
def create_entry(body: JournalEntryCreate, session: Session = Depends(get_session)):
    entry = JournalEntry(**body.model_dump())
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return entry


@router.put("/{entry_id}", response_model=JournalEntryRead)
def update_entry(entry_id: int, body: JournalEntryUpdate, session: Session = Depends(get_session)):
    entry = session.get(JournalEntry, entry_id)
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
def delete_entry(entry_id: int, session: Session = Depends(get_session)):
    entry = session.get(JournalEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    session.delete(entry)
    session.commit()
