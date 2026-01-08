from pydantic import BaseModel
from enum import Enum
from typing import Optional

class GoalTerm(str, Enum):
    short_term = "short_term"
    long_term = "long_term"

class StrategicGoalCreate(BaseModel):
    initiative_id: int
    goal_name: str
    description: Optional[str] = None
    goal_term: GoalTerm
    is_active: bool

class StrategicGoalOut(BaseModel):
    id: int
    initiative_id: int
    goal_name: str
    description: Optional[str]
    goal_term: GoalTerm
    is_active: bool

    class Config:
        from_attributes = True
