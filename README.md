# JanSahayak AI — जन सहायक

> **Your Voice. Your Language. Your Rights.**
> A voice-first, multilingual AI assistant that connects rural Indian citizens with government welfare schemes they deserve.

---

## Live Demo & Access (Sandbox)

- **WhatsApp AI Assistant**:
  1. Save the number: **+1 415 523 8886**
  2. Send the message: **join well-bell**
  3. Start chatting in Hindi, English, or any regional language!

- **Web Application Portal**:
  [https://main.d1u4xqrv56gw9p.amplifyapp.com](https://main.d1u4xqrv56gw9p.amplifyapp.com)

---

## The Problem

Over **500 million rural Indians** are eligible for government welfare schemes like PM Kisan, Ayushman Bharat, Fasal Bima Yojana, MNREGA, and PM Awas Yojana — yet most never claim them.

**Why?**
- They do not know which schemes they qualify for
- Government portals are English-first and text-heavy
- 76% of rural residents lack basic digital skills
- Complex application processes and document requirements
- Deadlines pass silently with no alerts or reminders

---

## The Solution

**JanSahayak AI** is a voice-first, multilingual WhatsApp and IVR chatbot that:

- Identifies every government scheme a citizen is eligible for — just by listening to them speak
- Guides them step-by-step through the application process in their own language
- Reads and explains government letters and documents via photo
- Locates the nearest government office using GPS
- Files RTI and MNREGA grievances via guided voice flow
- Sends proactive WhatsApp alerts before scheme deadlines close
- Remembers the family profile — no re-entering data ever

**Works on WhatsApp. Works on IVR toll-free calls. Works on 2G. No app download needed. Zero English required.**

---

## Built For

| User | Problem Solved |
|---|---|
| Rural Farmer | Discovers PM Kisan, Fasal Bima, and 12+ other schemes instantly |
| Daily Wage Worker | Guided MNREGA grievance filing in their language |
| Elderly Citizen | Voice-only interaction, no typing or reading needed |
| Rural Woman | Finds women-specific schemes she never knew existed |
| Low-literacy User | Document photo → AI explains it out loud in their language |

---

## Key Features

- **Scheme Eligibility Engine** — Speak your profile, get matched to eligible schemes instantly
- **Step-by-Step Apply Guide** — Voice walkthrough: right document, right office, right form
- **Document Reader** — Photo any govt letter → AI explains it in your language
- **Office Locator** — GPS-linked nearest Jan Seva Kendra, anytime
- **Grievance Helper** — File RTI and MNREGA disputes via simple voice flow
- **Deadline Alerts** — Auto WhatsApp reminders before scheme windows close
- **Family Profile Memory** — Saves your data, never re-enter anything

---

## Tech Stack

### Frontend / Interface
- WhatsApp Business API — primary chat interface
- Twilio IVR — toll-free voice access for feature phones
- React.js — admin dashboard
- Tailwind CSS — dashboard styling

### Backend / Server
- AWS Lambda — serverless logic and request routing (Python 3.12)
- Amazon API Gateway — unified API entry point
- Amazon RDS (MySQL) — persistent storage for schemes and office locations

### AI / ML Layer
- Anthropic Claude 3 Haiku (via API) — Conversational engine for WhatsApp
- Google Gemini 1.5/2.0 — advanced logic, document analysis & scheme matching
- Amazon Transcribe — speech-to-text in 12+ Indian languages
- Amazon Polly — text-to-speech in regional languages
- Amazon Translate — 22 Indian language translation pipeline

### Database / Storage
- Amazon RDS / Aurora — scheme database, user profiles & session state
- Amazon S3 — scheme documents and knowledge base / deployment artifacts

### Infrastructure
- AWS Amplify — Frontend hosting & CI/CD
- GitHub / AWS S3 — Code versioning and artifact management
- Amazon CloudWatch — monitoring and logging

---

## System Architecture

```
User (Voice / WhatsApp)
        ↓
Amazon API Gateway
        ↓
AWS Lambda (Python Request Router)
        ↓
┌───────────────────────────────────────┐
│           AI CORE                     │
│  Claude 3 (Chat) / Gemini (Logic)     │
│  (NLP)           (Document/Match)     │
│                    ↓                  │
│           Amazon Polly (TTS/Voice)    │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│        KNOWLEDGE LAYER                │
│  RDS (Scheme/Office DB)               │
│  S3 (Document Storage)                │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│        EXTERNAL INTEGRATIONS          │
│  Twilio WhatsApp | RDS SQL            │
└───────────────────────────────────────┘
        ↓
Response delivered via WhatsApp / IVR
```

---

## How It Works

**Step 1** — User sends a WhatsApp voice note (or text) or calls the IVR number in their language.

**Step 2** — Backend processes the request using Claude 3 Haiku for rapid conversational context.

**Step 3** — If location/schemes are requested, the system queries the live RDS database (optimized for Gujarat centers and Central schemes).

**Step 4** — AI Gemini performs intelligent matching if complex eligibility verification is needed.

**Step 5** — Response is formatted with a signature link back to the live Web Portal.

**Step 6** — User receives step-by-step guidance, scheme list, or document explanation instantly.

---

## Impact

| Metric | Number |
|---|---|
| Target Users | 600 million+ rural Indians |
| Indian Languages Supported | 22 |
| Government Schemes Covered | 800+ central & state schemes |
| Network Requirement | Works on 2G |
| App Download Required | None |
| Cost to Citizen | Free |

---

## Hackathon Submission

- **Event**: Amazon AI for Bharat Hackathon 2025
- **Problem Statement**: PS03 — AI for Communities, Access & Public Impact
- **Team Name**: HackOps7
- **Team Leader**: Parth Hindiya

---

## License

This project was built for the Amazon AI for Bharat Hackathon 2025. All rights reserved by Team HackOps7.
