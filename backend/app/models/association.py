from sqlalchemy import Table, Column, Integer, ForeignKey
from app.database import Base

activity_goals = Table(
    "activity_goals",
    Base.metadata,
    Column("activity_id", Integer, ForeignKey("activities.id"), primary_key=True),
    Column("goal_id", Integer, ForeignKey("strategic_goals.id"), primary_key=True),
)

# Many-to-many: activities <-> lead staff (users)
activity_leads = Table(
    "activity_leads",
    Base.metadata,
    Column("activity_id", Integer, ForeignKey("activities.id"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
)
