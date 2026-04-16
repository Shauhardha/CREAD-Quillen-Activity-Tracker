from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db  # adjust import if needed

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

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


@router.get("/activity-type-breakdown")
def activity_type_breakdown(db: Session = Depends(get_db)):
    query = text("""
        SELECT
            COALESCE(at.activityType_name, 'Unclassified') AS activity_type,
            COUNT(a.id) AS count
        FROM activities a
        LEFT JOIN activity_types at ON at.id = a.activity_type_id
        WHERE a.deleted_at IS NULL
        GROUP BY at.id, at.activityType_name
        ORDER BY count DESC
    """)
    return db.execute(query).mappings().all()


@router.get("/calendar-activities")
def calendar_activities(db: Session = Depends(get_db)):
    query = text("""
        SELECT
            a.id,
            a.title,
            a.status,
            a.start_date,
            a.end_date,
            MAX(pu.update_date)          AS latest_update_date,
            COALESCE(i.id, 0)            AS initiative_id,
            COALESCE(i.name, '')         AS initiative_name,
            COALESCE(l.city, '')         AS city,
            COALESCE(l.state, '')        AS state
        FROM activities a
        LEFT JOIN initiatives i       ON i.id  = a.initiative_id
        LEFT JOIN locations l         ON l.id  = a.location_id
        LEFT JOIN progress_updates pu ON pu.activity_id = a.id
                                     AND pu.deleted_at IS NULL
        WHERE a.deleted_at IS NULL
        GROUP BY a.id, a.title, a.status, a.start_date, a.end_date,
                 i.id, i.name, l.city, l.state
        ORDER BY a.start_date
    """)
    return db.execute(query).mappings().all()


@router.get("/initiative-progress")
def initiative_progress(db: Session = Depends(get_db)):
    query = text("""
        SELECT
            i.name AS initiative_name,
            COUNT(a.id) AS total,
            COALESCE(SUM(a.status = 'planned'), 0) AS planned,
            COALESCE(SUM(a.status = 'in_progress'), 0) AS in_progress,
            COALESCE(SUM(a.status = 'completed'), 0) AS completed
        FROM initiatives i
        LEFT JOIN activities a ON a.initiative_id = i.id AND a.deleted_at IS NULL
        GROUP BY i.id, i.name
        ORDER BY i.name
    """)
    return db.execute(query).mappings().all()


@router.get("/monthly-trend")
def monthly_trend(db: Session = Depends(get_db)):
    """Returns activity counts grouped by month (YYYY-MM) for the last 24 months."""
    query = text("""
        SELECT
            DATE_FORMAT(start_date, '%Y-%m') AS month,
            COUNT(*)                          AS count
        FROM activities
        WHERE deleted_at IS NULL
          AND start_date IS NOT NULL
          AND start_date >= DATE_SUB(CURDATE(), INTERVAL 24 MONTH)
        GROUP BY DATE_FORMAT(start_date, '%Y-%m')
        ORDER BY month
    """)
    return db.execute(query).mappings().all()


@router.get("/funding-by-source")
def funding_by_source(db: Session = Depends(get_db)):
    """Returns activity count and total funding amount grouped by funding source."""
    query = text("""
        SELECT
            COALESCE(fs.source_name, 'Unspecified') AS source,
            COUNT(a.id)                       AS count,
            COALESCE(SUM(a.funding_amount), 0) AS total_amount
        FROM activities a
        LEFT JOIN funding_sources fs ON fs.id = a.funding_source_id
        WHERE a.deleted_at IS NULL
        GROUP BY fs.id, fs.source_name
        ORDER BY count DESC
    """)
    return db.execute(query).mappings().all()


@router.get("/cultural-wealth-frequency")
def cultural_wealth_frequency(db: Session = Depends(get_db)):
    """Returns how many activities are tagged with each cultural wealth capital."""
    query = text("""
        SELECT
            cwt.name                             AS tag,
            COUNT(DISTINCT acw.activity_id)      AS count
        FROM cultural_wealth_tags cwt
        LEFT JOIN activity_cultural_wealth acw
               ON acw.cultural_wealth_id = cwt.id
        LEFT JOIN activities a
               ON a.id = acw.activity_id AND a.deleted_at IS NULL
        WHERE cwt.deleted_at IS NULL
        GROUP BY cwt.id, cwt.name
        ORDER BY cwt.name
    """)
    return db.execute(query).mappings().all()


@router.get("/update-frequency")
def update_frequency(db: Session = Depends(get_db)):
    """Returns progress-update counts grouped by month for the last 12 months."""
    query = text("""
        SELECT
            DATE_FORMAT(update_date, '%Y-%m') AS month,
            COUNT(*)                           AS count
        FROM progress_updates
        WHERE deleted_at IS NULL
          AND update_date IS NOT NULL
          AND update_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(update_date, '%Y-%m')
        ORDER BY month
    """)
    return db.execute(query).mappings().all()
