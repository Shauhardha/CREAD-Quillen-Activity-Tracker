from sqlalchemy import Column, Integer, String, Enum, TIMESTAMP, Boolean, text
from sqlalchemy.sql import func
from app.database import Base
import enum
from sqlalchemy.orm import relationship
from app.models.association import activity_leads

class UserRole(enum.Enum):
    admin = "admin"
    staff = "staff"
    read_only = "read_only"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    cognito_sub = Column(String(255), unique=True, nullable=False)
    name = Column(String(100))
    email = Column(String(255), unique=True, index=True)
    role = Column(Enum(UserRole))
    created_at = Column(TIMESTAMP, server_default=func.now())
    is_active = Column(Boolean, default=True)
    updated_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
    deleted_at = Column(TIMESTAMP, nullable=True)

    activities = relationship(
        "Activity",
        secondary=activity_leads,
        back_populates="leads"
    )
