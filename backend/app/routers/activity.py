# app/routers/activities.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models.activity import Activity
from app.schemas.activity import ActivityCreate, ActivityOut
from app.models.user import User
from app.auth import get_current_user
from sqlalchemy.orm import joinedload  # Add this import at top if not present

router = APIRouter(
    prefix="/activities",
    tags=["Activities"]
)

@router.post("/", response_model=ActivityOut)
def create_activity(payload: ActivityCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    data = payload.dict()
    lead_ids = data.pop("lead_staff_ids", [])


    # still block legacy field
    data.pop("lead_staff_id", None)
    activity = Activity(**data)

    # set created_by from authenticated user (map cognito sub -> users.id)
    sub = user.get("sub") if user else None
    if sub:
        db_user = db.query(User).filter(User.cognito_sub == sub).first()
        if db_user:
            activity.created_by = db_user.id
            activity.updated_by = db_user.id

    if lead_ids:
        leads = db.query(User).filter(User.id.in_(lead_ids)).all()
        activity.leads = leads

    db.add(activity)
    db.commit()
    db.refresh(activity)

    return activity


@router.get("/", response_model=list[ActivityOut])
def get_activities(db: Session = Depends(get_db)):
    activities = (
        db.query(Activity)
        .options(joinedload(Activity.location))  # <-- THIS LINE IS CRITICAL
        .filter(Activity.deleted_at.is_(None))   # <-- Also fix NULL check
        .all()
    )

    for a in activities:
        a.lead_staff_ids = [u.id for u in a.leads]

    return activities


@router.get("/{id}", response_model=ActivityOut)
def get_activity(id: int, db: Session = Depends(get_db)):
    activity = (
        db.query(Activity)
        .options(joinedload(Activity.location))
        .filter(Activity.id == id)
        .first()
    )
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    activity.lead_staff_ids = [u.id for u in activity.leads]
    return activity


@router.put("/{id}", response_model=ActivityOut)
def update_activity(id: int, payload: ActivityCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    activity = db.query(Activity).filter(Activity.id == id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    data = payload.dict()
    lead_ids = data.pop("lead_staff_ids", [])

    for key, value in data.items():
        if key == "lead_staff_id":
            continue
        setattr(activity, key, value)

    if lead_ids is not None:
        leads = db.query(User).filter(User.id.in_(lead_ids)).all()
        activity.leads = leads  # replaces rows in activity_leads

    # set updated_by from authenticated user (map cognito sub -> users.id)
    sub = user.get("sub") if user else None
    print("Cognito sub from token:", sub)
    if sub:
        db_user = db.query(User).filter(User.cognito_sub == sub).first()
        if db_user:
            activity.updated_by = db_user.id
            print("User ID:", db_user.id)

    db.commit()
    db.refresh(activity)
    return activity


@router.delete("/{id}")
def delete_activity(id: int, db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(Activity.id == id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    activity.deleted_at = datetime.utcnow()
    db.commit()
    return {"message": "Deleted"}
