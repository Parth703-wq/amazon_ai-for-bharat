"""
AWS Services Integration for JanSahayak AI
==========================================
Services used:
  - Amazon Bedrock  : Foundation model (Claude 3 Sonnet) for AI chat, scheme matching, document analysis
  - Amazon S3       : Document storage (Aadhaar, income certs, etc.)
  - Amazon DynamoDB : Chat session history (low-latency key-value)
"""

import json
import boto3
import os
from botocore.exceptions import ClientError, NoCredentialsError
from config import settings
from typing import Optional

# ─── Bedrock client ──────────────────────────────────────────────────────────
def get_bedrock_client():
    return boto3.client(
        "bedrock-runtime",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )

# ─── S3 client ───────────────────────────────────────────────────────────────
def get_s3_client():
    return boto3.client(
        "s3",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )

# ─── DynamoDB resource ───────────────────────────────────────────────────────
def get_dynamodb():
    return boto3.resource(
        "dynamodb",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )


SYSTEM_PROMPT = """You are JanSahayak AI — an expert, compassionate assistant helping Indian citizens 
discover and apply for government welfare schemes.

Guidelines:
- Always respond in the user's preferred language (Hindi, English, Bengali, Tamil, etc.)
- Use simple, clear language suitable for rural and semi-literate users
- Be encouraging and empathetic — many users face genuine hardship
- Focus on actionable Indian government schemes: PM Kisan, PMJAY, PM Awas, MGNREGA, scholarships, pensions
- When matching schemes, clearly explain eligibility and match percentage
- For documents, extract and explain key fields like income, name, validity dates
- Provide step-by-step application guidance
- Keep responses concise — under 300 words unless detailed guidance is needed
"""


async def bedrock_chat(
    user_message: str,
    language: str = "en",
    user_context: Optional[dict] = None,
) -> str:
    """
    Invoke Amazon Bedrock (Claude 3 Sonnet) for AI-powered scheme guidance.
    Falls back to Gemini if Bedrock credentials not configured.
    """
    if not settings.AWS_ACCESS_KEY_ID or settings.AWS_ACCESS_KEY_ID == "YOUR_AWS_ACCESS_KEY":
        # Fallback to Gemini
        from gemini_service import chat_with_gemini
        return await chat_with_gemini(user_message, language, user_context)

    try:
        client = get_bedrock_client()

        context_str = ""
        if user_context:
            context_str = f"\nUser Profile: Income ₹{user_context.get('annual_income','?')}, State: {user_context.get('state','?')}"

        lang_note = "Respond in Hindi." if language == "hi" else "Respond in English."

        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1024,
            "system": SYSTEM_PROMPT + context_str + "\n" + lang_note,
            "messages": [
                {"role": "user", "content": user_message}
            ],
        })

        response = client.invoke_model(
            modelId="anthropic.claude-3-sonnet-20240229-v1:0",
            body=body,
            contentType="application/json",
            accept="application/json",
        )

        result = json.loads(response["body"].read())
        return result["content"][0]["text"]

    except (NoCredentialsError, ClientError) as e:
        # Fallback to Gemini on AWS errors
        from gemini_service import chat_with_gemini
        return await chat_with_gemini(user_message, language, user_context)
    except Exception as e:
        return f"AI service temporarily unavailable. Please try again. ({str(e)[:80]})"


async def bedrock_analyze_document(document_text: str, document_type: str = "unknown") -> dict:
    """
    Use Amazon Bedrock (Claude 3) to extract structured data from Indian government documents.
    Falls back to Gemini if not configured.
    """
    if not settings.AWS_ACCESS_KEY_ID or settings.AWS_ACCESS_KEY_ID == "YOUR_AWS_ACCESS_KEY":
        from gemini_service import analyze_document_with_gemini
        return await analyze_document_with_gemini(document_text, document_type)

    try:
        client = get_bedrock_client()

        prompt = f"""Analyze this Indian government document and extract key information.

Document Type: {document_type}
Content: {document_text[:3000]}

Return ONLY valid JSON with this exact structure:
{{
  "document_type": "detected type",
  "holder_name": "person name",
  "key_fields": {{"field": "value"}},
  "validity": "valid/expired/unknown",
  "important_dates": {{"issue_date": "date"}},
  "summary_simple": "Simple 2-3 sentence explanation",
  "eligible_schemes": ["scheme1", "scheme2"],
  "warnings": ["any warnings"]
}}"""

        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1024,
            "messages": [{"role": "user", "content": prompt}],
        })

        response = client.invoke_model(
            modelId="anthropic.claude-3-sonnet-20240229-v1:0",
            body=body,
            contentType="application/json",
            accept="application/json",
        )
        result = json.loads(response["body"].read())
        text = result["content"][0]["text"].strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text)

    except Exception:
        from gemini_service import analyze_document_with_gemini
        return await analyze_document_with_gemini(document_text, document_type)


async def bedrock_match_schemes(user_profile: dict, schemes: list) -> list:
    """
    Use Amazon Bedrock RAG-style prompt to match schemes to a user profile.
    """
    if not settings.AWS_ACCESS_KEY_ID or settings.AWS_ACCESS_KEY_ID == "YOUR_AWS_ACCESS_KEY":
        from gemini_service import match_schemes_with_gemini
        return await match_schemes_with_gemini(user_profile, schemes)

    try:
        client = get_bedrock_client()
        scheme_list = "\n".join([
            f"- {s['name']}: {s.get('description_simple','')} (Max Income: Rs.{s.get('max_income','any')})"
            for s in schemes[:15]
        ])

        prompt = f"""Match top 5 government schemes for this citizen:

Profile:
- Annual Income: Rs.{user_profile.get('annual_income','unknown')}
- State: {user_profile.get('state','unknown')}
- Land: {user_profile.get('land_holdings_hectares','unknown')} hectares
- Caste: {user_profile.get('caste_category','unknown')}

Available Schemes:
{scheme_list}

Return ONLY a JSON array:
[{{"scheme_name":"name","match_percentage":95,"key_reason":"why eligible","action_required":"next step"}}]"""

        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1024,
            "messages": [{"role": "user", "content": prompt}],
        })

        response = client.invoke_model(
            modelId="anthropic.claude-3-sonnet-20240229-v1:0",
            body=body,
            contentType="application/json",
            accept="application/json",
        )
        result = json.loads(response["body"].read())
        text = result["content"][0]["text"].strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text)

    except Exception:
        from gemini_service import match_schemes_with_gemini
        return await match_schemes_with_gemini(user_profile, schemes)


# ─── S3 Document Storage ─────────────────────────────────────────────────────

def upload_to_s3(file_bytes: bytes, filename: str, user_id: int, content_type: str = "application/octet-stream") -> str:
    """Upload a document to S3 and return the S3 key."""
    if not settings.AWS_S3_BUCKET or settings.AWS_S3_BUCKET == "your-bucket-name":
        return f"local://{filename}"  # fallback to local

    try:
        s3 = get_s3_client()
        key = f"documents/user_{user_id}/{filename}"
        s3.put_object(
            Bucket=settings.AWS_S3_BUCKET,
            Key=key,
            Body=file_bytes,
            ContentType=content_type,
            ServerSideEncryption="AES256",  # Encrypt at rest
            Metadata={"user_id": str(user_id)},
        )
        return f"s3://{settings.AWS_S3_BUCKET}/{key}"
    except Exception as e:
        print(f"S3 upload failed: {e}, using local storage")
        return f"local://{filename}"


def get_s3_presigned_url(s3_key: str, expires_in: int = 3600) -> str:
    """Generate a presigned URL for secure temporary document access."""
    if not s3_key.startswith("s3://"):
        return s3_key
    try:
        s3 = get_s3_client()
        bucket, key = s3_key.replace("s3://", "").split("/", 1)
        url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=expires_in,
        )
        return url
    except Exception:
        return s3_key


def delete_from_s3(s3_key: str) -> bool:
    """Delete a document from S3."""
    if not s3_key.startswith("s3://"):
        return False
    try:
        s3 = get_s3_client()
        bucket, key = s3_key.replace("s3://", "").split("/", 1)
        s3.delete_object(Bucket=bucket, Key=key)
        return True
    except Exception:
        return False


# ─── DynamoDB Chat Sessions ──────────────────────────────────────────────────

DYNAMO_TABLE = "jansahayak_chat_sessions"


def save_chat_to_dynamodb(session_id: str, user_id: Optional[int], role: str, content: str, language: str = "en"):
    """Save chat message to DynamoDB for fast retrieval."""
    if not settings.AWS_ACCESS_KEY_ID or settings.AWS_ACCESS_KEY_ID == "YOUR_AWS_ACCESS_KEY":
        return  # Skip if no AWS creds

    try:
        import time
        dynamodb = get_dynamodb()
        table = dynamodb.Table(DYNAMO_TABLE)
        table.put_item(Item={
            "session_id": session_id,
            "timestamp": str(int(time.time() * 1000)),
            "user_id": str(user_id) if user_id else "anonymous",
            "role": role,
            "content": content,
            "language": language,
        })
    except Exception:
        pass  # DynamoDB optional — MySQL is primary


def get_chat_from_dynamodb(session_id: str, limit: int = 10) -> list:
    """Retrieve recent chat messages from DynamoDB."""
    if not settings.AWS_ACCESS_KEY_ID or settings.AWS_ACCESS_KEY_ID == "YOUR_AWS_ACCESS_KEY":
        return []

    try:
        from boto3.dynamodb.conditions import Key
        dynamodb = get_dynamodb()
        table = dynamodb.Table(DYNAMO_TABLE)
        response = table.query(
            KeyConditionExpression=Key("session_id").eq(session_id),
            ScanIndexForward=False,
            Limit=limit,
        )
        items = response.get("Items", [])
        return [{"role": i["role"], "content": i["content"]} for i in reversed(items)]
    except Exception:
        return []


# ─── Amazon Polly — Text to Speech ───────────────────────────────────────────

# Map language codes to Polly voice IDs
POLLY_VOICES = {
    "hi": ("Aditi", "hi-IN"),       # Hindi female
    "en": ("Kajal", "en-IN"),       # Indian English female
    "ta": ("Aditi", "hi-IN"),       # Tamil fallback → Hindi
    "bn": ("Aditi", "hi-IN"),       # Bengali fallback → Hindi
    "te": ("Aditi", "hi-IN"),       # Telugu fallback → Hindi
    "mr": ("Aditi", "hi-IN"),       # Marathi fallback → Hindi
    "gu": ("Aditi", "hi-IN"),       # Gujarati fallback → Hindi
    "kn": ("Aditi", "hi-IN"),       # Kannada fallback → Hindi
    "ml": ("Aditi", "hi-IN"),       # Malayalam fallback → Hindi
    "pa": ("Aditi", "hi-IN"),       # Punjabi fallback → Hindi
}


def text_to_speech_polly(text: str, language: str = "hi", session_id: str = "") -> Optional[str]:
    """
    Convert text to speech using Amazon Polly (Hindi/regional Indian voices).
    Uploads the MP3 to S3 and returns a presigned URL valid for 1 hour.
    Returns None if Polly or S3 is not configured.
    """
    if not settings.AWS_ACCESS_KEY_ID or settings.AWS_ACCESS_KEY_ID == "YOUR_AWS_ACCESS_KEY":
        return None
    if not settings.AWS_S3_BUCKET or settings.AWS_S3_BUCKET == "your-bucket-name":
        return None

    try:
        polly = boto3.client(
            "polly",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )

        voice_id, lang_code = POLLY_VOICES.get(language, ("Aditi", "hi-IN"))

        # Polly max input is 3000 chars — trim if needed
        safe_text = text[:2800] if len(text) > 2800 else text

        response = polly.synthesize_speech(
            Text=safe_text,
            OutputFormat="mp3",
            VoiceId=voice_id,
            LanguageCode=lang_code,
            Engine="standard",
        )

        mp3_bytes = response["AudioStream"].read()

        # Upload MP3 to S3
        import time
        s3 = get_s3_client()
        key = f"audio/{session_id or 'anon'}_{int(time.time())}.mp3"
        s3.put_object(
            Bucket=settings.AWS_S3_BUCKET,
            Key=key,
            Body=mp3_bytes,
            ContentType="audio/mpeg",
        )

        # Return 1-hour presigned URL
        url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.AWS_S3_BUCKET, "Key": key},
            ExpiresIn=3600,
        )
        return url

    except Exception as e:
        print(f"Polly TTS error: {e}")
        return None
