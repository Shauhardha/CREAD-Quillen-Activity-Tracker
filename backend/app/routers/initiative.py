from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db 
from app.models.initiative import Initiative
from app.schemas.initiative import InitiativeCreate, InitiativeOut
from app.auth import get_current_user, require_admin

router = APIRouter(
    prefix="/initiatives",
    tags=["Initiatives"]
)

@router.post("/", dependencies=[Depends(require_admin)], response_model=InitiativeOut, status_code=201)
def create_initiative(payload: InitiativeCreate, db: Session = Depends(get_db)):
    initiative = Initiative(name=payload.name)
    db.add(initiative)
    db.commit()
    db.refresh(initiative)
    return initiative

@router.get("/", response_model=List[InitiativeOut])
def get_initiatives(db: Session = Depends(get_db)):
    return db.query(Initiative).all()

@router.put("/{initiative_id}", dependencies=[Depends(require_admin)], response_model=InitiativeOut)
def update_initiative(
    initiative_id: int,
    payload: InitiativeCreate,
    db: Session = Depends(get_db)
):
    initiative = db.query(Initiative).filter(Initiative.id == initiative_id).first()
    if not initiative:
        raise HTTPException(status_code=404, detail="Initiative not found")

    initiative.name = payload.name
    db.commit()
    db.refresh(initiative)
    return initiative

@router.delete("/{initiative_id}", dependencies=[Depends(require_admin)], status_code=204)
def delete_initiative(
    initiative_id: int,
    db: Session = Depends(get_db)
):
    initiative = db.query(Initiative).filter(Initiative.id == initiative_id).first()
    if not initiative:
        raise HTTPException(status_code=404, detail="Initiative not found")

    db.delete(initiative)
    db.commit()
    return None  # 204 No Content