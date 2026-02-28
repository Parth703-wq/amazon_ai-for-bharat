from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
import models
from auth import get_optional_user
from aws_services import bedrock_chat, save_chat_to_dynamodb, get_chat_from_dynamodb, text_to_speech_polly
from config import settings
import uuid

router = APIRouter(prefix="/chat", tags=["AI Chat"])


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    language: str = "en"


@router.post("/message")
async def chat(
    data: ChatRequest,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    session_id = data.session_id or str(uuid.uuid4())

    # Build user context if logged in
    user_context = None
    if current_user:
        user_context = {
            "annual_income": current_user.annual_income,
            "state": current_user.state,
            "caste_category": current_user.caste_category,
        }

    # Get AI response via Amazon Bedrock (falls back to Gemini if no AWS creds)
    response_text = await bedrock_chat(
        user_message=data.message,
        language=data.language,
        user_context=user_context,
    )

    uid = current_user.id if current_user else None

    # Save to MySQL (primary persistence)
    db.add(models.ChatMessage(
        user_id=uid,
        session_id=session_id,
        role="user",
        content=data.message,
        language=data.language,
    ))
    db.add(models.ChatMessage(
        user_id=uid,
        session_id=session_id,
        role="assistant",
        content=response_text,
        language=data.language,
    ))
    db.commit()

    # Also save to DynamoDB for fast retrieval (optional, if AWS configured)
    save_chat_to_dynamodb(session_id, uid, "user", data.message, data.language)
    save_chat_to_dynamodb(session_id, uid, "assistant", response_text, data.language)

    # Amazon Polly — convert AI response to voice (Hindi/regional MP3)
    # Returns presigned S3 URL if Polly+S3 configured, else None
    audio_url = text_to_speech_polly(
        text=response_text,
        language=data.language,
        session_id=session_id,
    )

    return {
        "session_id": session_id,
        "response": response_text,
        "audio_url": audio_url,   # Frontend plays this MP3 directly
        "language": data.language,
        "ai_provider": settings.AI_PROVIDER,
    }


@router.get("/history/{session_id}")
def get_history(session_id: str, db: Session = Depends(get_db)):
    # Try DynamoDB first (faster), fall back to MySQL
    dynamo_history = get_chat_from_dynamodb(session_id)
    if dynamo_history:
        return dynamo_history

    messages = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.session_id == session_id)
        .order_by(models.ChatMessage.created_at.asc())
        .all()
    )
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in messages
    ]
