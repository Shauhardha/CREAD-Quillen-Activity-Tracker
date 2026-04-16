from sqlalchemy import Column, Integer, String, Text, Date, Boolean, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Milestone(Base):
    __tablename__ = "milestones"

    id            = Column(Integer, primary_key=True, index=True)
    activity_id   = Column(Integer, ForeignKey("activities.id"), nullable=False)
    title         = Column(String(255), nullable=False)
    description   = Column(Text, nullable=True)
    due_date      = Column(Date, nullable=True)
    is_achieved   = Column(Boolean, default=False, nullable=False)
    achieved_date = Column(Date, nullable=True)
    created_at    = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at    = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at    = Column(TIMESTAMP, nullable=True)

    activity = relationship("Activity", backref="milestones")
