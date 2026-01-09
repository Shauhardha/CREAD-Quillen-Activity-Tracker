from sqlalchemy import Column, Integer, Date, Text, String, ForeignKey, TIMESTAMP
from app.database import Base
from sqlalchemy.orm import relationship
from datetime import datetime

class ProgressUpdate(Base):
    __tablename__ = "progress_updates"

    id = Column(Integer, primary_key=True)
    activity_id = Column(Integer, ForeignKey("activities.id"))
    update_date = Column(Date, nullable=False)
    notes = Column(Text)
    milestones = Column(Text)
    quantitative_outcome = Column(Text)
    qualitative_outcome = Column(Text)
    evaluation_tool_reference = Column(String(255))
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    deleted_at = Column(TIMESTAMP, nullable=True)

    activity = relationship("Activity", back_populates="progress_updates")
    creator = relationship("User")
