from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date

from app.database import get_db
from app.models.milestone import Milestone
from app.models.activity import Activity
from app.schemas.milestone import MilestoneCreate, MilestoneOut
from app.auth import get_current_user, require_writer

router = APIRouter(prefix="/api/milestones", tags=["Milestones"])


# ── All milestones with due dates (for calendar view) ────────────
@router.get("/calendar")
def milestones_for_calendar(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    results = (
        db.query(Milestone, Activity.title.label("activity_title"), Activity.initiative_id)
        .join(Activity, Activity.id == Milestone.activity_id)
        .filter(
            Milestone.deleted_at.is_(None),
            Milestone.due_date.isnot(None),
            Activity.deleted_at.is_(None),
        )
        .all()
    )
    return [
        {
            "id":             m.id,
            "activity_id":    m.activity_id,
            "activity_title": activity_title,
            "initiative_id":  initiative_id or 0,
            "title":          m.title,
            "due_date":       str(m.due_date),
            "is_achieved":    m.is_achieved,
        }
        for m, activity_title, initiative_id in results
    ]


# ── List milestones for an activity ──────────────────────────────
@router.get("/", response_model=List[MilestoneOut])
def get_milestones(activity_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return (
        db.query(Milestone)
        .filter(Milestone.activity_id == activity_id, Milestone.deleted_at.is_(None))
        .order_by(Milestone.due_date.is_(None).asc(), Milestone.due_date.asc(), Milestone.created_at.asc())
        .all()
    )


# ── Create a milestone ───────────────────────────────────────────
@router.post("/", response_model=MilestoneOut)
def create_milestone(
    activity_id: int,
    payload: MilestoneCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_writer),
):
    milestone = Milestone(activity_id=activity_id, **payload.dict())
    db.add(milestone)
    db.commit()
    db.refresh(milestone)
    return milestone


# ── Toggle achieved / un-achieved ───────────────────────────────
@router.put("/{id}/achieve", response_model=MilestoneOut)
def toggle_achieved(
    id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_writer),
):
    milestone = db.query(Milestone).filter(Milestone.id == id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    milestone.is_achieved = not milestone.is_achieved
    milestone.achieved_date = date.today() if milestone.is_achieved else None
    milestone.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(milestone)
    return milestone


# ── Soft-delete ──────────────────────────────────────────────────
@router.delete("/{id}")
def delete_milestone(
    id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_writer),
):
    milestone = db.query(Milestone).filter(Milestone.id == id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    milestone.deleted_at = datetime.utcnow()
    db.commit()
    return {"message": "Deleted"}
