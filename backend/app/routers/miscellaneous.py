from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app.auth import require_admin

from app.models.miscellaneous import (
    PartnershipType,
    FundingSource,
    EducationLevel,
    CulturalWealthTag,
    Location,
)

from app.schemas.miscellaneous import (
    PartnershipTypeCreate, PartnershipTypeOut,
    FundingSourceCreate, FundingSourceOut,
    EducationLevelCreate, EducationLevelOut,
    CulturalWealthTagCreate, CulturalWealthTagOut,
    LocationCreate, LocationOut,
)

router = APIRouter(prefix="/api/misc", tags=["Miscellaneous"])

# --------------------------------------------------
# Partnership Types
# --------------------------------------------------
@router.post("/partnership-types", response_model=PartnershipTypeOut, dependencies=[Depends(require_admin)])
def add_partnership_type(payload: PartnershipTypeCreate, db: Session = Depends(get_db)):
    item = PartnershipType(**payload.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/partnership-types", response_model=List[PartnershipTypeOut])
def get_partnership_types(db: Session = Depends(get_db)):
    # return db.query(PartnershipType).all()
    try:
        partnership = db.query(PartnershipType).filter(PartnershipType.deleted_at == None).all()
        return partnership
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/partnership-types/{id}", dependencies=[Depends(require_admin)])
def delete_partnership_type(id: int, db: Session = Depends(get_db)):
    item = db.query(PartnershipType).get(id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    # db.delete(item)
    item.deleted_at = datetime.utcnow()
    db.commit()
    return {"message": "Deleted"}

@router.put("/partnership-types/{id}", response_model=PartnershipTypeOut, dependencies=[Depends(require_admin)])
def update_partnership_type(payload: PartnershipTypeCreate, id: int, db: Session = Depends(get_db)):
    item = db.query(PartnershipType).filter(PartnershipType.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Patnership-type not found")

    item.type_name = payload.type_name
    item.description = payload.description
    db.commit()
    db.refresh(item)
    return item


# --------------------------------------------------
# Funding Sources
# --------------------------------------------------
@router.post("/funding-sources", response_model=FundingSourceOut, dependencies=[Depends(require_admin)])
def add_funding_source(payload: FundingSourceCreate, db: Session = Depends(get_db)):
    item = FundingSource(**payload.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/funding-sources", response_model=List[FundingSourceOut])
def get_funding_sources(db: Session = Depends(get_db)):
    try:
        funding = db.query(FundingSource).filter(FundingSource.deleted_at == None).all()
        return funding
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/funding-sources/{id}", dependencies=[Depends(require_admin)])
def delete_funding_source(id: int, db: Session = Depends(get_db)):
    item = db.query(FundingSource).get(id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    item.deleted_at = datetime.utcnow()
    db.commit()
    return {"message": "Deleted"}

@router.put("/funding-sources/{id}", response_model=FundingSourceOut, dependencies=[Depends(require_admin)])
def update_funding_type(payload: FundingSourceCreate, id: int, db: Session = Depends(get_db)):
    item = db.query(FundingSource).filter(FundingSource.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Funding source not found")

    item.source_name = payload.source_name
    item.description = payload.description
    db.commit()
    db.refresh(item)
    return item


# --------------------------------------------------
# Education Levels
# --------------------------------------------------
@router.post("/education-levels", response_model=EducationLevelOut, dependencies=[Depends(require_admin)])
def add_education_level(payload: EducationLevelCreate, db: Session = Depends(get_db)):
    item = EducationLevel(**payload.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/education-levels", response_model=List[EducationLevelOut])
def get_education_levels(db: Session = Depends(get_db)):
    try:
        education_levels = db.query(EducationLevel).filter(EducationLevel.deleted_at == None).all()
        return education_levels
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/education-levels/{id}", dependencies=[Depends(require_admin)])
def delete_education_level(id: int, db: Session = Depends(get_db)):
    item = db.query(EducationLevel).get(id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    item.deleted_at = datetime.utcnow()
    db.commit()
    return {"message": "Deleted"}

@router.put("/education-levels/{id}", response_model=EducationLevelOut, dependencies=[Depends(require_admin)])
def update_education_level(payload: EducationLevelCreate, id: int, db: Session = Depends(get_db)):
    item = db.query(EducationLevel).filter(EducationLevel.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Education level not found")

    item.level_name = payload.level_name
    item.description = payload.description
    db.commit()
    db.refresh(item)
    return item


# --------------------------------------------------
# Cultural Wealth Tags
# --------------------------------------------------
@router.post("/cultural-wealth-tags", response_model=CulturalWealthTagOut, dependencies=[Depends(require_admin)])
def add_cultural_wealth_tag(payload: CulturalWealthTagCreate, db: Session = Depends(get_db)):
    item = CulturalWealthTag(**payload.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/cultural-wealth-tags", response_model=List[CulturalWealthTagOut])
def get_cultural_wealth_tags(db: Session = Depends(get_db)):
    try:
        cultural_wealth = db.query(CulturalWealthTag).filter(CulturalWealthTag.deleted_at == None).all()
        return cultural_wealth
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/cultural-wealth-tags/{id}", dependencies=[Depends(require_admin)])
def delete_cultural_wealth_tag(id: int, db: Session = Depends(get_db)):
    item = db.query(CulturalWealthTag).get(id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    # db.delete(item)
    item.deleted_at = datetime.utcnow()
    db.commit()
    return {"message": "Deleted"}

@router.put("/cultural-wealth-tags/{id}", response_model=CulturalWealthTagOut, dependencies=[Depends(require_admin)])
def update_cultural_wealth_tag(payload: CulturalWealthTagCreate, id: int, db: Session = Depends(get_db)):
    item = db.query(CulturalWealthTag).filter(CulturalWealthTag.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cultural wealth tag not found")

    item.name = payload.name
    item.description = payload.description
    db.commit()
    db.refresh(item)
    return item


# --------------------------------------------------
# Locations
# --------------------------------------------------
@router.post("/locations", response_model=LocationOut, dependencies=[Depends(require_admin)])
def add_location(payload: LocationCreate, db: Session = Depends(get_db)):
    item = Location(**payload.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/locations", response_model=List[LocationOut])
def get_locations(db: Session = Depends(get_db)):
    return db.query(Location).all()

@router.delete("/locations/{id}", dependencies=[Depends(require_admin)])
def delete_location(id: int, db: Session = Depends(get_db)):
    item = db.query(Location).get(id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"message": "Deleted"}
