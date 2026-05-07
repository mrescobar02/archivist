from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..db.session import get_session
from ..core.auth import get_current_user, CurrentUser
from ..models.goal import Goal, GoalContribution
from ..models.savings import SavingsFund
from ..schemas.goal import GoalCreate, GoalUpdate, GoalRead, GoalContributionCreate, GoalContributionRead

router = APIRouter(prefix="/goals", tags=["goals"])


@router.get("", response_model=List[GoalRead])
def list_goals(
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    return session.exec(
        select(Goal).where(Goal.user_id == current_user.user_id).order_by(Goal.name)
    ).all()


@router.post("", response_model=GoalRead, status_code=201)
def create_goal(
    body: GoalCreate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    goal = Goal(user_id=current_user.user_id, **body.model_dump())
    session.add(goal)
    session.commit()
    session.refresh(goal)
    return goal


@router.get("/{goal_id}", response_model=GoalRead)
def get_goal(
    goal_id: int,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    goal = session.exec(
        select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.user_id)
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


@router.put("/{goal_id}", response_model=GoalRead)
def update_goal(
    goal_id: int,
    body: GoalUpdate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    goal = session.exec(
        select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.user_id)
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(goal, field, value)
    session.add(goal)
    session.commit()
    session.refresh(goal)
    return goal


@router.delete("/{goal_id}", status_code=204)
def delete_goal(
    goal_id: int,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    goal = session.exec(
        select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.user_id)
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    for c in session.exec(select(GoalContribution).where(GoalContribution.goal_id == goal_id)).all():
        session.delete(c)
    for f in session.exec(
        select(SavingsFund).where(SavingsFund.goal_id == goal_id, SavingsFund.user_id == current_user.user_id)
    ).all():
        f.goal_id = None
        session.add(f)
    session.delete(goal)
    session.commit()


@router.get("/{goal_id}/contributions", response_model=List[GoalContributionRead])
def list_goal_contributions(
    goal_id: int,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    goal = session.exec(
        select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.user_id)
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return session.exec(
        select(GoalContribution).where(GoalContribution.goal_id == goal_id).order_by(GoalContribution.date.desc())
    ).all()


@router.post("/{goal_id}/contributions", response_model=GoalContributionRead, status_code=201)
def create_goal_contribution(
    goal_id: int,
    body: GoalContributionCreate,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    goal = session.exec(
        select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.user_id)
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    contribution = GoalContribution(goal_id=goal_id, amount=body.amount, date=body.date, note=body.note)
    goal.current_amount += body.amount
    session.add(contribution)
    session.add(goal)
    session.commit()
    session.refresh(contribution)
    return contribution


@router.delete("/{goal_id}/contributions/{contribution_id}", status_code=204)
def delete_goal_contribution(
    goal_id: int,
    contribution_id: int,
    session: Session = Depends(get_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    goal = session.exec(
        select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.user_id)
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    contribution = session.get(GoalContribution, contribution_id)
    if not contribution or contribution.goal_id != goal_id:
        raise HTTPException(status_code=404, detail="Contribution not found")
    goal.current_amount = max(goal.current_amount - contribution.amount, 0)
    session.add(goal)
    session.delete(contribution)
    session.commit()
