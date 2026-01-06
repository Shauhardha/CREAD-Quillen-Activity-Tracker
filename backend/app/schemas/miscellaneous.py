from pydantic import BaseModel
from typing import Optional
from datetime import date

class LocationBase(BaseModel):
    city: Optional[str]
    county: Optional[str]
    state: str = "TN"
    latitude: Optional[float]
    longitude: Optional[float]

class LocationCreate(LocationBase):
    pass

class LocationOut(LocationBase):
    id: int

    class Config:
        from_attributes = True