# app/routers/locations.py
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.miscellaneous import Location
from app.auth import get_current_user

router = APIRouter(
    prefix="/api/locations",
    tags=["Locations"]
)

@router.get("/states")
def get_states(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    states = (
        db.query(Location.state)
        .filter(Location.deleted_at.is_(None))
        .distinct()
        .order_by(Location.state)
        .all()
    )
    return [s[0] for s in states]


@router.get("/counties")
def get_counties(state: str, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    counties = (
        db.query(Location.county)
        .filter(
            Location.state == state,
            Location.deleted_at.is_(None)
        )
        .distinct()
        .order_by(Location.county)
        .all()
    )
    return [c[0] for c in counties if c[0]]


@router.get("/cities")
def get_cities(state: str, county: str, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    cities = (
        db.query(Location)
        .filter(
            Location.state == state,
            Location.county == county,
            Location.deleted_at.is_(None)
        )
        .order_by(Location.city)
        .all()
    )
    # each item in `cities` is a Location object; return the city name
    return [c.city for c in cities if c.city]

@router.get("/id/", response_model=int)
def get_location_id(
    state: str = Query(...),
    county: str = Query(...),
    city: str = Query(...),
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    location = (
        db.query(Location)
        .filter(
            Location.state.ilike(state.strip()),
            Location.county.ilike(county.strip()),
            Location.city.ilike(city.strip())
        )
        .first()
    )

    if not location:
        raise HTTPException(
            status_code=404,
            detail="Location not found"
        )

    return location.id