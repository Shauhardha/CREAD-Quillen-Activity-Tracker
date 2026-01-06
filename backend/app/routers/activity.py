from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.activity import Activity
from app.models.association import activity_goals
from app.schemas.activity import ActivityCreate

router = APIRouter(prefix="/activities", tags=["Activities"])

@router.post("/")
def create_activity(payload: ActivityCreate, db: Session = Depends(get_db)):
    activity = Activity(
        title=payload.title,
        description=payload.description,
        initiative_id=payload.initiative_id,
        status=payload.status,
        start_date=payload.start_date,
        end_date=payload.end_date,
        location=payload.location,
        education_level=payload.education_level,
        partnership_type=payload.partnership_type,
        funding_source=payload.funding_source,
        created_by=1  # placeholder
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)

    for goal_id in payload.goal_ids:
        db.execute(
            activity_goals.insert().values(
                activity_id=activity.id,
                goal_id=goal_id
            )
        )
    db.commit()

    return activity
