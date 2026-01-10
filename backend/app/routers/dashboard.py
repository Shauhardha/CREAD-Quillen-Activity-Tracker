from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db  # adjust import if needed

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/activities")
def dashboard_activities(db: Session = Depends(get_db)):
    query = text("""
        SELECT
            a.id,
            a.title,
            a.description,
            a.status,
            a.start_date,
            a.end_date,
            MAX(pu.update_date) AS latest_update_date,
            a.location_id,
            l.city,
            l.county,
            l.state,
            l.latitude,
            l.longitude
        FROM activities a
        LEFT JOIN locations l ON l.id = a.location_id
        LEFT JOIN progress_updates pu ON pu.activity_id = a.id
        WHERE a.deleted_at IS NULL
        GROUP BY
            a.id, a.title, a.description, a.status,
            a.start_date, a.end_date, a.location_id,
            l.city, l.county, l.state, l.latitude, l.longitude
        ORDER BY pu.update_date DESC
    """)

    result = db.execute(query).mappings().all()
    return result

@router.get("/stakeholders")
def dashboard_stakeholders(db: Session = Depends(get_db)):
    query = text("""
        SELECT
            s.id,
            s.name,
            s.location_id,
            l.city,
            l.county,
            l.state,
            l.latitude,
            l.longitude
        FROM stakeholders s
        LEFT JOIN locations l ON l.id = s.location_id
        WHERE s.deleted_at IS NULL
        ORDER BY s.name
    """)

    return db.execute(query).mappings().all()


@router.get("/activity-status-summary")
def activity_status_summary(db: Session = Depends(get_db)):
    query = text("""
        SELECT
            COUNT(*) AS total,
            SUM(status = 'in_progress') AS in_progress,
            SUM(status = 'completed') AS completed,
            SUM(status = 'planned') AS planned
        FROM activities
        WHERE deleted_at IS NULL
    """)

    return db.execute(query).mappings().first()


@router.get("/counties-served")
def counties_served(db: Session = Depends(get_db)):
    query = text("""
        SELECT COUNT(DISTINCT l.county) AS counties_served
        FROM activities a
        LEFT JOIN locations l ON l.id = a.location_id
        WHERE a.deleted_at IS NULL
    """)

    return db.execute(query).mappings().first()


@router.get("/stakeholder-count")
def stakeholder_count(db: Session = Depends(get_db)):
    query = text("""
        SELECT COUNT(*) AS total_stakeholders
        FROM stakeholders
        WHERE deleted_at IS NULL
    """)

    return db.execute(query).mappings().first()
