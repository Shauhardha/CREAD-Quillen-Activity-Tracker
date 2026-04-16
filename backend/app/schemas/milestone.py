from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class MilestoneCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[date] = None


class MilestoneOut(BaseModel):
    id: int
    activity_id: int
    title: str
    description: Optional[str] = None
    due_date: Optional[date] = None
    is_achieved: bool
    achieved_date: Optional[date] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
