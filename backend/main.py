from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from config import settings
from database import engine, Base

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


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    print("JanSahayak AI Backend started on port 8000")
    print(f"Database: {settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}")
    yield
    print("Shutting down JanSahayak AI Backend")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API for JanSahayak AI",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Register all routers
from routers.locations_router import router as offices_router  # new rich router

app.include_router(auth_router,       prefix="/api/v1")
app.include_router(schemes_router,    prefix="/api/v1")
app.include_router(chat_router,       prefix="/api/v1")
app.include_router(documents_router,  prefix="/api/v1")
app.include_router(grievances_router, prefix="/api/v1")
app.include_router(locations_router,  prefix="/api/v1")
app.include_router(offices_router,    prefix="/api/v1")
app.include_router(admin_router,      prefix="/api/v1")


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


# ─── AWS Lambda Handler (Mangum) ──────────────────────────────────────────────
# This makes the FastAPI app deployable on AWS Lambda via API Gateway.
# The Lambda function handler should be set to: main.handler
try:
    from mangum import Mangum
    handler = Mangum(app, lifespan="off")
except ImportError:
    handler = None  # mangum not installed locally — that's fine
