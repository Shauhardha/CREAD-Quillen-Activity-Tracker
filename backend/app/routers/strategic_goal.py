from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.strategic_goal import StrategicGoal
from app.schemas.strategic_goal import StrategicGoalCreate

router = APIRouter(
    prefix="/strategic-goals",
    tags=["Strategic Goals"]
)

@router.post("/")
def create_goal(payload: StrategicGoalCreate, db: Session = Depends(get_db)):
    goal = StrategicGoal(
        initiative_id=payload.initiative_id,
        goal_name=payload.goal_name,
        description=payload.description,
        goal_term=payload.goal_term
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal

@router.get("/")
def get_goals(db: Session = Depends(get_db)):
    return db.query(StrategicGoal).all()
