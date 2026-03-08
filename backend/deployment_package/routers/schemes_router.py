from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional, List
from database import get_db
import models
from auth import get_current_user, get_optional_user
from aws_services import bedrock_match_schemes

router = APIRouter(prefix="/schemes", tags=["Schemes"])


@router.get("/")
def get_schemes(
    category: Optional[str] = None,
    state: Optional[str] = None,
    search: Optional[str] = None,
    max_income: Optional[float] = None,
    beneficiary_type: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(models.Scheme).filter(models.Scheme.is_active == True)

    if category:
        query = query.filter(
            func.lower(models.Scheme.category) == category.lower()
        )
    if state and state.lower() != "all":
        query = query.filter(
            or_(
                models.Scheme.state == state,
                models.Scheme.state == "all",
                models.Scheme.state == None,
            )
        )
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                models.Scheme.name.ilike(pattern),
                models.Scheme.description.ilike(pattern),
                models.Scheme.eligibility_criteria.ilike(pattern),
                models.Scheme.tags.ilike(pattern),
                models.Scheme.ministry.ilike(pattern),
            )
        )
    if max_income:
        query = query.filter(
            or_(models.Scheme.income_limit >= max_income, models.Scheme.income_limit == None)
        )
    if beneficiary_type:
        query = query.filter(models.Scheme.beneficiary_type == beneficiary_type)

    total = query.count()
    schemes = query.offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "schemes": [_scheme_to_dict(s) for s in schemes],
    }


@router.get("/match/ai")
async def ai_match_schemes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Use AI to match schemes to the logged-in user's profile."""
    schemes = db.query(models.Scheme).filter(models.Scheme.is_active == True).all()
    user_profile = {
        "annual_income": current_user.annual_income,
        "state": current_user.state,
        "caste_category": current_user.caste_category,
    }
    scheme_dicts = [_scheme_to_dict(s) for s in schemes]
    try:
        ai_matches = await bedrock_match_schemes(user_profile, scheme_dicts)
    except Exception:
        ai_matches = []

    return {"schemes": scheme_dicts[:10], "ai_matches": ai_matches, "ai_matched": True}


@router.get("/user/matches")
def get_user_matches(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    matches = (
        db.query(models.SchemeMatch)
        .filter(models.SchemeMatch.user_id == current_user.id)
        .order_by(models.SchemeMatch.match_percentage.desc())
        .all()
    )
    return [
        {
            **_scheme_to_dict(m.scheme),
            "match_percentage": m.match_percentage,
            "match_reasons": m.match_reasons,
        }
        for m in matches
    ]


@router.get("/{scheme_id}")
def get_scheme(scheme_id: int, db: Session = Depends(get_db)):
    scheme = db.query(models.Scheme).filter(models.Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return _scheme_to_dict(scheme)


def _scheme_to_dict(scheme: models.Scheme) -> dict:
    d = {
        "id": scheme.id,
        "name": scheme.name,
        "category": scheme.category or "",
        "ministry": scheme.ministry,
        "description": scheme.description,
        "description_simple": scheme.description,
        "benefit_amount": scheme.benefit_amount,
        "benefit_type": scheme.benefit_type,
        "eligibility_criteria": scheme.eligibility_criteria,
        "required_documents": scheme.required_documents,
        "applying_authority": getattr(scheme, "applying_authority", None),
        "scheme_type": getattr(scheme, "scheme_type", "central"),
        "state_specific": getattr(scheme, "state", None),
        "deadline": scheme.deadline.isoformat() if scheme.deadline else None,
        "launch_year": getattr(scheme, "launch_year", None),
        "beneficiary_type": getattr(scheme, "beneficiary_type", None),
        "min_age": scheme.min_age,
        "max_age": scheme.max_age,
        "income_limit": getattr(scheme, "income_limit", None),
        "gender": getattr(scheme, "gender", "all"),
        "caste": getattr(scheme, "caste", "all"),
        "tags": getattr(scheme, "tags", None),
        "is_active": scheme.is_active,
    }
    # Include all 27 translation columns (may be None if not yet translated)
    TRANS_LANGS = ["hi", "gu", "bn", "ta", "te", "mr", "pa", "kn", "ml"]
    TRANS_FIELDS = ["description", "eligibility_criteria", "required_documents"]
    for field in TRANS_FIELDS:
        for lang in TRANS_LANGS:
            col = f"{field}_{lang}"
            d[col] = getattr(scheme, col, None)
    return d
