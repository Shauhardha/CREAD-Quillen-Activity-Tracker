from sqlalchemy import Column, Integer, String, Text, Enum, ForeignKey, Boolean, TIMESTAMP
from app.database import Base
import enum
from sqlalchemy.orm import relationship

class GoalTerm(enum.Enum):
    short_term = "short_term"
    long_term = "long_term"

class StrategicGoal(Base):
    __tablename__ = "strategic_goals"

    id = Column(Integer, primary_key=True, index=True)
    initiative_id = Column(Integer, ForeignKey("initiatives.id"))
    goal_name = Column(String(255))
    description = Column(Text)
    goal_term = Column(Enum(GoalTerm))
    is_active = Column(Boolean, default=True)
    deleted_at = Column(TIMESTAMP, nullable=True)

    initiative = relationship("Initiative")
