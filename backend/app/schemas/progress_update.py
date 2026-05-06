from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class ProgressUpdateCreate(BaseModel):
    update_date: date
    notes: Optional[str] = None
    milestones: Optional[str] = None
    milestone_id: Optional[int] = None
    quantitative_outcome: Optional[str] = None
    qualitative_outcome: Optional[str] = None
    evaluation_tool_reference: Optional[str] = None

class ProgressUpdateOut(ProgressUpdateCreate):
    id: int
    activity_id: int
    milestone_id: Optional[int] = None
    created_by: Optional[int] = None
    created_at: datetime
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True