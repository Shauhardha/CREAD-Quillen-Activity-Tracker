from sqlalchemy import Table, Column, Integer, ForeignKey
from app.database import Base

activity_goals = Table(
    "activity_goals",
    Base.metadata,
    Column("activity_id", Integer, ForeignKey("activities.id"), primary_key=True),
    Column("goal_id", Integer, ForeignKey("strategic_goals.id"), primary_key=True),
)
