from pydantic import BaseModel
from typing import Optional, List
from enum import Enum
from datetime import date

class ActivityStatus(str, Enum):
    planned = "planned"
    in_progress = "in_progress"
    completed = "completed"

class ActivityCreate(BaseModel):
    title: str
    description: Optional[str] = None
    initiative_id: int
    status: ActivityStatus
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    location_id: Optional[int]
    education_level_id: Optional[int]
    partnership_type_id: Optional[int]
    funding_source_id: Optional[int]
    notes: Optional[str]
    goal_ids: Optional[List[int]] = []
    cultural_tag_ids: Optional[List[int]] = []

class ActivityOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    initiative_id: int
    status: ActivityStatus
    start_date: Optional[date]
    end_date: Optional[date]
    location_id: Optional[int]
    education_level_id: Optional[int]
    partnership_type_id: Optional[int]
    funding_source_id: Optional[int]
    notes: Optional[str]
    goal_ids: Optional[List[int]]
    cultural_tag_ids: Optional[List[int]]

    class Config:
        from_attributes = True
