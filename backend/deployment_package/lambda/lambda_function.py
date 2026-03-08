"""
JanSahayak AI — Lambda Gateway Function
========================================
Function name : jansahayak-ai-gateway
Runtime       : Python 3.12
Handler       : lambda_function.lambda_handler

This Lambda receives AI requests from the FastAPI backend,
calls the Gemini API (using urllib stdlib — zero external deps),
and returns the response.

INPUT event schema:
{
    "message":      "user query text",
    "system_prompt": "optional override system prompt",
    "language":     "hi" | "en" | "ta" | ...,
    "chat_history": [ {"role": "user"|"assistant", "content": "..."}, ... ],
    "user_context": {"annual_income": 50000, "state": "Gujarat", "caste_category": "obc"},
    "task":         "chat" | "match_schemes" | "analyze_document"
}

OUTPUT schema (always 200 from Lambda itself; check statusCode field):
{
    "statusCode": 200,
    "response":   "AI generated text",
    "provider":   "gemini-via-lambda",
    "model":      "gemini-2.0-flash",
    "chars":      123
}
On error:
{
    "statusCode": 500,
    "error":      "error message",
    "response":   "Fallback Hindi message for user"
}
"""

import json
import os
import urllib.request
import urllib.error

# ─── Config ──────────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL   = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_URL     = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
)

DEFAULT_SYSTEM_PROMPT = (
    "You are JanSahayak AI, an assistant helping Indian citizens find government "
    "welfare schemes. You have access to 34 government schemes. "
    "Always respond in the same language the user writes in. "
    "Keep responses simple and clear for rural users."
)

FALLBACK_MSG = (
    "Maafi karein, abhi AI service uplabdh nahi hai. "
    "Thodi der baad dobara koshish karein. / "
    "Sorry, AI service is temporarily unavailable. Please try again shortly."
)


# ─── Handler ─────────────────────────────────────────────────────────────────
def lambda_handler(event, context):
    """
    Main Lambda entry point.
    Called by FastAPI backend via boto3 lambda.invoke().
    """
    if not GEMINI_API_KEY:
        return {
            "statusCode": 500,
            "error": "GEMINI_API_KEY not set in Lambda environment variables",
            "response": FALLBACK_MSG,
        }

    message      = (event.get("message") or "").strip()
    system_prompt = event.get("system_prompt") or DEFAULT_SYSTEM_PROMPT
    language     = event.get("language", "en")
    chat_history = event.get("chat_history") or []
    user_context = event.get("user_context") or {}

    if not message:
        return {"statusCode": 400, "error": "Empty message", "response": ""}

    # ── Enrich system prompt with user context ────────────────────────────────
    if user_context:
        income = user_context.get("annual_income")
        state  = user_context.get("state")
        caste  = user_context.get("caste_category")
        ctx_parts = []
        if income: ctx_parts.append(f"Annual Income: ₹{income}")
        if state:  ctx_parts.append(f"State: {state}")
        if caste:  ctx_parts.append(f"Caste Category: {caste}")
        if ctx_parts:
            system_prompt += "\nUser Profile: " + ", ".join(ctx_parts)

    # ── Build Gemini contents array with conversation history ─────────────────
    contents = []
    for h in chat_history[-8:]:   # last 8 messages for context window
        role = "user" if h.get("role") == "user" else "model"
        contents.append({
            "role": role,
            "parts": [{"text": h.get("content", "")}],
        })
    # Append current user message
    contents.append({"role": "user", "parts": [{"text": message}]})

    # ── Build Gemini request payload ──────────────────────────────────────────
    payload = {
        "system_instruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": contents,
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 1024,
            "topP": 0.8,
        },
        "safetySettings": [
            {"category": "HARM_CATEGORY_HARASSMENT",        "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_HATE_SPEECH",       "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"},
        ],
    }

    # ── Call Gemini API via urllib (no external deps) ─────────────────────────
    try:
        body = json.dumps(payload).encode("utf-8")
        req  = urllib.request.Request(
            GEMINI_URL,
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=25) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        # Extract response text
        candidates = data.get("candidates", [])
        if not candidates:
            raise ValueError("No candidates in Gemini response")

        text = candidates[0]["content"]["parts"][0]["text"]

        return {
            "statusCode": 200,
            "response":   text,
            "provider":   "gemini-via-lambda",
            "model":      GEMINI_MODEL,
            "chars":      len(text),
        }

    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="ignore")
        print(f"[Lambda] Gemini HTTP error {e.code}: {err_body[:300]}")
        return {
            "statusCode": 502,
            "error":      f"Gemini HTTP {e.code}: {err_body[:200]}",
            "response":   FALLBACK_MSG,
        }
    except Exception as e:
        print(f"[Lambda] Gemini call failed: {e}")
        return {
            "statusCode": 500,
            "error":      str(e),
            "response":   FALLBACK_MSG,
        }
