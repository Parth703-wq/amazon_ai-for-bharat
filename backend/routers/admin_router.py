from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from database import get_db
import models
from auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])


def require_admin(current_user: models.User = Depends(get_current_user)):
    role_val = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    if role_val != "admin":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db), _=Depends(require_admin)):
    total_users = db.query(models.User).filter(models.User.role == models.UserRole.citizen).count()
    total_conversations = db.query(
        func.count(func.distinct(models.ChatMessage.session_id))
    ).scalar()
    total_scheme_matches = db.query(models.SchemeMatch).count()
    total_grievances = db.query(models.Grievance).count()
    resolved_grievances = db.query(models.Grievance).filter(
        models.Grievance.status == "Resolved"
    ).count()

    # Voice vs Text chart data (simulated from chat messages)
    voice_pct = 65
    text_pct = 35

    # Language distribution (recent messages)
    lang_data = (
        db.query(models.ChatMessage.language, func.count(models.ChatMessage.id).label("count"))
        .group_by(models.ChatMessage.language)
        .limit(8)
        .all()
    )

    # Recent grievances
    recent_grievances = (
        db.query(models.Grievance)
        .order_by(desc(models.Grievance.created_at))
        .limit(5)
        .all()
    )

    return {
        "kpis": {
            "total_citizens": total_users,
            "active_conversations": total_conversations or 0,
            "schemes_matched": total_scheme_matches,
            "total_grievances": total_grievances,
            "resolved_grievances": resolved_grievances,
            "benefits_unlocked_estimate": total_scheme_matches * 4500,
        },
        "voice_text_ratio": {"voice": voice_pct, "text": text_pct},
        "language_distribution": [
            {"name": lang or "unknown", "users": count} for lang, count in lang_data
        ],
        "recent_grievances": [
            {
                "ticket_id": g.ticket_id,
                "category": g.category,
                "status": g.status.value,
                "created_at": g.created_at.isoformat() if g.created_at else None,
            }
            for g in recent_grievances
        ],
    }


@router.get("/users")
def get_users(
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    total = db.query(models.User).count()
    users = (
        db.query(models.User)
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return {
        "total": total,
        "users": [
            {
                "id": u.id,
                "full_name": u.full_name,
                "phone": u.phone,
                "state": u.state,
                "role": u.role.value,
                "is_verified": u.is_verified,
                "profile_complete": u.profile_complete,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ],
    }


@router.get("/grievances")
def get_all_grievances(
    status: str = None,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    query = db.query(models.Grievance)
    if status:
        query = query.filter(models.Grievance.status == models.GrievanceStatus(status))
    total = query.count()
    items = query.order_by(desc(models.Grievance.created_at)).offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total,
        "items": [
            {
                "id": g.id,
                "ticket_id": g.ticket_id,
                "category": g.category,
                "status": g.status.value,
                "user_phone": g.user.phone if g.user else None,
                "created_at": g.created_at.isoformat() if g.created_at else None,
            }
            for g in items
        ],
    }
