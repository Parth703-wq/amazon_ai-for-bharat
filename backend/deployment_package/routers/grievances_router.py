import uuid
import random
import string
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
import models
from auth import get_current_user
from aws_services import ses_send_email

logger = logging.getLogger("jansahayak")

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

    # ── SES: Grievance confirmation email ────────────────────────────────
    if current_user.email:
        conf_html = f"""
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px">
            <h2 style="color:#1a56db">Grievance Registered ✔</h2>
            <p>Namaste <strong>{current_user.full_name}</strong>,</p>
            <p>Aapki shikayat safaltapoorvak darj ho gayi hai.</p>
            <table style="border-collapse:collapse;width:100%;margin:16px 0">
                <tr><td style="padding:8px;background:#f3f4f6;font-weight:bold">Ticket ID</td>
                    <td style="padding:8px;font-family:monospace;font-size:18px;color:#1a56db">{ticket_id}</td></tr>
                <tr><td style="padding:8px;background:#f3f4f6;font-weight:bold">Category</td>
                    <td style="padding:8px">{data.category}</td></tr>
                <tr><td style="padding:8px;background:#f3f4f6;font-weight:bold">Status</td>
                    <td style="padding:8px;color:#f59e0b">Submitted</td></tr>
                <tr><td style="padding:8px;background:#f3f4f6;font-weight:bold">Expected Resolution</td>
                    <td style="padding:8px">7–14 working days</td></tr>
            </table>
            <p style="color:#6b7280;font-size:13px">Ticket ID <strong>{ticket_id}</strong> save karein. JanSahayak AI • noreply@jansahayak.ai</p>
        </div>
        """
        try:
            ses_send_email(
                to_email=current_user.email,
                subject=f"JanSahayak Grievance Registered: {ticket_id}",
                html_body=conf_html,
            )
        except Exception as e:
            logger.warning("[SES] Grievance confirmation email failed: %s", str(e))

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

    # ── SES: Status update email to citizen ──────────────────────────────
    citizen = grievance.user
    if citizen and citizen.email:
        new_status = grievance.status.value
        status_color = {"Resolved": "#16a34a", "Actioned": "#2563eb",
                        "Under Review": "#d97706", "Closed": "#6b7280"}.get(new_status, "#374151")
        update_html = f"""
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px">
            <h2 style="color:#1a56db">Grievance Status Update</h2>
            <p>Namaste <strong>{citizen.full_name}</strong>,</p>
            <p>Aapki shikayat <strong>{grievance.ticket_id}</strong> ki sthiti badal gayi hai:</p>
            <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0">
                <p style="margin:0;font-size:20px;font-weight:bold;color:{status_color}">{new_status}</p>
                {f'<p style="margin:8px 0 0;color:#374151">{grievance.resolution_notes}</p>' if grievance.resolution_notes else ''}
            </div>
            <p style="color:#6b7280;font-size:13px">JanSahayak AI • noreply@jansahayak.ai</p>
        </div>
        """
        try:
            ses_send_email(
                to_email=citizen.email,
                subject=f"Grievance {grievance.ticket_id} Status: {new_status}",
                html_body=update_html,
            )
        except Exception as e:
            logger.warning("[SES] Status update email failed: %s", str(e))

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
