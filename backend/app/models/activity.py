from sqlalchemy import Table, Column, Integer, String, Text, Enum, Date, ForeignKey, TIMESTAMP
from app.database import Base
from sqlalchemy.orm import relationship
from app.models.association import activity_goals

# activity_goals = Table(
#     "activity_goals", Base.metadata,
#     Column("activity_id", Integer, ForeignKey("activities.id"), primary_key=True),
#     Column("goal_id", Integer, ForeignKey("strategic_goals.id"), primary_key=True)
# )

activity_cultural_wealth = Table(
    "activity_cultural_wealth", Base.metadata,
    Column("activity_id", Integer, ForeignKey("activities.id"), primary_key=True),
    Column("cultural_wealth_id", Integer, ForeignKey("cultural_wealth_tags.id"), primary_key=True)
)

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    initiative_id = Column(Integer, ForeignKey("initiatives.id"))
    lead_staff_id = Column(Integer, ForeignKey("users.id"))
    status = Column(Enum('planned','in_progress','completed', name='activity_status'))
    start_date = Column(Date)
    end_date = Column(Date)
    location_id = Column(Integer, ForeignKey("locations.id"))
    education_level_id = Column(Integer, ForeignKey("education_levels.id"))
    partnership_type_id = Column(Integer, ForeignKey("partnership_types.id"))
    funding_source_id = Column(Integer, ForeignKey("funding_sources.id"))
    notes = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    updated_by = Column(Integer, ForeignKey("users.id"))
    deleted_at = Column(TIMESTAMP, nullable=True)

    # Relationships
    initiative = relationship("Initiative")
    lead_staff = relationship("User", foreign_keys=[lead_staff_id])
    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])
    location = relationship("Location")
    education_level = relationship("EducationLevel")
    partnership_type = relationship("PartnershipType")
    funding_source = relationship("FundingSource")
    goals = relationship("StrategicGoal", secondary=activity_goals)
    cultural_tags = relationship("CulturalWealthTag", secondary=activity_cultural_wealth)
