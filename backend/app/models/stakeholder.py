# app/models/stakeholder.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
from app.models.association import activity_stakeholders

class Stakeholder(Base):
    __tablename__ = "stakeholders"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    type_id = Column(Integer, ForeignKey("partnership_types.id"), nullable=False)
    organization = Column(String(255))
    email = Column(String(255))
    phone = Column(String(50))
    website = Column(String(255))
    description = Column(Text)
    location_id = Column(Integer, ForeignKey("locations.id"))
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(TIMESTAMP, nullable=True)

    type = relationship("PartnershipType")
    location = relationship("Location")
    activities = relationship("Activity", secondary=activity_stakeholders, back_populates="stakeholders")