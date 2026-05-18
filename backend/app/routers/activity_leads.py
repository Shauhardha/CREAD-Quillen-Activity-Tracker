from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.activity import Activity
from app.models.user import User
from app.models.association import activity_leads
from app.auth import get_current_user, require_writer
from sqlalchemy import text

router = APIRouter(
    prefix="/api/activities",
    tags=["Activity Leads"]
)

@router.get("/{activity_id}/leads", response_model=List[int])
def get_activity_lead_ids(activity_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return [u.id for u in activity.leads]

@router.post("/{activity_id}/leads", response_model=List[int])
def set_activity_leads(activity_id: int, lead_ids: List[int], db: Session = Depends(get_db), user: dict = Depends(require_writer)):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    users = db.query(User).filter(User.id.in_(lead_ids)).all()
    activity.leads = users
    db.commit()
    db.refresh(activity)
    return [u.id for u in activity.leads]

@router.post("/{activity_id}/leads/{user_id}")
def add_activity_lead(activity_id: int, user_id: int, db: Session = Depends(get_db), user: dict = Depends(require_writer)):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    lead_user = db.query(User).filter(User.id == user_id).first()
    if not lead_user:
        raise HTTPException(status_code=404, detail="User not found")
    if lead_user not in activity.leads:
        activity.leads.append(lead_user)
        db.commit()
    return {"message": "added"}

@router.delete("/{activity_id}/leads/{user_id}")
def remove_activity_lead(activity_id: int, user_id: int, db: Session = Depends(get_db), user: dict = Depends(require_writer)):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    lead_user = db.query(User).filter(User.id == user_id).first()
    if not lead_user:
        raise HTTPException(status_code=404, detail="User not found")
    if lead_user in activity.leads:
        activity.leads.remove(lead_user)
        db.commit()
    return {"message": "removed"}


@router.get("/leads/{id}")
def get_activity_leads_detail(id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    """
    Get all lead staff members for a specific activity, with their names.
    Ordered by user name.
    """
    query = text("""
        SELECT al.activity_id, al.user_id, u.name AS user_name
        FROM activity_leads al
        LEFT JOIN users u ON u.id = al.user_id
        LEFT JOIN activities a ON a.id = al.activity_id
        WHERE a.id = :id
        ORDER BY user_name
    """)

    results = db.execute(query, {"id": id}).fetchall()

    if not results:
        return []

    return [
        {
            "activity_id": row.activity_id,
            "user_id": row.user_id,
            "user_name": row.user_name or "Unknown"
        }
        for row in results
    ]
