import uuid
import random
import string
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
import models
from auth import get_current_user

router = APIRouter(prefix="/grievances", tags=["Grievances"])

CATEGORIES = ["Wages / NREGA", "Pension", "Ration / PDS", "Housing", "Health", "Education", "Other"]


def generate_ticket_id() -> str:
    suffix = "".join(random.choices(string.digits, k=4))
    return f"GR-{suffix}"


class GrievanceCreateRequest(BaseModel):
    category: str
    description: str
    aadhaar_last4: Optional[str] = None


@router.post("/", status_code=201)
def create_grievance(
    data: GrievanceCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if data.category not in CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category. Choose from: {CATEGORIES}")

    # Generate unique ticket ID
    ticket_id = generate_ticket_id()
    while db.query(models.Grievance).filter(models.Grievance.ticket_id == ticket_id).first():
        ticket_id = generate_ticket_id()

    grievance = models.Grievance(
        user_id=current_user.id,
        ticket_id=ticket_id,
        category=data.category,
        description=data.description,
    )
    db.add(grievance)
    db.commit()
    db.refresh(grievance)

    return {
        "ticket_id": ticket_id,
        "grievance_id": grievance.id,
        "status": grievance.status.value,
        "message": f"Grievance registered successfully. Your ticket ID is {ticket_id}",
        "category": data.category,
    }


@router.get("/")
def get_my_grievances(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    grievances = (
        db.query(models.Grievance)
        .filter(models.Grievance.user_id == current_user.id)
        .order_by(models.Grievance.created_at.desc())
        .all()
    )
    return [_grievance_to_dict(g) for g in grievances]


@router.get("/track/{ticket_id}")
def track_grievance(ticket_id: str, db: Session = Depends(get_db)):
    grievance = db.query(models.Grievance).filter(models.Grievance.ticket_id == ticket_id).first()
    if not grievance:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return _grievance_to_dict(grievance)


@router.patch("/{grievance_id}/status")
def update_status(
    grievance_id: int,
    status_update: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role.value not in ["admin", "officer"]:
        raise HTTPException(status_code=403, detail="Only admins/officers can update status")

    grievance = db.query(models.Grievance).filter(models.Grievance.id == grievance_id).first()
    if not grievance:
        raise HTTPException(status_code=404, detail="Grievance not found")

    if "status" in status_update:
        try:
            grievance.status = models.GrievanceStatus(status_update["status"])
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status")

    if "resolution_notes" in status_update:
        grievance.resolution_notes = status_update["resolution_notes"]

    db.commit()
    return {"message": "Grievance status updated"}


def _grievance_to_dict(g: models.Grievance) -> dict:
    return {
        "id": g.id,
        "ticket_id": g.ticket_id,
        "category": g.category,
        "description": g.description,
        "status": g.status.value,
        "resolution_notes": g.resolution_notes,
        "created_at": g.created_at.isoformat() if g.created_at else None,
        "updated_at": g.updated_at.isoformat() if g.updated_at else None,
    }
