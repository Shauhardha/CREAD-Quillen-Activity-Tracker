from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    admin = "admin"
    staff = "staff"
    read_only = "read_only"

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        return v

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    is_active: bool
    role: UserRole

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

    class Config:
        from_attributes = True
