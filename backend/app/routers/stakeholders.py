from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.stakeholder import Stakeholder
from app.schemas.stakeholder import StakeholderCreate, StakeholderOut
from typing import List
from datetime import datetime
from sqlalchemy import text
from app.auth import get_current_user, require_writer

router = APIRouter(
    prefix="/api/stakeholders",
    tags=["Stakeholders"]
)

@router.post("/", response_model=StakeholderOut)
def create_stakeholder(payload: StakeholderCreate, db: Session = Depends(get_db), user: dict = Depends(require_writer)):
    stakeholder = Stakeholder(**payload.dict())
    db.add(stakeholder)
    db.commit()
    db.refresh(stakeholder)
    return stakeholder

@router.get("/", response_model=List[StakeholderOut])
def list_stakeholders(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return db.query(Stakeholder).filter(Stakeholder.deleted_at.is_(None)).all()

@router.get("/{id}", response_model=StakeholderOut)
def get_stakeholder(id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    stakeholder = db.query(Stakeholder).filter(Stakeholder.id == id).first()
    if not stakeholder:
        raise HTTPException(404, "Stakeholder not found")
    return stakeholder

@router.put("/{id}", response_model=StakeholderOut)
def update_stakeholder(id: int, payload: StakeholderCreate, db: Session = Depends(get_db), user: dict = Depends(require_writer)):
    stakeholder = (
        db.query(Stakeholder)
        .options(joinedload(Stakeholder.location))
        .filter(Stakeholder.id == id).first()
    )
    if not stakeholder:
        raise HTTPException(404, "Stakeholder not found")

    for key, value in payload.dict().items():
        setattr(stakeholder, key, value)

    db.commit()
    db.refresh(stakeholder)
    return stakeholder

@router.delete("/{id}")
def delete_stakeholder(id: int, db: Session = Depends(get_db), user: dict = Depends(require_writer)):
    stakeholder = db.query(Stakeholder).filter(Stakeholder.id == id).first()
    if not stakeholder:
        raise HTTPException(404, "Stakeholder not found")
    stakeholder.deleted_at = datetime.utcnow()
    db.commit()
    return {"status": "deleted"}


@router.get("/activity/{id}")
def get_activity_stakeholders(id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    query = text("""
        SELECT al.activity_id, al.stakeholder_id, al.role, al.notes,
        a.title AS activity_name, s.name as stakeholder_name
        FROM activity_stakeholders al
        LEFT JOIN stakeholders s ON s.id = al.stakeholder_id
        LEFT JOIN activities a ON a.id = al.activity_id
        WHERE a.id = :id
        ORDER BY s.name ASC
    """)

    results = db.execute(query, {"id": id}).fetchall()

    if not results:
        return []

    return [
        {
            "activity_id": row.activity_id,
            "stakeholder_id": row.stakeholder_id,
            "role": row.role,
            "notes": row.notes,
            "activity_name": row.activity_name,
            "stakeholder_name": row.stakeholder_name or "Unknown"
        }
        for row in results
    ]
