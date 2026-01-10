from pydantic import BaseModel
from typing import Optional

class ActivityStakeholderOut(BaseModel):
    activity_id: int
    activity_title: str
    stakeholder_id: int
    stakeholder_name: str
    role: Optional[str] = "participant"
    notes: Optional[str] = None

    class Config:
        from_attributes = True