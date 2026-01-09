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
from sqlalchemy import text

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
    # print("Cognito sub from token:", sub)
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


@router.get("/details/{id}")
def get_activity(id: int, db: Session = Depends(get_db)):
    query = text("""
        SELECT 
            a.id, 
            a.title, 
            a.description AS activity_desc,
            a.initiative_id, 
            i.name AS initiative_name, 
            a.status, 
            a.start_date, 
            a.end_date,
            a.location_id, 
            l.state, 
            l.county, 
            l.city,
            a.education_level_id, 
            e.level_name, 
            a.partnership_type_id, 
            p.type_name AS partnership_name, 
            p.description AS partnership_desc,
            a.funding_source_id, 
            f.source_name AS funding_name, 
            f.description AS funding_desc,
            a.notes
        FROM activities a
        LEFT JOIN initiatives i ON i.id = a.initiative_id
        LEFT JOIN locations l ON l.id = a.location_id
        LEFT JOIN education_levels e ON e.id = a.education_level_id
        LEFT JOIN partnership_types p ON p.id = a.partnership_type_id
        LEFT JOIN funding_sources f ON f.id = a.funding_source_id
        WHERE a.id = :id
    """)

    result = db.execute(query, {"id": id}).fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Convert Row to dict with proper keys
    activity_dict = {
        "id": result.id,
        "title": result.title,
        "description": result.activity_desc,
        "initiative_id": result.initiative_id,
        "initiative_name": result.initiative_name,
        "status": result.status,
        "start_date": result.start_date,
        "end_date": result.end_date,
        "location_id": result.location_id,
        "state": result.state,
        "county": result.county,
        "city": result.city,
        "education_level_id": result.education_level_id,
        "education_level_name": result.level_name,
        "partnership_type_id": result.partnership_type_id,
        "partnership_name": result.partnership_name,
        "partnership_description": result.partnership_desc,
        "funding_source_id": result.funding_source_id,
        "funding_name": result.funding_name,
        "funding_description": result.funding_desc,
        "notes": result.notes,
        # Keep this if your ActivityOut expects it
        "lead_staff_ids": [],  # You'll need to fetch separately or add another join
    }

    # Note: lead_staff_ids still needs separate handling (see below)
    # For now, leaving it empty or fetch separately

    return activity_dict