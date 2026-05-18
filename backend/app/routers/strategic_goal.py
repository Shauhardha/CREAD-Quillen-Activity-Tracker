from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from app.database import get_db
from app.models.strategic_goal import StrategicGoal
from app.schemas.strategic_goal import StrategicGoalCreate, StrategicGoalOut
from app.auth import require_admin, require_writer, get_current_user

router = APIRouter(
    prefix="/api/strategic-goals",
    tags=["Strategic Goals"]
)

# Create
@router.post("/", response_model=StrategicGoalOut, dependencies=[Depends(require_writer)])
def create_goal(payload: StrategicGoalCreate, db: Session = Depends(get_db)):
    goal = StrategicGoal(**payload.dict())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal

# Read all active
@router.get("/", response_model=List[StrategicGoalOut])
def get_goals(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return db.query(StrategicGoal).filter(StrategicGoal.deleted_at.is_(None)).all()

# Update
@router.put("/{goal_id}", response_model=StrategicGoalOut, dependencies=[Depends(require_writer)])
def update_goal(goal_id: int, payload: StrategicGoalCreate, db: Session = Depends(get_db)):
    goal = db.query(StrategicGoal).filter(StrategicGoal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Strategic goal not found")
    goal.initiative_id = payload.initiative_id
    goal.goal_name = payload.goal_name
    goal.description = payload.description
    goal.goal_term = payload.goal_term
    goal.is_active = payload.is_active
    db.commit()
    db.refresh(goal)
    return goal

# Soft-delete
@router.delete("/{goal_id}", dependencies=[Depends(require_writer)])
def delete_goal(goal_id: int, db: Session = Depends(get_db)):
    goal = db.query(StrategicGoal).filter(StrategicGoal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Strategic goal not found")
    goal.deleted_at = datetime.utcnow()
    db.commit()
    return {"message": "Deleted"}
