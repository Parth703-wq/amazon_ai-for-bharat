from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import PlainTextResponse
from contextlib import asynccontextmanager
import os
import logging
from datetime import datetime, timedelta, timezone

# APScheduler — daily SMS deadline alerts via Amazon SNS
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from config import settings
from database import engine, Base, get_db

logger = logging.getLogger("jansahayak")

# Import all models so they register with SQLAlchemy
import models  # noqa: F401

# Import routers
from routers.auth_router import router as auth_router
from routers.schemes_router import router as schemes_router
from routers.chat_router import router as chat_router
from routers.documents_router import router as documents_router
from routers.grievances_router import router as grievances_router
from routers.locations_router import router as locations_router
from routers.admin_router import router as admin_router
from routers.whatsapp import router as whatsapp_router
from routers.polly_router import router as polly_router


# ─── SNS Deadline Alert Job (runs daily at 9 AM IST) ────────────────────────

DEADLINE_DAYS = [30, 7, 1]   # Alert when deadline is exactly 30, 7, or 1 day away


def send_deadline_alerts():
    """
    APScheduler job: runs every day at 09:00 IST.
    Queries schemes whose deadline is exactly 30, 7, or 1 day from today.
    For each matching scheme, finds users whose state matches the scheme state.
    Sends SNS SMS to each user who has a mobile number.
    """
    from aws_services import sns_send_sms

    db = next(get_db())
    try:
        today_ist = datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)
        today_date = today_ist.date()

        alerts_sent = 0
        for days_ahead in DEADLINE_DAYS:
            target_date = today_date + timedelta(days=days_ahead)

            schemes = (
                db.query(models.Scheme)
                .filter(
                    models.Scheme.is_active == True,  # noqa: E712
                    models.Scheme.deadline.isnot(None),
                )
                .all()
            )
            matching = [
                s for s in schemes
                if s.deadline and s.deadline.date() == target_date
            ]

            for scheme in matching:
                user_query = db.query(models.User).filter(models.User.is_active == True)  # noqa: E712
                if scheme.state and scheme.state.lower() not in ("all", "central", ""):
                    user_query = user_query.filter(models.User.state == scheme.state)

                users = user_query.all()
                for user in users:
                    if not user.phone:
                        continue
                    phone = user.phone.strip()
                    if not phone.startswith("+"):
                        phone = "+91" + phone.lstrip("0")

                    sms_text = (
                        f"JanSahayak Alert: {scheme.name} ki antim tithi "
                        f"{days_ahead} din baad hai. Abhi apply karein. "
                        f"Helpline: 1800-11-4000"
                    )
                    msg_id = sns_send_sms(phone, sms_text)
                    if msg_id:
                        alerts_sent += 1
                        logger.info(
                            "[SNS-Job] Alert sent | scheme=%s | days=%d | user=%d | msg=%s",
                            scheme.name[:30], days_ahead, user.id, msg_id,
                        )

        logger.info("[SNS-Job] Daily deadline job complete | total_alerts=%d", alerts_sent)

    except Exception as e:
        logger.error("[SNS-Job] Deadline alert job failed: %s", str(e))
    finally:
        db.close()


# Global scheduler instance
_scheduler = BackgroundScheduler(timezone="Asia/Kolkata")


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    print("JanSahayak AI Backend started")
    print(f"Database: {settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}")
    print(f"AI Provider: {'Bedrock (Claude 3 Sonnet)' if settings.USE_BEDROCK else 'Gemini via Lambda'}")
    print(f"RAG: {'Enabled (KB: ' + settings.BEDROCK_KNOWLEDGE_BASE_ID[:8] + '...)' if settings.USE_RAG else 'Disabled'}")

    # ── S3 Lifecycle Policy (auto-delete documents/ after 1 day) ──────────────
    from aws_services import setup_s3_lifecycle_policy
    setup_s3_lifecycle_policy()

    # ── APScheduler: SNS deadline alerts every day at 09:00 IST ──────────────
    _scheduler.add_job(
        send_deadline_alerts,
        trigger=CronTrigger(hour=9, minute=0, timezone="Asia/Kolkata"),
        id="sns_deadline_alerts",
        name="SNS Deadline Alert Job",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info("[Scheduler] SNS deadline alert job scheduled at 09:00 IST daily")

    yield

    # Clean shutdown
    _scheduler.shutdown(wait=False)
    logger.info("[Scheduler] APScheduler stopped")
    print("Shutting down JanSahayak AI Backend")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API for JanSahayak AI — Helping Indian Citizens Find Government Schemes",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS — allow Amplify domain + localhost for dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for local uploads (not used in Lambda mode)
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Register all routers
app.include_router(auth_router,       prefix="/api/v1")
app.include_router(schemes_router,    prefix="/api/v1")
app.include_router(chat_router,       prefix="/api/v1")
app.include_router(documents_router,  prefix="/api/v1")
app.include_router(grievances_router, prefix="/api/v1")
app.include_router(locations_router,  prefix="/api/v1")
app.include_router(admin_router,      prefix="/api/v1")
app.include_router(polly_router,      prefix="/api/v1")
app.include_router(whatsapp_router)   # No /api/v1 prefix — Twilio posts here directly


@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "healthy", "db": "connected"}


@app.get("/webhook/test", response_class=PlainTextResponse)
def webhook_test():
    """Quick sanity-check — confirms backend is reachable."""
    return "JanSahayak webhook is live ✅"


# ─── AWS Lambda Handler (Mangum) ──────────────────────────────────────────────
try:
    from mangum import Mangum
    handler = Mangum(app, lifespan="off")
except ImportError:
    handler = None
