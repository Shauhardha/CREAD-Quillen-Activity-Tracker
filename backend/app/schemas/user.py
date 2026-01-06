from pydantic import BaseModel, EmailStr
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

class UserOut(BaseModel):
    id: int
    cognito_sub: str
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
