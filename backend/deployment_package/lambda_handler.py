"""
lambda_handler.py
=================
AWS Lambda entry point for JanSahayak AI FastAPI backend.
Uses Mangum to wrap the FastAPI ASGI app for Lambda + API Gateway.

This file is the Handler that AWS Lambda calls.
Set Handler to: lambda_handler.handler  in Lambda Console.
"""

from main import app
from mangum import Mangum

# lifespan="off" — Lambda is stateless; we don't run startup/shutdown events
# APScheduler (SNS alerts) does not run in Lambda — use EventBridge instead for production
handler = Mangum(app, lifespan="off")
