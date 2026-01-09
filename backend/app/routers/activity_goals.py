#app/routers/activity_goals.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.association import ActivityGoal
from app.models.activity import Activity
from app.models.strategic_goal import StrategicGoal
from typing import List
from pydantic import BaseModel
from sqlalchemy import text
    

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
    sql = text("""
        SELECT 
            acw.activity_id,
            a.title AS activity_title,
            acw.goal_id,
            c.goal_name AS goal_name
        FROM activity_goals acw
        JOIN activities a ON a.id = acw.activity_id
        JOIN strategic_goals c ON c.id = acw.goal_id
        WHERE a.deleted_at IS NULL
    """)

    rows = db.execute(sql).fetchall()

    return [
        {
            "activity_id": row.activity_id,
            "activity_title": row.activity_title,
            "goal_id": row.goal_id,
            "goal_name": row.goal_name
        }
        for row in rows
    ]

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

@router.get("/activity/{activity_id}", response_model=List[ActivityGoalLinkedOut])
def get_goals_for_activity(activity_id: int, db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT 
            ag.activity_id,
            a.title AS activity_title,
            ag.goal_id,
            sg.goal_name
        FROM activity_goals ag
        JOIN activities a ON a.id = ag.activity_id
        JOIN strategic_goals sg ON sg.id = ag.goal_id
        WHERE ag.activity_id = :activity_id
    """), {"activity_id": activity_id}).fetchall()

    return [
        ActivityGoalLinkedOut(
            activity_id=row.activity_id,
            activity_title=row.activity_title,
            goal_id=row.goal_id,
            goal_name=row.goal_name
        )
        for row in rows
    ]

@router.get("/by-activity/{activity_id}")
def get_goals_for_activity(
    activity_id: int,
    db: Session = Depends(get_db)
):
    return (
        db.query(
            StrategicGoal.id,
            StrategicGoal.goal_name
        )
        .join(ActivityGoal, ActivityGoal.goal_id == StrategicGoal.id)
        .filter(ActivityGoal.activity_id == activity_id)
        .all()
    )
