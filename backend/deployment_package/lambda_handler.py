"""
lambda_handler.py — AWS Lambda entry point for JanSahayak AI FastAPI backend.
Handler: lambda_handler.handler
"""
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

from main import app
from mangum import Mangum

_mangum_handler = Mangum(app, lifespan="off")


def handler(event, context):
    # Debug log — shows rawPath coming from API Gateway
    path = event.get("rawPath", event.get("path", "UNKNOWN"))
    method = event.get("requestContext", {}).get("http", {}).get("method", "?")
    logger.info(f"REQUEST: {method} {path}")
    logger.info(f"EVENT_KEYS: {list(event.keys())}")
    return _mangum_handler(event, context)

