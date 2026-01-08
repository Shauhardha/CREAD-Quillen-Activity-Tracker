from pydantic import BaseModel
from typing import Optional
from decimal import Decimal

# --------------------
# Partnership Type
# --------------------
class PartnershipTypeBase(BaseModel):
    type_name: str
    description: Optional[str] = None

class PartnershipTypeCreate(PartnershipTypeBase):
    pass

class PartnershipTypeOut(PartnershipTypeBase):
    id: int

    class Config:
        from_attributes = True


# --------------------
# Funding Source
# --------------------
class FundingSourceBase(BaseModel):
    source_name: str
    description: Optional[str] = None

class FundingSourceCreate(FundingSourceBase):
    pass

class FundingSourceOut(FundingSourceBase):
    id: int

    class Config:
        from_attributes = True


# --------------------
# Education Level
# --------------------
class EducationLevelBase(BaseModel):
    level_name: str
    description: Optional[str] = None

class EducationLevelCreate(EducationLevelBase):
    pass

class EducationLevelOut(EducationLevelBase):
    id: int

    class Config:
        from_attributes = True


# --------------------
# Cultural Wealth Tag
# --------------------
class CulturalWealthTagBase(BaseModel):
    name: str
    description: Optional[str] = None

class CulturalWealthTagCreate(CulturalWealthTagBase):
    pass

class CulturalWealthTagOut(CulturalWealthTagBase):
    id: int

    class Config:
        from_attributes = True


# --------------------
# Location
# --------------------
class LocationBase(BaseModel):
    city: Optional[str] = None
    county: Optional[str] = None
    state: str = "Tennessee"
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    description: Optional[str] = None

class LocationCreate(LocationBase):
    pass

class LocationOut(LocationBase):
    id: int

    class Config:
        from_attributes = True
