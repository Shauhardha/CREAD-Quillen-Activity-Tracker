from sqlalchemy import Column, Integer, String, Enum, TIMESTAMP, Boolean, Text, DECIMAL, Float
from app.database import Base

class PartnershipType(Base):
    __tablename__ = "partnership_types"
    id = Column(Integer, primary_key=True)
    type_name = Column(String(255), nullable=False)
    description = Column(Text)
    deleted_at = Column(TIMESTAMP, nullable=True)

class FundingSource(Base):
    __tablename__ = "funding_sources"
    id = Column(Integer, primary_key=True)
    source_name = Column(String(255), nullable=False)
    description = Column(Text)
    source_type = Column(String(255))
    funding_amount = Column(Float)
    deleted_at = Column(TIMESTAMP, nullable=True)

class EducationLevel(Base):
    __tablename__ = "education_levels"
    id = Column(Integer, primary_key=True)
    level_name = Column(String(255), nullable=False)
    description = Column(Text)
    deleted_at = Column(TIMESTAMP, nullable=True)

class CulturalWealthTag(Base):
    __tablename__ = "cultural_wealth_tags"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    deleted_at = Column(TIMESTAMP, nullable=True)

class Location(Base):
    __tablename__ = "locations"
    id = Column(Integer, primary_key=True)
    city = Column(String(100))
    county = Column(String(100))
    state = Column(String(100), default="TN")
    latitude = Column(DECIMAL(10,7))
    longitude = Column(DECIMAL(10,7))
    description = Column(Text)
    deleted_at = Column(TIMESTAMP, nullable=True)

class ActivityType(Base):
    __tablename__ = "activity_types"
    id = Column(Integer, primary_key=True)
    activityType_name = Column(String(255), nullable=False)
    description = Column(Text)
    deleted_at = Column(TIMESTAMP, nullable=True)      