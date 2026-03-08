"""
JanSahayak AI — WhatsApp Webhook via Twilio
============================================
Step 1 — Run backend:
    cd backend
    venv\\Scripts\\uvicorn main:app --reload --port 8001

Step 2 — Copy the NGROK URL printed in terminal when backend starts (looks like https://xxxx.ngrok.io)

Step 3 — Go to Twilio Console → Messaging → Try it out → WhatsApp Sandbox Settings
    URL: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn

Step 4 — Paste ngrok URL + /webhook/whatsapp in the "When a message comes in" field
    Example: https://abc123.ngrok.io/webhook/whatsapp

Step 5 — Set method to HTTP POST and Save

Step 6 — Send any WhatsApp message to +1 415 523 8886 with text like:
    "main kisan hoon, UP mein rehta hoon, income 50000 hai"
    You will receive top matching schemes as a reply.
"""

import os
from fastapi import APIRouter, Request, Response
from twilio.twiml.messaging_response import MessagingResponse
from twilio.rest import Client
from database import SessionLocal
import models
from config import settings

router = APIRouter(prefix="/webhook", tags=["WhatsApp Webhook"])

# ─── Twilio Client ──────────────────────────────────────────────────────────
def get_twilio_client() -> Client:
    return Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)


# ─── Simple keyword scheme matcher (no auth needed for WhatsApp) ─────────────
def match_schemes_from_message(body: str, db) -> list:
    """
    Simple DB-based scheme matcher for WhatsApp.
    Searches scheme name, description, category for keywords from user message.
    Returns top 3 matched schemes.
    """
    keywords = body.lower().split()
    
    # Category keyword map
    CATEGORY_MAP = {
        "kisan": "Agriculture", "farmer": "Agriculture", "fasal": "Agriculture",
        "health": "Health", "swasthya": "Health", "hospital": "Health", "beemar": "Health",
        "awas": "Housing", "ghar": "Housing", "house": "Housing", "home": "Housing",
        "scholarship": "Education", "padhai": "Education", "school": "Education", "student": "Education",
        "mudra": "Finance", "loan": "Finance", "business": "Finance", "rozgar": "Finance",
        "mahila": "Women", "women": "Women", "beti": "Women",
        "pension": "Social Security", "budhapa": "Social Security",
    }

    # Determine category from message keywords
    matched_category = None
    for kw in keywords:
        if kw in CATEGORY_MAP:
            matched_category = CATEGORY_MAP[kw]
            break

    # Query schemes
    query = db.query(models.Scheme).filter(models.Scheme.is_active == True)
    if matched_category:
        query = query.filter(models.Scheme.category == matched_category)

    schemes = query.limit(3).all()

    # Fallback: return top 3 active schemes if nothing matched
    if not schemes:
        schemes = db.query(models.Scheme).filter(
            models.Scheme.is_active == True
        ).limit(3).all()

    return schemes


# ─── WhatsApp Webhook Endpoint ───────────────────────────────────────────────
@router.post("/whatsapp")
async def whatsapp_webhook(request: Request):
    """
    Twilio sends every incoming WhatsApp message to this endpoint.
    We parse the message, match schemes, and reply.
    """
    form_data = await request.form()
    from_number = form_data.get("From", "")
    body = form_data.get("Body", "").strip()

    db = SessionLocal()
    try:
        matched_schemes = match_schemes_from_message(body, db)
    finally:
        db.close()

    # Build reply
    resp = MessagingResponse()
    msg = resp.message()

    if matched_schemes:
        lines = ["*JanSahayak AI*\nAapke liye yeh yojanaein mili:\n"]
        for i, scheme in enumerate(matched_schemes, 1):
            benefit = scheme.benefit_amount or "Jankari ke liye apply karein"
            lines.append(f"{i}. *{scheme.name}*\n   Labh: {benefit}")
        lines.append("\nWebsite: jansahayak.ai")
        reply_text = "\n".join(lines)
    else:
        reply_text = (
            "Khed hai, koi yojana nahi mili. "
            "Dobara bhejein jaise — "
            "\"main kisan hoon, UP mein rehta hoon, income 1 lakh hai.\""
        )

    msg.body(reply_text)
    return Response(content=str(resp), media_type="application/xml")
