from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
import models
from auth import get_optional_user
from aws_services import (
    bedrock_chat, bedrock_rag_query,
    save_chat_to_dynamodb, get_chat_from_dynamodb, text_to_speech_polly,
)
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

    user_context = None
    if current_user:
        user_context = {
            "annual_income": current_user.annual_income,
            "state": current_user.state,
            "caste_category": current_user.caste_category,
        }

    # Fetch last 10 messages from DynamoDB for conversation context
    chat_history = get_chat_from_dynamodb(session_id, limit=10)

    # ── USE_RAG flag: Bedrock Knowledge Base RAG vs direct Bedrock call ───────
    rag_citations: list = []
    if settings.USE_RAG:
        # USE_RAG=true: retrieve_and_generate with Knowledge Base
        rag_result = await bedrock_rag_query(data.message, data.language)
        response_text = rag_result["response"]
        rag_citations  = rag_result.get("citations", [])
    else:
        # USE_RAG=false (default): direct Bedrock call (Gemini fallback if needed)
        response_text = await bedrock_chat(
            user_message=data.message,
            language=data.language,
            user_context=user_context,
            chat_history=chat_history,
        )

    uid = current_user.id if current_user else None

    # Save to MySQL (primary persistence)
    db.add(models.ChatMessage(
        user_id=uid, session_id=session_id, role="user",
        content=data.message, language=data.language,
    ))
    db.add(models.ChatMessage(
        user_id=uid, session_id=session_id, role="assistant",
        content=response_text, language=data.language,
    ))
    db.commit()

    # Save to DynamoDB (chat history for RAG/next turn context)
    save_chat_to_dynamodb(session_id, uid, "user",      data.message,  data.language)
    save_chat_to_dynamodb(session_id, uid, "assistant", response_text, data.language)

    # Polly TTS (presigned URL — returns None if not configured)
    audio_url = text_to_speech_polly(
        text=response_text, language=data.language, session_id=session_id
    )

    ai_provider = "rag" if (settings.USE_RAG and rag_citations) else (
        "bedrock" if settings.USE_BEDROCK else "gemini"
    )

    return {
        "session_id":    session_id,
        "response":      response_text,
        "audio_url":     audio_url,
        "language":      data.language,
        "ai_provider":   ai_provider,
        "rag_citations": rag_citations,   # empty list when USE_RAG=false
    }


@router.get("/history/{session_id}")
def get_history(session_id: str, db: Session = Depends(get_db)):
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
