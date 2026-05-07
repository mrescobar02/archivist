from datetime import datetime
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from ..db.session import get_session
from ..core.auth import get_current_user, CurrentUser
from ..models.profile import UserProfile
from ..schemas.profile import ProfileUpdate, ProfileRead
from ..services.seed import seed_categories, seed_distribution

router = APIRouter(prefix="/profile", tags=["profile"])


def _get_or_create(session: Session, user_id: str) -> UserProfile:
    profile = session.exec(
        select(UserProfile).where(UserProfile.user_id == user_id)
    ).first()
    if not profile:
        profile = UserProfile(user_id=user_id)
        session.add(profile)
        session.commit()
        session.refresh(profile)
        seed_categories(session, user_id)
        seed_distribution(session, user_id)
    return profile


@router.get("", response_model=ProfileRead)
def get_profile(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    return _get_or_create(session, current_user.user_id)


@router.put("", response_model=ProfileRead)
def update_profile(
    body: ProfileUpdate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    profile = _get_or_create(session, current_user.user_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    profile.updated_at = datetime.utcnow()
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile
