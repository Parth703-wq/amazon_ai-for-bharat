"""
Polly Router — POST /api/v1/polly/speak
Returns base64-encoded MP3 audio from Amazon Polly.
Frontend decodes it and plays via HTML5 Audio API.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from aws_services import polly_speak

router = APIRouter(prefix="/polly", tags=["Amazon Polly TTS"])


class PollyRequest(BaseModel):
    text: str
    language: str = "hi"


class PollyResponse(BaseModel):
    audio_base64: str | None   # None means Polly not configured → frontend uses browser TTS
    language: str
    available: bool


@router.post("/speak", response_model=PollyResponse)
def speak(data: PollyRequest):
    """
    Convert text to speech via Amazon Polly.
    Returns base64-encoded MP3.
    If Polly unavailable, returns available=False so frontend falls back to browser TTS.
    """
    # Trim to Polly's safe limit
    safe_text = data.text[:2900]
    b64 = polly_speak(safe_text, data.language)

    return PollyResponse(
        audio_base64=b64,
        language=data.language,
        available=b64 is not None,
    )
