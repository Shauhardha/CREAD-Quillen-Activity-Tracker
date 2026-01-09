from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class ProgressUpdateCreate(BaseModel):
    update_date: date
    notes: Optional[str]
    milestones: Optional[str]
    quantitative_outcome: Optional[str]
    qualitative_outcome: Optional[str]
    evaluation_tool_reference: Optional[str]

class ProgressUpdateOut(ProgressUpdateCreate):
    id: int
    activity_id: int
    created_by: Optional[int]   # ← Make optional for now
    created_at: datetime               # ← Use datetime, not str
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True