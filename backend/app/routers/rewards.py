from datetime import datetime
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from pydantic import BaseModel
from ..db.session import get_session
from ..core.auth import get_current_user, CurrentUser
from ..models.reward import UserReward
from ..models.profile import UserProfile
from ..services.rewards import check_and_award, build_rewards_response

router = APIRouter(prefix="/rewards", tags=["rewards"])


@router.get("")
def get_rewards(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    check_and_award(session, current_user.user_id)
    return build_rewards_response(session, current_user.user_id)


@router.post("/check")
def trigger_check(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    newly = check_and_award(session, current_user.user_id)
    return {"newly_earned": newly}


@router.put("/seen")
def mark_all_seen(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    for r in session.exec(
        select(UserReward).where(
            UserReward.user_id == current_user.user_id,
            UserReward.is_seen == False,
        )
    ).all():
        r.is_seen = True
        session.add(r)
    session.commit()
    return {"ok": True}


class SettingsUpdate(BaseModel):
    rewards_enabled: bool


@router.put("/settings")
def update_settings(
    body: SettingsUpdate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    profile = session.exec(
        select(UserProfile).where(UserProfile.user_id == current_user.user_id)
    ).first()
    if not profile:
        profile = UserProfile(user_id=current_user.user_id, rewards_enabled=body.rewards_enabled)
        session.add(profile)
    else:
        profile.rewards_enabled = body.rewards_enabled
        profile.updated_at = datetime.utcnow()
        session.add(profile)
    session.commit()
    return {"rewards_enabled": body.rewards_enabled}
