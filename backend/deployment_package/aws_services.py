"""
AWS Services Integration for JanSahayak AI
==========================================
Services used:
  - Amazon Bedrock  : Foundation model (Claude 3 Sonnet) for AI chat, scheme matching, document analysis
  - Amazon S3       : Document storage (Aadhaar, income certs, etc.)
  - Amazon DynamoDB : Chat session history (low-latency key-value, TTL=30 days)
  - Amazon Polly    : Text-to-speech in Indian regional languages (neural engine)
  - Amazon Textract : OCR extraction from uploaded government documents
"""

import json
import logging
import time
import boto3
import os
from botocore.exceptions import ClientError, NoCredentialsError
from config import settings
from typing import Optional

# ─── CloudWatch / Python logger ──────────────────────────────────────────────
logger = logging.getLogger("jansahayak")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

# ─── Feature flag helpers ─────────────────────────────────────────────────────
def _use_bedrock() -> bool:
    """Return True if Bedrock should be used as primary AI (USE_BEDROCK=true in .env)."""
    return settings.USE_BEDROCK and bool(settings.AWS_ACCESS_KEY_ID) and settings.AWS_ACCESS_KEY_ID != "YOUR_AWS_ACCESS_KEY"


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
# ─── Lambda client ──────────────────────────────────────────────────────────
def get_lambda_client():
    return boto3.client(
        "lambda",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Lambda AI Gateway — routes Gemini calls through AWS Lambda
# ─────────────────────────────────────────────────────────────────────────────

async def lambda_invoke_gemini(
    user_message: str,
    language: str = "en",
    user_context: Optional[dict] = None,
    chat_history: Optional[list] = None,
    system_prompt: Optional[str] = None,
) -> str:
    """
    Call Gemini AI via the jansahayak-ai-gateway AWS Lambda function.
    This routes ALL Gemini calls through AWS Lambda — making it a proper
    AWS GenAI architecture instead of calling Gemini directly.

    Flow: bedrock_chat() → [Bedrock fails] → lambda_invoke_gemini()
                        → [Lambda fails]  → chat_with_gemini() direct

    Returns AI response text.
    Raises RuntimeError if Lambda is not configured or call fails.
    """
    fn_name = settings.LAMBDA_FUNCTION_NAME
    if not fn_name:
        raise RuntimeError("LAMBDA_FUNCTION_NAME not set in .env")

    if not settings.AWS_ACCESS_KEY_ID or settings.AWS_ACCESS_KEY_ID == "YOUR_AWS_ACCESS_KEY":
        raise RuntimeError("No AWS credentials — cannot invoke Lambda")

    payload = {
        "message":       user_message,
        "language":      language,
        "chat_history":  chat_history or [],
        "user_context":  user_context or {},
        "system_prompt": system_prompt or BEDROCK_SYSTEM_PROMPT,
        "task":          "chat",
    }

    try:
        lam = get_lambda_client()
        resp = lam.invoke(
            FunctionName=fn_name,
            InvocationType="RequestResponse",          # synchronous
            Payload=json.dumps(payload).encode("utf-8"),
        )

        result = json.loads(resp["Payload"].read())

        if result.get("statusCode") == 200:
            text = result.get("response", "")
            logger.info(
                "[Lambda] Response via %s | chars=%d | model=%s",
                fn_name, len(text), result.get("model", "?")
            )
            return text
        else:
            err = result.get("error", "Unknown Lambda error")
            logger.warning("[Lambda] Non-200 from Lambda: %s", err)
            raise RuntimeError(f"Lambda error: {err}")

    except ClientError as e:
        logger.warning("[Lambda] AWS ClientError: %s", str(e))
        raise RuntimeError(f"Lambda invoke failed: {e}")
    except Exception as e:
        logger.error("[Lambda] Unexpected error: %s", str(e))
        raise




# ─────────────────────────────────────────────────────────────────────────────
# PART 1 — Amazon Bedrock AI Functions (USE_BEDROCK feature flag)
# ─────────────────────────────────────────────────────────────────────────────

BEDROCK_SYSTEM_PROMPT = (
    "You are JanSahayak AI, an assistant helping Indian citizens find government welfare schemes. "
    "You have access to 34 government schemes. "
    "Always respond in the same language the user writes in. "
    "Keep responses simple and clear for rural users."
)


BEDROCK_MODEL_ID = "anthropic.claude-3-sonnet-20240229-v1:0"


async def bedrock_chat(
    user_message: str,
    language: str = "en",
    user_context: Optional[dict] = None,
    chat_history: Optional[list] = None,
) -> str:
    """
    Invoke Amazon Bedrock (Claude 3 Sonnet) for AI-powered scheme guidance.
    USE_BEDROCK flag: if true, use Bedrock; else fall back to Gemini.
    chat_history: list of {role, content} from DynamoDB for conversation context.
    """
    if not _use_bedrock():
        logger.info("[AI] USE_BEDROCK=false — routing to Lambda gateway")
        try:
            return await lambda_invoke_gemini(user_message, language, user_context, chat_history)
        except Exception as e:
            logger.warning("[Lambda] Gateway unavailable, direct Gemini fallback: %s", e)
            from gemini_service import chat_with_gemini
            return await chat_with_gemini(user_message, language, user_context, chat_history)

    try:
        client = get_bedrock_client()

        context_str = ""
        if user_context:
            context_str = (
                f"\nUser Profile: Income ₹{user_context.get('annual_income', '?')}, "
                f"State: {user_context.get('state', '?')}"
            )
        system = BEDROCK_SYSTEM_PROMPT + context_str

        # Build messages array with conversation history for context
        messages = []
        if chat_history:
            for h in chat_history[-10:]:  # last 10 messages
                messages.append({"role": h["role"], "content": h["content"]})
        messages.append({"role": "user", "content": user_message})

        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1024,
            "system": system,
            "messages": messages,
        })

        logger.info("[Bedrock] Calling Claude 3 Sonnet | lang=%s", language)
        response = client.invoke_model(
            modelId=BEDROCK_MODEL_ID,
            body=body,
            contentType="application/json",
            accept="application/json",
        )

        result = json.loads(response["body"].read())
        reply = result["content"][0]["text"]
        logger.info("[Bedrock] Response received | chars=%d", len(reply))
        return reply

    except (NoCredentialsError, ClientError) as e:
        logger.warning("[Bedrock] AWS error — routing to Lambda gateway: %s", str(e))
        try:
            return await lambda_invoke_gemini(user_message, language, user_context, chat_history)
        except Exception as le:
            logger.warning("[Lambda] Failed too — falling back to direct Gemini: %s", str(le))
            from gemini_service import chat_with_gemini
            return await chat_with_gemini(user_message, language, user_context, chat_history)
    except Exception as e:
        logger.error("[Bedrock] Unexpected error: %s", str(e))
        try:
            return await lambda_invoke_gemini(user_message, language, user_context, chat_history)
        except Exception as le:
            logger.warning("[Lambda] Failed too — falling back to direct Gemini: %s", str(le))
            try:
                from gemini_service import chat_with_gemini
                return await chat_with_gemini(user_message, language, user_context, chat_history)
            except Exception:
                return f"AI service temporarily unavailable. Please try again. ({str(e)[:80]})"


async def bedrock_analyze_document(document_text: str, document_type: str = "unknown") -> dict:
    """
    Use Amazon Bedrock (Claude 3) to extract structured data from Indian government documents.
    USE_BEDROCK flag: if false, route to Gemini.
    """
    if not _use_bedrock():
        logger.info("[AI] Document analysis routed to Gemini (USE_BEDROCK=false)")
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

        logger.info("[Bedrock] Document analysis | type=%s", document_type)
        response = client.invoke_model(
            modelId=BEDROCK_MODEL_ID,
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

    except Exception as e:
        logger.warning("[Bedrock] Document analysis failed — falling back to Gemini: %s", str(e))
        from gemini_service import analyze_document_with_gemini
        return await analyze_document_with_gemini(document_text, document_type)


async def bedrock_match_schemes(user_profile: dict, schemes: list) -> list:
    """
    Use Amazon Bedrock RAG-style prompt to match schemes to a user profile.
    USE_BEDROCK flag: if false, route to Gemini.
    """
    if not _use_bedrock():
        logger.info("[AI] Scheme matching routed to Gemini (USE_BEDROCK=false)")
        from gemini_service import match_schemes_with_gemini
        return await match_schemes_with_gemini(user_profile, schemes)

    try:
        client = get_bedrock_client()
        scheme_list = "\n".join([
            f"- {s['name']}: {s.get('description_simple', '')} (Max Income: Rs.{s.get('max_income', 'any')})"
            for s in schemes[:15]
        ])

        prompt = f"""Match top 5 government schemes for this citizen:

Profile:
- Annual Income: Rs.{user_profile.get('annual_income', 'unknown')}
- State: {user_profile.get('state', 'unknown')}
- Land: {user_profile.get('land_holdings_hectares', 'unknown')} hectares
- Caste: {user_profile.get('caste_category', 'unknown')}

Available Schemes:
{scheme_list}

Return ONLY a JSON array:
[{{"scheme_name":"name","match_percentage":95,"key_reason":"why eligible","action_required":"next step"}}]"""

        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1024,
            "messages": [{"role": "user", "content": prompt}],
        })

        logger.info("[Bedrock] Scheme matching for user in %s", user_profile.get("state", "?"))
        response = client.invoke_model(
            modelId=BEDROCK_MODEL_ID,
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

    except Exception as e:
        logger.warning("[Bedrock] Scheme matching failed — falling back to Gemini: %s", str(e))
        from gemini_service import match_schemes_with_gemini
        return await match_schemes_with_gemini(user_profile, schemes)


# ─────────────────────────────────────────────────────────────────────────────
# PART 2 — Amazon DynamoDB Chat Session Storage
# Table: jansahayak-chat-sessions
# PK: session_id (String), SK: timestamp (Number), TTL: expires_at (30 days)
# ─────────────────────────────────────────────────────────────────────────────

DYNAMO_TABLE = "jansahayak-chat-sessions"
CHAT_TTL_SECONDS = 30 * 24 * 60 * 60  # 30 days


def save_chat_to_dynamodb(
    session_id: str,
    user_id: Optional[int],
    role: str,
    content: str,
    language: str = "en",
):
    """Save chat message to DynamoDB with 30-day TTL for automatic expiry."""
    if not settings.AWS_ACCESS_KEY_ID or settings.AWS_ACCESS_KEY_ID == "YOUR_AWS_ACCESS_KEY":
        return  # Skip if no AWS creds

    try:
        now = int(time.time() * 1000)
        expires_at = int(time.time()) + CHAT_TTL_SECONDS  # Unix epoch for TTL

        dynamodb = get_dynamodb()
        table = dynamodb.Table(DYNAMO_TABLE)
        table.put_item(Item={
            "session_id": session_id,
            "timestamp": now,
            "expires_at": expires_at,  # DynamoDB TTL attribute (30 days)
            "user_id": str(user_id) if user_id else "anonymous",
            "role": role,
            "content": content,
            "language": language,
        })
        logger.debug("[DynamoDB] Saved %s message | session=%s", role, session_id[:8])
    except Exception as e:
        logger.warning("[DynamoDB] Save failed (non-fatal): %s", str(e))


def get_chat_from_dynamodb(session_id: str, limit: int = 10) -> list:
    """Retrieve last N chat messages from DynamoDB for conversation context."""
    if not settings.AWS_ACCESS_KEY_ID or settings.AWS_ACCESS_KEY_ID == "YOUR_AWS_ACCESS_KEY":
        return []

    try:
        from boto3.dynamodb.conditions import Key
        dynamodb = get_dynamodb()
        table = dynamodb.Table(DYNAMO_TABLE)
        response = table.query(
            KeyConditionExpression=Key("session_id").eq(session_id),
            ScanIndexForward=False,   # newest first
            Limit=limit,
        )
        items = response.get("Items", [])
        # Return in chronological order for AI context
        return [{"role": i["role"], "content": i["content"]} for i in reversed(items)]
    except Exception as e:
        logger.warning("[DynamoDB] Fetch failed (non-fatal): %s", str(e))
        return []


# ─────────────────────────────────────────────────────────────────────────────
# PART 4 — Amazon S3 Document Storage (enhanced)
# ─────────────────────────────────────────────────────────────────────────────

def _get_bucket() -> str:
    """Return S3 bucket name from env (supports both AWS_S3_BUCKET and AWS_S3_BUCKET_NAME)."""
    bucket = settings.AWS_S3_BUCKET_NAME or settings.AWS_S3_BUCKET
    return bucket


def upload_document(
    file_bytes: bytes,
    filename: str,
    user_id: int,
    content_type: str = "application/octet-stream",
) -> str:
    """
    Upload a document to S3 with AES256 server-side encryption.
    Logs every upload with timestamp and file size to CloudWatch via Python logging.
    Returns S3 URI or local:// fallback.
    """
    bucket = _get_bucket()
    if not bucket or bucket in ("your-bucket-name", ""):
        logger.info("[S3] No bucket configured — using local storage")
        return f"local://{filename}"

    try:
        s3 = get_s3_client()
        key = f"documents/user_{user_id}/{filename}"
        file_size_kb = len(file_bytes) // 1024

        s3.put_object(
            Bucket=bucket,
            Key=key,
            Body=file_bytes,
            ContentType=content_type,
            ServerSideEncryption="AES256",  # AES256 encryption at rest
            Metadata={"user_id": str(user_id), "original_name": filename},
        )

        # CloudWatch log via Python logging (automatically picked up when running on Lambda)
        logger.info(
            "[S3] Upload success | bucket=%s | key=%s | size_kb=%d | user_id=%d | ts=%d",
            bucket, key, file_size_kb, user_id, int(time.time()),
        )

        return f"s3://{bucket}/{key}"

    except Exception as e:
        logger.error("[S3] Upload failed | file=%s | error=%s", filename, str(e))
        return f"local://{filename}"


# Keep backward-compatible alias
def upload_to_s3(file_bytes: bytes, filename: str, user_id: int, content_type: str = "application/octet-stream") -> str:
    return upload_document(file_bytes, filename, user_id, content_type)


def generate_presigned_url(s3_key: str, expires_in: int = 3600) -> str:
    """Generate a presigned URL valid for 1 hour (3600s by default)."""
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
        logger.debug("[S3] Presigned URL generated | key=%s | expires=%ds", key, expires_in)
        return url
    except Exception as e:
        logger.warning("[S3] Presigned URL failed: %s", str(e))
        return s3_key


# Backward-compatible alias
def get_s3_presigned_url(s3_key: str, expires_in: int = 3600) -> str:
    return generate_presigned_url(s3_key, expires_in)


def delete_document(s3_key: str) -> bool:
    """Delete a document from S3 (called after 24 hours or on user request)."""
    if not s3_key.startswith("s3://"):
        return False
    try:
        s3 = get_s3_client()
        bucket, key = s3_key.replace("s3://", "").split("/", 1)
        s3.delete_object(Bucket=bucket, Key=key)
        logger.info("[S3] Deleted | key=%s", key)
        return True
    except Exception as e:
        logger.warning("[S3] Delete failed: %s", str(e))
        return False


# Backward-compatible alias
def delete_from_s3(s3_key: str) -> bool:
    return delete_document(s3_key)


def setup_s3_lifecycle_policy() -> bool:
    """
    Set up S3 lifecycle policy to auto-delete objects in documents/ prefix after 1 day.
    Called once at app startup. Safe to call repeatedly — idempotent.
    """
    bucket = _get_bucket()
    if not bucket or bucket in ("your-bucket-name", ""):
        return False

    try:
        s3 = get_s3_client()
        s3.put_bucket_lifecycle_configuration(
            Bucket=bucket,
            LifecycleConfiguration={
                "Rules": [
                    {
                        "ID": "jansahayak-auto-delete-documents",
                        "Filter": {"Prefix": "documents/"},
                        "Status": "Enabled",
                        "Expiration": {"Days": 1},
                    },
                    {
                        "ID": "jansahayak-auto-delete-audio",
                        "Filter": {"Prefix": "audio/"},
                        "Status": "Enabled",
                        "Expiration": {"Days": 1},
                    },
                ]
            },
        )
        logger.info("[S3] Lifecycle policy configured | bucket=%s | documents/ expires in 1 day", bucket)
        return True
    except Exception as e:
        logger.warning("[S3] Lifecycle policy setup failed (non-fatal): %s", str(e))
        return False


# ─── Amazon Polly — Text to Speech ───────────────────────────────────────────

POLLY_VOICES = {
    "hi": ("Aditi",  "hi-IN"),
    "en": ("Kajal",  "en-IN"),
    "ta": ("Aditi",  "hi-IN"),
    "bn": ("Aditi",  "hi-IN"),
    "te": ("Aditi",  "hi-IN"),
    "mr": ("Aditi",  "hi-IN"),
    "gu": ("Aditi",  "hi-IN"),
    "kn": ("Aditi",  "hi-IN"),
    "ml": ("Aditi",  "hi-IN"),
    "pa": ("Aditi",  "hi-IN"),
}


def text_to_speech_polly(text: str, language: str = "hi", session_id: str = "") -> Optional[str]:
    """
    Convert text to speech using Amazon Polly.
    Uploads the MP3 to S3 and returns a presigned URL valid for 1 hour.
    Returns None if Polly or S3 is not configured.
    """
    bucket = _get_bucket()
    if not settings.AWS_ACCESS_KEY_ID or settings.AWS_ACCESS_KEY_ID == "YOUR_AWS_ACCESS_KEY":
        return None
    if not bucket or bucket in ("your-bucket-name", ""):
        return None

    try:
        polly = boto3.client(
            "polly",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )

        voice_id, lang_code = POLLY_VOICES.get(language, ("Aditi", "hi-IN"))
        safe_text = text[:2800] if len(text) > 2800 else text

        response = polly.synthesize_speech(
            Text=safe_text,
            OutputFormat="mp3",
            VoiceId=voice_id,
            LanguageCode=lang_code,
            Engine="standard",
        )

        mp3_bytes = response["AudioStream"].read()

        s3 = get_s3_client()
        key = f"audio/{session_id or 'anon'}_{int(time.time())}.mp3"
        s3.put_object(
            Bucket=bucket,
            Key=key,
            Body=mp3_bytes,
            ContentType="audio/mpeg",
        )

        url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=3600,
        )
        logger.info("[Polly] TTS generated | lang=%s | chars=%d", language, len(text))
        return url

    except Exception as e:
        logger.error("[Polly] TTS error: %s", str(e))
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Feature 1 — polly_speak: Returns base64-encoded MP3 (no S3 needed)
# ─────────────────────────────────────────────────────────────────────────────

# Voice config: (voice_id, language_code, engine)
# Neural engine used where available; standard fallback for Aditi
POLLY_VOICE_CONFIG: dict[str, tuple[str, str, str]] = {
    "hi": ("Aditi",  "hi-IN",  "standard"),   # Aditi is standard-only
    "en": ("Kajal",  "en-IN",  "neural"),
    "ta": ("Aditi",  "hi-IN",  "standard"),   # Tamil falls back to Hindi Aditi
    "te": ("Aditi",  "hi-IN",  "standard"),   # Telugu fallback
    "bn": ("Aditi",  "hi-IN",  "standard"),   # Bengali fallback
    "mr": ("Aditi",  "hi-IN",  "standard"),
    "gu": ("Aditi",  "hi-IN",  "standard"),
    "kn": ("Aditi",  "hi-IN",  "standard"),
    "ml": ("Aditi",  "hi-IN",  "standard"),
    "pa": ("Aditi",  "hi-IN",  "standard"),
}


def polly_speak(text: str, language: str = "hi") -> Optional[str]:
    """
    Convert text to speech using Amazon Polly and return base64-encoded MP3.
    Uses Neural engine for English (Kajal), Standard for Indian-language voices (Aditi).
    Returns base64 string on success, None on failure (fallback to browser TTS).
    """
    import base64
    if not settings.AWS_ACCESS_KEY_ID or settings.AWS_ACCESS_KEY_ID == "YOUR_AWS_ACCESS_KEY":
        logger.info("[Polly] No AWS credentials — skipping polly_speak")
        return None

    voice_id, lang_code, engine = POLLY_VOICE_CONFIG.get(
        language, ("Aditi", "hi-IN", "standard")
    )
    safe_text = text[:2900] if len(text) > 2900 else text

    try:
        polly = boto3.client(
            "polly",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )

        response = polly.synthesize_speech(
            Text=safe_text,
            OutputFormat="mp3",
            VoiceId=voice_id,
            LanguageCode=lang_code,
            Engine=engine,
        )

        mp3_bytes = response["AudioStream"].read()
        b64 = base64.b64encode(mp3_bytes).decode("utf-8")
        logger.info(
            "[Polly] polly_speak | voice=%s | engine=%s | lang=%s | chars=%d | output_kb=%d",
            voice_id, engine, language, len(text), len(mp3_bytes) // 1024,
        )
        return b64

    except Exception as e:
        logger.error("[Polly] polly_speak error: %s", str(e))
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Feature 2 — textract_extract: OCR from S3 document
# ─────────────────────────────────────────────────────────────────────────────

def textract_extract(s3_bucket: str, s3_key: str) -> dict:
    """
    Run Amazon Textract detect_document_text on an S3 object.
    Parses LINE blocks from the response and returns:
      - extracted_text: joined string of all lines
      - lines: list of individual line strings
      - confidence: average confidence score across LINE blocks
    Returns a fallback dict with empty fields if Textract unavailable.
    """
    if not settings.AWS_ACCESS_KEY_ID or settings.AWS_ACCESS_KEY_ID == "YOUR_AWS_ACCESS_KEY":
        logger.info("[Textract] No AWS credentials — skipping OCR")
        return {"extracted_text": "", "lines": [], "confidence": 0.0, "available": False}

    try:
        textract = boto3.client(
            "textract",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )

        response = textract.detect_document_text(
            Document={"S3Object": {"Bucket": s3_bucket, "Name": s3_key}}
        )

        blocks = response.get("Blocks", [])
        line_blocks = [b for b in blocks if b.get("BlockType") == "LINE"]

        lines = [b.get("Text", "") for b in line_blocks]
        confidences = [b.get("Confidence", 0.0) for b in line_blocks]
        avg_confidence = round(sum(confidences) / len(confidences), 2) if confidences else 0.0
        extracted_text = "\n".join(lines)

        logger.info(
            "[Textract] OCR complete | bucket=%s | key=%s | lines=%d | confidence=%.1f%%",
            s3_bucket, s3_key, len(lines), avg_confidence,
        )
        return {
            "extracted_text": extracted_text,
            "lines": lines,
            "confidence": avg_confidence,
            "available": True,
        }

    except Exception as e:
        logger.error("[Textract] OCR error: %s", str(e))
        return {"extracted_text": "", "lines": [], "confidence": 0.0, "available": False}


# ─────────────────────────────────────────────────────────────────────────────
# Amazon SNS — SMS Deadline Alerts
# ─────────────────────────────────────────────────────────────────────────────

def sns_send_sms(phone_number: str, message: str) -> Optional[str]:
    """
    Send an SMS via Amazon SNS to a given phone number.
    phone_number must be in E.164 format, e.g. +919876543210
    Returns SNS MessageId on success, None on failure.
    """
    if not settings.AWS_ACCESS_KEY_ID or settings.AWS_ACCESS_KEY_ID == "YOUR_AWS_ACCESS_KEY":
        logger.info("[SNS] No AWS credentials — skipping SMS to %s", phone_number)
        return None

    try:
        sns = boto3.client(
            "sns",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )

        response = sns.publish(
            PhoneNumber=phone_number,
            Message=message,
            MessageAttributes={
                "AWS.SNS.SMS.SenderID": {
                    "DataType": "String",
                    "StringValue": "JanSahayak",
                },
                "AWS.SNS.SMS.SMSType": {
                    "DataType": "String",
                    "StringValue": "Transactional",  # High priority, low spam likelihood
                },
            },
        )
        msg_id = response.get("MessageId", "")
        logger.info("[SNS] SMS sent | to=%s | msg_id=%s | chars=%d", phone_number, msg_id, len(message))
        return msg_id

    except Exception as e:
        logger.error("[SNS] SMS failed | to=%s | error=%s", phone_number, str(e))
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Gmail SMTP — Email Notifications (replaces Amazon SES)
# ─────────────────────────────────────────────────────────────────────────────

def ses_send_email(to_email: str, subject: str, html_body: str) -> Optional[str]:
    """
    Send an HTML email via Gmail SMTP (smtp.gmail.com:587 TLS).
    Uses GMAIL_USER and GMAIL_APP_PASSWORD from .env.
    Returns a pseudo message-id on success, None on failure.
    Function name kept as ses_send_email so nothing else in the codebase needs changing.

    NOTE: Requires Gmail 2FA enabled + App Password generated at
          https://myaccount.google.com/apppasswords
    """
    import smtplib
    import uuid
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText

    gmail_user = settings.GMAIL_USER
    gmail_pass = settings.GMAIL_APP_PASSWORD

    if not gmail_user or not gmail_pass:
        logger.info("[Gmail] GMAIL_USER or GMAIL_APP_PASSWORD not set — skipping email to %s", to_email)
        return None

    if not to_email or "@" not in to_email:
        logger.warning("[Gmail] Invalid email address: %s", to_email)
        return None

    try:
        # Build MIME message (HTML + plain text fallback)
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = f"JanSahayak AI <{gmail_user}>"
        msg["To"]      = to_email
        msg["Message-ID"] = f"<{uuid.uuid4()}@jansahayak.ai>"

        # Plain-text fallback (subject as text)
        msg.attach(MIMEText(subject, "plain", "utf-8"))
        # HTML body
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        # Connect and send over TLS
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=10) as server:
            server.ehlo()
            server.starttls()          # Upgrade to TLS
            server.ehlo()
            server.login(gmail_user, gmail_pass)
            server.sendmail(gmail_user, to_email, msg.as_string())

        msg_id = msg["Message-ID"]
        logger.info("[Gmail] Email sent | to=%s | subject=%s | msg_id=%s", to_email, subject, msg_id)
        return msg_id

    except smtplib.SMTPAuthenticationError:
        logger.error("[Gmail] Authentication failed — check GMAIL_USER and GMAIL_APP_PASSWORD in .env")
        return None
    except Exception as e:
        logger.error("[Gmail] Email failed | to=%s | error=%s", to_email, str(e))
        return None



# ─────────────────────────────────────────────────────────────────────────────
# Amazon Bedrock Knowledge Base — RAG (Retrieve and Generate)
# ─────────────────────────────────────────────────────────────────────────────

async def bedrock_rag_query(user_question: str, language: str = "en") -> dict:
    """
    Query Bedrock Knowledge Base using retrieve_and_generate (RAG).
    Uses BEDROCK_KNOWLEDGE_BASE_ID from .env.
    Returns: { response: str, citations: list, available: bool }
    Falls back to direct bedrock_chat if RAG fails.

    SETUP: Create Knowledge Base in AWS Console → Bedrock → Knowledge Bases,
    upload scheme PDFs to S3, point KB at the S3 prefix, then copy the KB ID to .env.
    """
    kb_id = settings.BEDROCK_KNOWLEDGE_BASE_ID
    if not kb_id or kb_id == "YOUR_KNOWLEDGE_BASE_ID_HERE":
        logger.info("[RAG] No Knowledge Base ID configured — falling back to direct Bedrock")
        text = await bedrock_chat(user_question, language)
        return {"response": text, "citations": [], "available": False}

    if not settings.AWS_ACCESS_KEY_ID or settings.AWS_ACCESS_KEY_ID == "YOUR_AWS_ACCESS_KEY":
        logger.info("[RAG] No AWS credentials — falling back to direct Bedrock")
        text = await bedrock_chat(user_question, language)
        return {"response": text, "citations": [], "available": False}

    try:
        agent_runtime = boto3.client(
            "bedrock-agent-runtime",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )

        response = agent_runtime.retrieve_and_generate(
            input={"text": user_question},
            retrieveAndGenerateConfiguration={
                "type": "KNOWLEDGE_BASE",
                "knowledgeBaseConfiguration": {
                    "knowledgeBaseId": kb_id,
                    "modelArn": f"arn:aws:bedrock:{settings.AWS_REGION}::foundation-model/{settings.AWS_BEDROCK_MODEL_ID}",
                },
            },
        )

        output_text = response.get("output", {}).get("text", "")
        # Extract source citations (S3 URIs of retrieved documents)
        citations = []
        for citation in response.get("citations", []):
            for ref in citation.get("retrievedReferences", []):
                loc = ref.get("location", {}).get("s3Location", {})
                citations.append(loc.get("uri", ""))

        logger.info(
            "[RAG] retrieve_and_generate | kb=%s | citations=%d | chars=%d",
            kb_id[:8], len(citations), len(output_text),
        )
        return {
            "response": output_text,
            "citations": [c for c in citations if c],
            "available": True,
        }

    except Exception as e:
        logger.error("[RAG] retrieve_and_generate failed — falling back to direct Bedrock: %s", str(e))
        text = await bedrock_chat(user_question, language)
        return {"response": text, "citations": [], "available": False}
