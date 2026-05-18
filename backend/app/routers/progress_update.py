from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.progress_update import ProgressUpdate
from app.schemas.progress_update import ProgressUpdateCreate, ProgressUpdateOut
from typing import List
from datetime import datetime
from app.auth import get_current_user, require_writer
from app.models.user import User

router = APIRouter(
    prefix="/api/progress-updates",
    tags=["Progress Updates"]
)


@router.post("/", response_model=ProgressUpdateOut)
def add_progress_update(
    payload: ProgressUpdateCreate,
    activity_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_writer),
):
    sub = user.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing sub"
        )

    db_user = db.query(User).filter(User.cognito_sub == sub).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in database"
        )

    update = ProgressUpdate(
        activity_id=activity_id,
        created_by=db_user.id,
        **payload.dict()
    )

    db.add(update)
    db.commit()
    db.refresh(update)
    return update


@router.get("/", response_model=List[ProgressUpdateOut])
def get_progress_updates(activity_id: int, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return db.query(ProgressUpdate).filter(
        ProgressUpdate.activity_id == activity_id,
        ProgressUpdate.deleted_at.is_(None)
    ).all()


@router.delete("/{id}")
def delete_progress_update(id: int, db: Session = Depends(get_db), user: dict = Depends(require_writer)):
    update = db.query(ProgressUpdate).filter(ProgressUpdate.id == id).first()
    if not update:
        raise HTTPException(404, "Not found")
    update.deleted_at = datetime.utcnow()
    db.commit()
    return {"status": "deleted"}
