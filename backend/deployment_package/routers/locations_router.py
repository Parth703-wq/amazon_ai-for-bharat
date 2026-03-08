from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
from database import get_db
import models
import math

router = APIRouter(prefix="/offices", tags=["Office Locator"])


def haversine(lat1, lon1, lat2, lon2):
    """Calculate distance in km between two coordinates."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def is_open_now():
    """Check if standard govt office hours (9AM-5PM Mon-Sat)."""
    from datetime import datetime
    now = datetime.now()
    return now.weekday() < 6 and 9 <= now.hour < 17


def office_to_dict(loc, user_lat=None, user_lng=None):
    dist = None
    if user_lat and user_lng and loc.latitude and loc.longitude:
        dist = round(haversine(user_lat, user_lng, loc.latitude, loc.longitude), 2)
    return {
        "id": loc.id,
        "name": loc.name,
        "office_type": loc.office_type,
        "address": loc.address,
        "city": getattr(loc, "city", loc.district if hasattr(loc, "district") else ""),
        "state": loc.state,
        "pincode": getattr(loc, "pincode", None),
        "latitude": loc.latitude,
        "longitude": loc.longitude,
        "phone": loc.phone,
        "open_time": getattr(loc, "open_time", "09:00"),
        "close_time": getattr(loc, "close_time", "17:00"),
        "working_days": getattr(loc, "working_days", "Mon-Sat"),
        "services": loc.services or [],
        "is_open": is_open_now(),
        "operating_hours": loc.operating_hours if hasattr(loc, "operating_hours") else "9:00 AM - 5:00 PM",
        "distance_km": dist,
    }


@router.get("/nearby")
def get_nearby_offices(
    lat: float = Query(...),
    lng: float = Query(...),
    radius: float = Query(default=50),
    limit: int = Query(default=10),
    db: Session = Depends(get_db),
):
    locations = db.query(models.OfficeLocation).filter(
        models.OfficeLocation.is_active == True
    ).all()

    result = []
    for loc in locations:
        if loc.latitude and loc.longitude:
            dist = haversine(lat, lng, loc.latitude, loc.longitude)
            if dist <= radius:
                d = office_to_dict(loc, lat, lng)
                result.append(d)

    result.sort(key=lambda x: x["distance_km"] or 9999)
    return result[:limit]


@router.get("/all")
def get_all_offices(
    state: Optional[str] = None,
    office_type: Optional[str] = None,
    search: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.OfficeLocation).filter(models.OfficeLocation.is_active == True)
    if state:
        query = query.filter(models.OfficeLocation.state.ilike(f"%{state}%"))
    if office_type:
        query = query.filter(models.OfficeLocation.office_type == office_type)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            models.OfficeLocation.name.ilike(pattern) |
            models.OfficeLocation.address.ilike(pattern) |
            models.OfficeLocation.state.ilike(pattern)
        )
    locations = query.all()
    result = [office_to_dict(loc, lat, lng) for loc in locations]
    if lat and lng:
        result.sort(key=lambda x: x["distance_km"] or 9999)
    return result


@router.get("/{office_id}")
def get_office(office_id: int, db: Session = Depends(get_db)):
    loc = db.query(models.OfficeLocation).filter(models.OfficeLocation.id == office_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Office not found")
    return office_to_dict(loc)
