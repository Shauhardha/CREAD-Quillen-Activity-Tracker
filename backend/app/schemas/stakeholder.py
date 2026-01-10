from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class LocationOutStakeholder(BaseModel):
    id: int
    state: str
    county: str
    city: str

class StakeholderCreate(BaseModel):
    name: str
    type_id: int
    organization: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    website: Optional[str]
    description: Optional[str]
    location_id: Optional[int]

class StakeholderOut(StakeholderCreate):
    id: int
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]
    location: Optional[LocationOutStakeholder] = None

    class Config:
        from_attributes = True