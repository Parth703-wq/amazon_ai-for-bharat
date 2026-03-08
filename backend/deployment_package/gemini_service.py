import google.generativeai as genai
from config import settings
from typing import Optional

genai.configure(api_key=settings.GEMINI_API_KEY)

model = genai.GenerativeModel("gemini-1.5-flash")

SYSTEM_PROMPT = """You are JanSahayak AI — an expert, compassionate assistant helping Indian citizens 
discover and apply for government welfare schemes. 

Guidelines:
- Always respond in the user's preferred language (Hindi, English, Bengali, Tamil, etc.)
- Use simple, clear language suitable for rural and semi-literate users
- Be encouraging and empathetic — many users face genuine hardship
- Focus on actionable Indian government schemes: PM Kisan, PMJAY, PM Awas, MGNREGA, scholarships, pensions
- When matching schemes, give match percentage and clearly explain eligibility
- For documents, extract and explain key fields like income, name, validity dates
- Provide step-by-step application guidance
- Always mention that information is for educational purposes and users should verify at official portals
- Keep responses concise — under 300 words unless detailed guidance is needed
"""


async def chat_with_gemini(
    user_message: str,
    language: str = "en",
    user_context: Optional[dict] = None,
    chat_history: Optional[list] = None,
) -> str:
    """Send a message to Gemini and get AI response for scheme guidance."""
    
    context_str = ""
    if user_context:
        income = user_context.get("annual_income", "unknown")
        state = user_context.get("state", "unknown")
        context_str = f"\nUser Profile: Annual Income ₹{income}, State: {state}, Language: {language}"
    
    lang_instruction = f"\nRespond in {'Hindi' if language == 'hi' else 'English'} language."
    
    full_prompt = SYSTEM_PROMPT + context_str + lang_instruction + f"\n\nUser Query: {user_message}"
    
    try:
        response = model.generate_content(full_prompt)
        return response.text
    except Exception as e:
        return f"I apologize, I'm experiencing technical difficulties. Please try again. Error: {str(e)}"


async def analyze_document_with_gemini(
    document_text: str,
    document_type: str = "unknown",
    language: str = "en",
) -> dict:
    """Use Gemini to extract and explain key information from document text."""
    
    prompt = f"""Analyze this Indian government document and extract key information.

Document Type: {document_type}
Document Content:
{document_text}

Please extract and return in JSON format:
{{
  "document_type": "detected document type",
  "holder_name": "person's name",
  "key_fields": {{"field_name": "value"}},
  "validity": "valid/expired/unknown",
  "important_dates": {{"issue_date": "date", "expiry_date": "date if applicable"}},
  "summary_simple": "Simple explanation in 2-3 sentences that even a 5th grader can understand",
  "eligible_schemes": ["list of 2-3 government schemes this document might help apply for"],
  "warnings": ["any important warnings or things to note"]
}}

Respond ONLY with valid JSON, no markdown formatting."""

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        # Clean up markdown code blocks if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        import json
        return json.loads(text)
    except Exception as e:
        return {
            "document_type": document_type,
            "holder_name": "Could not extract",
            "key_fields": {},
            "validity": "unknown",
            "important_dates": {},
            "summary_simple": "Document analysis failed. Please try again.",
            "eligible_schemes": [],
            "warnings": [f"Analysis error: {str(e)}"],
        }


async def match_schemes_with_gemini(user_profile: dict, schemes: list) -> list:
    """Use Gemini to intelligently match schemes to a user profile."""
    
    scheme_list = "\n".join([
        f"- {s['name']}: {s.get('description_simple', '')} (Category: {s['category']}, Max Income: ₹{s.get('max_income', 'no limit')})"
        for s in schemes[:20]  # Limit to 20 schemes per call
    ])
    
    prompt = f"""Given this citizen's profile and list of government schemes, match the top 5 most relevant schemes.

Citizen Profile:
- Annual Income: ₹{user_profile.get('annual_income', 'unknown')}
- State: {user_profile.get('state', 'unknown')}
- Land Holdings: {user_profile.get('land_holdings_hectares', 'unknown')} hectares
- Caste Category: {user_profile.get('caste_category', 'unknown')}

Available Schemes:
{scheme_list}

Return a JSON array with top 5 matches:
[
  {{
    "scheme_name": "name",
    "match_percentage": 95,
    "key_reason": "Why this person qualifies",
    "action_required": "What they need to do next"
  }}
]

Respond ONLY with valid JSON array."""

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        import json
        return json.loads(text)
    except Exception:
        return []
