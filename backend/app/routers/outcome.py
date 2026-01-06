from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.outcome import ProgressUpdate
from app.schemas.outcome import ProgressUpdateCreate

router = APIRouter(
    prefix="/outcomes",
    tags=["Outcomes"]
)

@router.post("/")
def create_outcome(payload: ProgressUpdateCreate, db: Session = Depends(get_db)):
    outcome = ProgressUpdate(
        activity_id=payload.activity_id,
        quantitative_outcome=payload.quantitative_outcome,
        qualitative_outcome=payload.qualitative_outcome,
        evaluation_tool_reference=payload.evaluation_tool_reference
    )
    db.add(outcome)
    db.commit()
    db.refresh(outcome)
    return outcome

@router.get("/")
def get_outcomes(db: Session = Depends(get_db)):
    return db.query(ProgressUpdate).all()
