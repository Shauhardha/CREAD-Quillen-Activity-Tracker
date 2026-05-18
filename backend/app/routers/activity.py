# app/routers/activities.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models.activity import Activity
from app.schemas.activity import ActivityCreate, ActivityOut, ActivityStatusUpdate
from app.models.user import User
from app.auth import get_current_user, require_writer
from sqlalchemy.orm import joinedload
from sqlalchemy import text

router = APIRouter(
    prefix="/api/activities",
    tags=["Activities"]
)

@router.post("/", response_model=ActivityOut)
def create_activity(payload: ActivityCreate, db: Session = Depends(get_db), user: dict = Depends(require_writer)):
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


@router.get("/export")
def export_activities(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    query = text("""
        SELECT
            a.id,
            a.title,
            a.description,
            COALESCE(at.activityType_name, '') AS activity_type,
            a.status,
            COALESCE(i.name, '')              AS initiative,
            a.start_date,
            a.end_date,
            COALESCE(a.primary_audience, '')  AS primary_audience,
            COALESCE(l.city, '')              AS city,
            COALESCE(l.county, '')            AS county,
            COALESCE(l.state, '')             AS state,
            COALESCE(e.level_name, '')        AS education_level,
            COALESCE(p.type_name, '')         AS partnership_type,
            COALESCE(f.source_name, '')       AS funding_source,
            COALESCE(f.source_type, '')       AS funding_source_type,
            a.funding_amount,
            (
                SELECT GROUP_CONCAT(u.name ORDER BY u.name SEPARATOR ', ')
                FROM activity_leads al
                JOIN users u ON u.id = al.user_id
                WHERE al.activity_id = a.id
            )                                 AS lead_staff,
            COALESCE(a.deliverables, '')      AS deliverables,
            COALESCE(a.intended_outcomes, '') AS intended_outcomes,
            COALESCE(a.evidence, '')          AS evidence,
            COALESCE(a.sustainability_plan, '') AS sustainability_plan,
            COALESCE(a.notes, '')             AS notes
        FROM activities a
        LEFT JOIN activity_types at ON at.id = a.activity_type_id
        LEFT JOIN initiatives i     ON i.id  = a.initiative_id
        LEFT JOIN locations l       ON l.id  = a.location_id
        LEFT JOIN education_levels e ON e.id = a.education_level_id
        LEFT JOIN partnership_types p ON p.id = a.partnership_type_id
        LEFT JOIN funding_sources f  ON f.id  = a.funding_source_id
        WHERE a.deleted_at IS NULL
        ORDER BY a.title
    """)
    return db.execute(query).mappings().all()


@router.get("/", response_model=list[ActivityOut])
def get_activities(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    activities = (
        db.query(Activity)
        .options(joinedload(Activity.location))
        .options(joinedload(Activity.activity_type))
        .filter(Activity.deleted_at.is_(None))
        .all()
    )

    for a in activities:
        a.lead_staff_ids = [u.id for u in a.leads]
        a.activity_type_name = a.activity_type.activityType_name if a.activity_type else None

    return activities


@router.get("/{id}", response_model=ActivityOut)
def get_activity(id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    activity = (
        db.query(Activity)
        .options(joinedload(Activity.location))
        .options(joinedload(Activity.activity_type))
        .filter(Activity.id == id)
        .first()
    )
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    activity.lead_staff_ids = [u.id for u in activity.leads]
    activity.activity_type_name = activity.activity_type.activityType_name if activity.activity_type else None
    return activity


@router.put("/{id}", response_model=ActivityOut)
def update_activity(id: int, payload: ActivityCreate, db: Session = Depends(get_db), user: dict = Depends(require_writer)):
    activity = db.query(Activity).filter(Activity.id == id, Activity.deleted_at.is_(None)).first()
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
        activity.leads = leads

    sub = user.get("sub") if user else None
    if sub:
        db_user = db.query(User).filter(User.cognito_sub == sub).first()
        if db_user:
            activity.updated_by = db_user.id

    db.commit()
    db.refresh(activity)
    return activity


@router.delete("/{id}")
def delete_activity(id: int, db: Session = Depends(get_db), user: dict = Depends(require_writer)):
    activity = db.query(Activity).filter(Activity.id == id, Activity.deleted_at.is_(None)).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    activity.deleted_at = datetime.utcnow()
    db.commit()
    return {"message": "Deleted"}


@router.get("/details/{id}")
def get_activity_details(id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
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
            a.notes,
            a.activity_type_id,
            a.primary_audience,
            a.funding_amount,
            a.deliverables,
            a.intended_outcomes,
            a.evidence,
            a.sustainability_plan,
            at.activityType_name AS activity_type_name
        FROM activities a
        LEFT JOIN initiatives i ON i.id = a.initiative_id
        LEFT JOIN locations l ON l.id = a.location_id
        LEFT JOIN education_levels e ON e.id = a.education_level_id
        LEFT JOIN partnership_types p ON p.id = a.partnership_type_id
        LEFT JOIN funding_sources f ON f.id = a.funding_source_id
        LEFT JOIN activity_types at ON at.id = a.activity_type_id
        WHERE a.id = :id
    """)

    result = db.execute(query, {"id": id}).fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="Activity not found")

    return {
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
        "lead_staff_ids": [],
        "activity_type_id": result.activity_type_id,
        "activity_type_name": result.activity_type_name,
        "primary_audience": result.primary_audience,
        "funding_amount": result.funding_amount,
        "deliverables": result.deliverables,
        "intended_outcomes": result.intended_outcomes,
        "evidence": result.evidence,
        "sustainability_plan": result.sustainability_plan
    }


@router.put("/{id}/status")
def update_activity_status(
    id: int,
    payload: ActivityStatusUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_writer),
):
    activity = db.query(Activity).filter(Activity.id == id, Activity.deleted_at.is_(None)).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    activity.status = payload.status

    sub = user.get("sub") if user else None
    if sub:
        db_user = db.query(User).filter(User.cognito_sub == sub).first()
        if db_user:
            activity.updated_by = db_user.id

    db.commit()
    db.refresh(activity)

    return {
        "id": activity.id,
        "status": activity.status,
    }
