from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.progress_update import ProgressUpdate
from app.schemas.progress_update import ProgressUpdateCreate, ProgressUpdateOut
from typing import List
from datetime import datetime
from app.auth import get_current_user  # your auth dependency
from app.models.user import User

router = APIRouter(
    prefix="/api/progress-updates",
    tags=["Progress Updates"]
)

# @router.post("/", response_model=ProgressUpdateOut)
# def add_progress_update(payload: ProgressUpdateCreate, activity_id: int, db: Session = Depends(get_db)):
#     update = ProgressUpdate(activity_id=activity_id, **payload.dict())
#     db.add(update)
#     db.commit()
#     db.refresh(update)
#     return update

@router.post("/", response_model=ProgressUpdateOut)
def add_progress_update(
    payload: ProgressUpdateCreate,
    activity_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),  # This should raise 401 if no valid token
):
    # Extract Cognito sub (user ID in Cognito)
    sub = user.get("sub")
    print("Cognito sub from token:", sub)
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing sub"
        )

    # Find the local User record
    db_user = db.query(User).filter(User.cognito_sub == sub).first()
    print("DB User found for sub:", db_user)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in database"
        )

    # Create the progress update
    update = ProgressUpdate(
        activity_id=activity_id,
        created_by=db_user.id,  # ← Now guaranteed to be set
        **payload.dict()
    )

    db.add(update)
    db.commit()
    db.refresh(update)
    return update


@router.get("/", response_model=List[ProgressUpdateOut])
def get_progress_updates(activity_id: int, db: Session = Depends(get_db)):
    return db.query(ProgressUpdate).filter(ProgressUpdate.activity_id == activity_id, ProgressUpdate.deleted_at.is_(None)).all()

@router.delete("/{id}")
def delete_progress_update(id: int, db: Session = Depends(get_db)):
    update = db.query(ProgressUpdate).filter(ProgressUpdate.id == id).first()
    if not update:
        raise HTTPException(404, "Not found")
    update.deleted_at = datetime.utcnow()
    db.commit()
    return {"status": "deleted"}


# @router.post("/")
# def create_progress_update(
#     payload: ProgressUpdateCreateSchema,
#     db: Session = Depends(get_db),
#     user=Depends(get_current_user)
# ):
#     update = ProgressUpdate(
#         activity_id=payload.activity_id,
#         update_date=payload.update_date,
#         notes=payload.notes,
#         milestones=payload.milestones,
#         quantitative_outcome=payload.quantitative_outcome,
#         qualitative_outcome=payload.qualitative_outcome,
#         evaluation_tool_reference=payload.evaluation_tool_reference,
#         created_by=user.id
#     )
#     db.add(update)
#     db.commit()
#     db.refresh(update)
#     return update
