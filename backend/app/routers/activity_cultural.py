#app/routers/activity_cultural.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.association import ActivityCulturalWealth
from app.models.activity import Activity
from app.models.miscellaneous import CulturalWealthTag
from sqlalchemy import text
from pydantic import BaseModel
from typing import List

router = APIRouter(
    prefix="/activity-cultural-wealth",
    tags=["Activity Cultural Wealth"]
)

class ActivityCulturalWealthLinkedOut(BaseModel):
    activity_id: int
    activity_title: str
    cultural_wealth_id: int
    cultural_wealth_name: str

    class Config:
        from_attributes = True

@router.get("/", response_model=List[ActivityCulturalWealthLinkedOut])
def list_activity_cultural_wealth(db: Session = Depends(get_db)):
    sql = text("""
        SELECT 
            acw.activity_id,
            a.title AS activity_title,
            acw.cultural_wealth_id,
            c.name AS cultural_wealth_name
        FROM activity_cultural_wealth acw
        JOIN activities a ON a.id = acw.activity_id
        JOIN cultural_wealth_tags c ON c.id = acw.cultural_wealth_id
        WHERE a.deleted_at IS NULL
    """)

    rows = db.execute(sql).fetchall()

    return [
        {
            "activity_id": row.activity_id,
            "activity_title": row.activity_title,
            "cultural_wealth_id": row.cultural_wealth_id,
            "cultural_wealth_name": row.cultural_wealth_name
        }
        for row in rows
    ]

@router.post("/")
def add_activity_cultural_wealth(
    activity_id: int,
    cultural_wealth_id: int,
    db: Session = Depends(get_db)
):
    exists = db.query(ActivityCulturalWealth).filter_by(
        activity_id=activity_id,
        cultural_wealth_id=cultural_wealth_id
    ).first()
    if exists:
        raise HTTPException(400, "Association already exists")

    assoc = ActivityCulturalWealth(
        activity_id=activity_id,
        cultural_wealth_id=cultural_wealth_id
    )
    db.add(assoc)
    db.commit()
    return {"status": "ok"}

@router.delete("/")
def delete_activity_cultural_wealth(
    activity_id: int,
    cultural_wealth_id: int,
    db: Session = Depends(get_db)
):
    assoc = db.query(ActivityCulturalWealth).filter_by(
        activity_id=activity_id,
        cultural_wealth_id=cultural_wealth_id
    ).first()
    if not assoc:
        raise HTTPException(404, "Not found")

    db.delete(assoc)
    db.commit()
    return {"status": "deleted"}

@router.get("/activity/{activity_id}", response_model=List[ActivityCulturalWealthLinkedOut])
def get_wealth_for_activity(activity_id: int, db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT 
            acw.activity_id,
            a.title AS activity_title,
            acw.cultural_wealth_id,
            c.name AS cultural_wealth_name
        FROM activity_cultural_wealth acw
        JOIN activities a ON a.id = acw.activity_id
        JOIN cultural_wealth_tags c ON c.id = acw.cultural_wealth_id
        WHERE acw.activity_id = :activity_id
    """), {"activity_id": activity_id}).fetchall()

    return [
        ActivityCulturalWealthLinkedOut(
            activity_id=row.activity_id,
            activity_title=row.activity_title,
            cultural_wealth_id=row.cultural_wealth_id,
            cultural_wealth_name=row.cultural_wealth_name
        )
        for row in rows
    ]

@router.get("/by-activity/{activity_id}")
def get_wealth_for_activity(
    activity_id: int,
    db: Session = Depends(get_db)
):
    return (
        db.query(
            CulturalWealthTag.id,
            CulturalWealthTag.name
        )
        .join(
            ActivityCulturalWealth,
            ActivityCulturalWealth.cultural_wealth_id == CulturalWealthTag.id
        )
        .filter(ActivityCulturalWealth.activity_id == activity_id)
        .all()
    )
