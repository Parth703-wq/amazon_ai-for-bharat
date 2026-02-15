# JanSahayak AI — जन सहायक

> **Your Voice. Your Language. Your Rights.**
> A voice-first, multilingual AI assistant that connects rural Indian citizens with government welfare schemes they deserve.

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
- AWS Lambda — serverless logic and request routing
- Amazon API Gateway — unified API entry point
- Node.js — Lambda runtime
- Python — ML processing scripts

### AI / ML Layer
- Amazon Bedrock (Claude 3 Sonnet) — core LLM, intent detection, response generation
- Amazon Transcribe — speech-to-text in 12+ Indian languages
- Amazon Polly — text-to-speech in regional languages
- Amazon Translate — 22 Indian language translation pipeline
- Amazon Kendra — intelligent scheme document search
- Amazon Textract — reads and extracts text from government letter photos

### Database / Storage
- Amazon DynamoDB — user profiles, scheme database, session state
- Amazon S3 — scheme documents and knowledge base
- Amazon ElastiCache — response caching for fast replies

### Infrastructure
- AWS CloudFormation — infrastructure as code
- Amazon CloudWatch — monitoring and logging
- AWS IAM — security and access management
- Amazon QuickSight — analytics dashboard for government partners
- Amazon EventBridge — scheduled deadline alert triggers

### External APIs
- DigiLocker API — digital document verification
- Aadhaar Verify API (UIDAI) — identity verification
- OLA Maps API — nearest government office locator
- WhatsApp Cloud API (Meta) — message delivery and webhooks

### Security and Compliance
- AWS KMS — encryption key management
- Amazon Cognito — admin authentication
- SSL / TLS — end-to-end encryption
- DPDP Act 2023 compliant — India data privacy law

---

## System Architecture

```
User (Voice / WhatsApp)
        ↓
Amazon API Gateway
        ↓
AWS Lambda (Request Router)
        ↓
┌───────────────────────────────────────┐
│           AI CORE                     │
│  Transcribe → Translate → Bedrock     │
│  (STT)        (Normalize)   (LLM)     │
│                    ↓                  │
│           Amazon Polly (TTS)          │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│        KNOWLEDGE LAYER                │
│  Kendra (Scheme Search)               │
│  DynamoDB (User Profile)              │
│  S3 (Scheme Documents)                │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│        EXTERNAL INTEGRATIONS          │
│  DigiLocker | Aadhaar | OLA Maps      │
└───────────────────────────────────────┘
        ↓
Response delivered via WhatsApp / IVR
```

---

## How It Works

**Step 1** — User sends a WhatsApp voice note or calls the toll-free IVR number in their language

**Step 2** — Amazon Transcribe converts speech to text in their regional language

**Step 3** — Amazon Translate normalizes the text for processing

**Step 4** — Amazon Bedrock (Claude 3 Sonnet) understands the intent and queries the scheme database via Kendra

**Step 5** — Response is generated, translated back to user's language, and spoken aloud via Amazon Polly

**Step 6** — User receives step-by-step guidance, scheme list, or document explanation instantly

---

## Impact

| Metric | Number |
|---|---|
| Target Users | 600 million+ rural Indians |
| Indian Languages Supported | 22 |
| Government Schemes Covered | 805+ central schemes |
| Network Requirement | Works on 2G |
| App Download Required | None |
| Cost to Citizen | Free |

---

- **Event**: Amazon AI for Bharat Hackathon 2025
- **Problem Statement**: PS03 — AI for Communities, Access & Public Impact
- **Team Name**:HackOps7
- **Team Leader**: Parth Hindiya

---

