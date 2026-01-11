from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.association import activity_stakeholders
from app.models.activity import Activity
from app.models.stakeholder import Stakeholder
from app.schemas.association import ActivityStakeholderOut
from typing import List
from sqlalchemy import text

router = APIRouter(
    prefix="/api/activity-stakeholders",
    tags=["Activity Stakeholders"]
)

@router.get("/", response_model=List[ActivityStakeholderOut])
def list_activity_stakeholders(db: Session = Depends(get_db)):
    sql = text("""
        SELECT 
            ast.activity_id,
            a.title AS activity_title,
            ast.stakeholder_id,
            s.name AS stakeholder_name,
            ast.role,
            ast.notes
        FROM activity_stakeholders ast
        JOIN activities a ON a.id = ast.activity_id
        JOIN stakeholders s ON s.id = ast.stakeholder_id
        WHERE a.deleted_at IS NULL
    """)
    rows = db.execute(sql).fetchall()
    return [
        {
            "activity_id": row.activity_id,
            "activity_title": row.activity_title,
            "stakeholder_id": row.stakeholder_id,
            "stakeholder_name": row.stakeholder_name,
            "role": row.role,
            "notes": row.notes
        }
        for row in rows
    ]

@router.post("/")
def add_activity_stakeholder(
    activity_id: int = Query(...),
    stakeholder_id: int = Query(...),
    role: str = Query(...),
    notes: str = Query(...),
    db: Session = Depends(get_db)
):
    exists = db.query(activity_stakeholders).filter_by(
        activity_id=activity_id, stakeholder_id=stakeholder_id
    ).first()
    if exists:
        raise HTTPException(400, "Association already exists")

    db.execute(
        activity_stakeholders.insert().values(
            activity_id=activity_id,
            stakeholder_id=stakeholder_id,
            role=role,
            notes=notes
        )
    )
    db.commit()
    return {"status": "ok"}

@router.delete("/")
def delete_activity_stakeholder(
    activity_id: int = Query(...),
    stakeholder_id: int = Query(...),
    db: Session = Depends(get_db)
):
    assoc = db.query(activity_stakeholders).filter_by(
        activity_id=activity_id, stakeholder_id=stakeholder_id
    ).first()
    if not assoc:
        raise HTTPException(404, "Not found")

    db.execute(
        activity_stakeholders.delete().where(
            (activity_stakeholders.c.activity_id == activity_id) &
            (activity_stakeholders.c.stakeholder_id == stakeholder_id)
        )
    )
    db.commit()
    return {"status": "deleted"}