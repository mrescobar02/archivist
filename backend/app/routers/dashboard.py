from fastapi import APIRouter, Depends
from sqlmodel import Session
from ..db.session import get_session
from ..core.auth import get_current_user, CurrentUser
from ..schemas.dashboard import DashboardSummary
from ..services.dashboard import get_dashboard_summary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    return get_dashboard_summary(session, current_user.user_id)
