# app/schemas/activity.py
from pydantic import BaseModel, Field, root_validator
from typing import Optional, List
from enum import Enum
from datetime import date
from typing_extensions import Literal

class ActivityStatus(str, Enum):
    planned = "planned"
    in_progress = "in_progress"
    completed = "completed"

class LocationOut(BaseModel):
    id: int
    state: str
    county: str
    city: str

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
    lead_staff_ids: list[int] = []
    # goal_ids: Optional[List[int]] = []
    # cultural_tag_ids: Optional[List[int]] = []

class ActivityStatusUpdate(BaseModel):
    status: Literal["planned", "in_progress", "completed"]    

class ActivityOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    initiative_id: int
    status: ActivityStatus
    start_date: Optional[date]
    end_date: Optional[date]
    location_id: Optional[int]
    location: Optional[LocationOut] = None
    education_level_id: Optional[int]
    partnership_type_id: Optional[int]
    funding_source_id: Optional[int]
    notes: Optional[str]
    lead_staff_ids: List[int] = []

    class Config:
        from_attributes = True
