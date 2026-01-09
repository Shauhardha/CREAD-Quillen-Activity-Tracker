#app/routers/activity_goals.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.association import ActivityGoal
from app.models.activity import Activity
from app.models.strategic_goal import StrategicGoal
from typing import List
from pydantic import BaseModel

router = APIRouter(
    prefix="/activity-goals",
    tags=["Activity Goals"]
)

class ActivityGoalLinkedOut(BaseModel):
    activity_id: int
    activity_title: str
    goal_id: int
    goal_name: str

    class Config:
        from_attributes = True

@router.get("/", response_model=List[ActivityGoalLinkedOut])
def list_activity_goals(db: Session = Depends(get_db)):
    rows = (
        db.query(ActivityGoal.activity_id, Activity.title, ActivityGoal.goal_id, StrategicGoal.goal_name)
        .join(Activity, Activity.id == ActivityGoal.activity_id)
        .join(StrategicGoal, StrategicGoal.id == ActivityGoal.goal_id)
        .all()
    )

    return [ActivityGoalLinkedOut(
        activity_id=r.activity_id,
        activity_title=r.title,
        goal_id=r.goal_id,
        goal_name=r.goal_name
    ) for r in rows]

@router.post("/")
def add_activity_goal(
    activity_id: int,
    goal_id: int,
    db: Session = Depends(get_db)
):
    exists = db.query(ActivityGoal).filter_by(
        activity_id=activity_id,
        goal_id=goal_id
    ).first()
    if exists:
        raise HTTPException(400, "Association already exists")

    assoc = ActivityGoal(activity_id=activity_id, goal_id=goal_id)
    db.add(assoc)
    db.commit()
    return {"status": "ok"}

@router.delete("/")
def delete_activity_goal(
    activity_id: int,
    goal_id: int,
    db: Session = Depends(get_db)
):
    assoc = db.query(ActivityGoal).filter_by(
        activity_id=activity_id,
        goal_id=goal_id
    ).first()
    if not assoc:
        raise HTTPException(404, "Not found")

    db.delete(assoc)
    db.commit()
    return {"status": "deleted"}
