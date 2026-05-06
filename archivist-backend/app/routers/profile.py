from datetime import datetime
from fastapi import APIRouter, Depends
from sqlmodel import Session
from ..db.session import get_session
from ..models.profile import UserProfile
from ..schemas.profile import ProfileUpdate, ProfileRead

router = APIRouter(prefix="/profile", tags=["profile"])


def _get_or_create(session: Session) -> UserProfile:
    profile = session.get(UserProfile, 1)
    if not profile:
        profile = UserProfile(id=1)
        session.add(profile)
        session.commit()
        session.refresh(profile)
    return profile


@router.get("", response_model=ProfileRead)
def get_profile(session: Session = Depends(get_session)):
    return _get_or_create(session)


@router.put("", response_model=ProfileRead)
def update_profile(body: ProfileUpdate, session: Session = Depends(get_session)):
    profile = _get_or_create(session)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    profile.updated_at = datetime.utcnow()
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile
