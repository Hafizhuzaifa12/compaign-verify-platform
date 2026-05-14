# Verit — Campaign Verification Platform

> Proof of authentic campaigns. Powered by AI + Blockchain.

**Author:** Hafiz Huzaifa | **License:** MIT | **Version:** 0.1.0

Verit is a full-stack SaaS platform that verifies the authenticity and intent of marketing, political, and public service campaigns. It combines a Logistic Regression AI model (98% F1-score) with a rule-based fraud engine and immutable on-chain Ethereum attestations to ensure that verified campaigns are trustworthy and tamper-proof.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Modules](#system-modules)
3. [End-to-End Verification Flow](#end-to-end-verification-flow)
4. [AI/ML Detection Engine](#aiml-detection-engine)
5. [Backend Core](#backend-core)
6. [Frontend](#frontend)
7. [Blockchain Infrastructure](#blockchain-infrastructure)
8. [Database Schema](#database-schema)
9. [API Reference](#api-reference)
10. [Deployment & Quick Start](#deployment--quick-start)
11. [Environment Variables](#environment-variables)
12. [Project Structure](#project-structure)
13. [Known Limitations](#known-limitations)
14. [License](#license)

---

## Architecture Overview

The platform operates on a **microservices architecture**, fully containerized via Docker Compose. Each service is independently deployable and communicates over HTTP REST.

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        User's Browser                               │
│                     http://localhost:3000                            │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTPS/JSON
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  Next.js 14 Frontend (Port 3000)                    │
│              React + TailwindCSS + Lucide Icons                     │
│   Pages: Login → Dashboard → Submit Campaign → Campaign Detail      │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ Bearer JWT + JSON
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│               FastAPI Backend Core (Port 8000)                      │
│          Auth (JWT) • Campaign CRUD • AI Orchestration               │
│                                                                     │
│   POST /api/v1/campaigns  ──────────┐                               │
│          │                          │                               │
│          ▼                          ▼                               │
│   ┌──────────────┐    ┌───────────────────────┐                     │
│   │  PostgreSQL   │    │   AI/ML Service        │                    │
│   │  (Port 5432)  │    │   (Port 8001)          │                    │
│   │  Users, Cmpns │    │   POST /predict        │                    │
│   └──────────────┘    │                         │                    │
│                       │  ┌─────────┐ ┌────────┐│                    │
│                       │  │ ML Model│ │ Rule   ││                    │
│                       │  │  (55%)  │ │Engine  ││                    │
│                       │  │  LR+    │ │ (45%) ││                    │
│                       │  │  TF-IDF │ │        ││                    │
│                       │  └─────────┘ └────────┘│                    │
│                       └───────────────────────┘                     │
│          │                                                          │
│          ▼ Score → Status mapping                                   │
│   Safe → "verified" + blockchain hash                               │
│   Suspicious → "flagged" for human review                           │
│   High Risk → "rejected"                                            │
└─────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│            Anvil Local Blockchain Node (Port 8545)                  │
│          CampaignRegistry.sol (Solidity ^0.8.20)                    │
│       Immutable on-chain attestation of verification results        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## System Modules

| Module | Tech Stack | Purpose |
|--------|-----------|---------|
| **`frontend/`** | Next.js 14, React 18, TailwindCSS, TypeScript, Lucide | User-facing dashboard: campaign submission, verification status, score visualization, blockchain proof display |
| **`backend-core/`** | FastAPI, Python 3.12, SQLAlchemy 2.0, JWT (python-jose), httpx | Central API: authentication, campaign CRUD, AI orchestration, score translation, blockchain hash generation |
| **`ai-ml-module/`** | FastAPI, Scikit-Learn 1.8, NLTK, TF-IDF, Logistic Regression | Security gatekeeper: analyzes campaign text to detect phishing, spam, fraud, and impersonation (98% F1) |
| **`blockchain-infra/`** | Solidity 0.8.20, Foundry (Anvil), Web3.py | Smart contract (`CampaignRegistry.sol`) for immutable on-chain attestation of verified campaigns |

---

## End-to-End Verification Flow

This is the complete data journey from user submission to on-chain attestation:

### Step 1: Campaign Submission (Frontend)
User fills out the form at `/campaigns/submit`:
- **Campaign title** (max 200 chars)
- **Brand / Organization** (max 120 chars)
- **Category** — Marketing, Political, PSA, or Other
- **Media** — File upload or URL paste
- **Description** (max 2000 chars)

The form calls `POST /api/v1/campaigns` with a Bearer JWT token.

### Step 2: Persistence & Analysis Trigger (Backend)
```python
# campaign_service.py — submit()
campaign_id = "cmp_{uuid}"
rec.status = "analyzing"          # Saved to PostgreSQL immediately
db.commit()
asyncio.create_task(self._analyze_and_attest(campaign_id))  # Non-blocking
return campaign                   # Frontend gets immediate 201 response
```

The campaign is persisted with `status="analyzing"` and returned immediately. The AI analysis runs asynchronously in the background.

### Step 3: Text Construction & AI Call (Backend → AI)
```python
# campaign_service.py — _call_ai_service()
text_parts = [campaign.title, campaign.brand, campaign.description, campaign.media_url]
combined_text = " | ".join([p for p in text_parts if p])
# POST http://ai:8001/predict  {"text": combined_text}
```

**All campaign fields including brand** are sent to the AI so it can detect impersonation (e.g., someone claiming their brand is "PayPal").

### Step 4: AI Analysis (AI Module)
The AI module runs a **hybrid scoring pipeline**:

| Component | Weight | What It Does |
|-----------|--------|-------------|
| **ML Model** (Logistic Regression) | 55% | TF-IDF vectorization → probability of phishing class |
| **Rule Engine** | 45% | Keyword matching for urgency, credentials, spam, impersonation, deceptive patterns, suspicious URLs |

```python
final_score = 0.55 × ML_score + 0.45 × Rule_score
# If either exceeds 0.80, max() is used instead (high-confidence override)
```

**Returns:**
```json
{
  "label": "Safe | Suspicious | High Risk",
  "final_score": 0.0-1.0,
  "ml_phishing_score": 0.0-1.0,
  "rule_score": 0.0-1.0,
  "indicators": ["urgency_keywords_x3", "spam_fraud_intent_x2", ...],
  "confidence": 0.0-1.0,
  "model_active": true
}
```

### Step 5: Score Translation (Backend)
```python
authenticity = (1.0 - final_score) × 100     # 0-100 (higher = safer)
deepfake_risk = final_score × 100             # 0-100 (higher = riskier)

# Label mapping:
"Safe"        → status = "verified"
"Suspicious"  → status = "flagged"
"High Risk"   → status = "rejected"
```

### Step 6: Blockchain Attestation (Backend)
```python
tx_hash = "0x" + SHA256(campaign_id)
block = random(18_000_000, 19_000_000)
```
> **Note:** Blockchain attestation is currently **simulated** locally. The `CampaignRegistry.sol` smart contract is deployed to Anvil but the backend does not yet call it directly. The hash is deterministic from the campaign ID.

### Step 7: Display Results (Frontend)
The detail page at `/campaigns/[id]` polls every 1.5 seconds while `status === "analyzing"`. Once complete, it displays:
- **Authenticity score** (0-100 ring)
- **Deepfake risk score** (0-100 ring)
- **Real AI signals** — ML probability, rule-engine risk, combined score, confidence
- **Detected indicators** — badges showing exactly what the AI flagged (e.g., `spam_fraud_intent_x3`, `phishing_domain_fragment_x1`)
- **On-chain attestation** — transaction hash, block number, network
- **Timeline** — submitted → AI analysis → on-chain attestation
- **Public trust badge** (if verified) — embeddable HTML snippet

---

## AI/ML Detection Engine

### Model Architecture

| Parameter | Value |
|-----------|-------|
| **Algorithm** | Logistic Regression (`class_weight='balanced'`, `max_iter=1000`) |
| **Feature Extraction** | TF-IDF Vectorizer (50,000 features, unigrams + bigrams) |
| **Training Dataset** | `Phishing_Email.csv` — 17,515 clean samples (6,540 Phishing / 10,976 Safe) |
| **Evaluation** | 5-Fold Stratified Cross-Validation: **98.16% F1** (±0.15%) |
| **Hold-out Test** | 20% split → **97.75% Phishing F1**, **98% accuracy** |
| **Inference Time** | ~780ms median latency |

### Text Preprocessing Pipeline

```
Raw text
  → Lowercase
  → Strip HTML tags + entities
  → Replace URLs → specialtokenurl
  → Replace emails → specialtokenemail
  → Replace IPs → specialtokenip
  → Replace phone numbers → specialtokenphone
  → Remove base64 blobs
  → Collapse repeated characters (5+)
  → Remove non-alphabetic characters
  → Remove English stopwords + single-char tokens
  → TF-IDF vectorization (50k features)
```

### Rule Engine Signals

The rule engine detects structural and semantic fraud indicators in campaign text:

| Signal Category | Examples | Max Score |
|----------------|---------|-----------|
| **IP in URL** | `http://192.168.1.100/verify` | 0.30 |
| **Suspicious TLD** | `.xyz`, `.tk`, `.top`, `.click` | 0.30 |
| **Phishing Domain** | `secure-paypal.xyz`, `login-verify.com` | 0.20 |
| **Urgency Keywords** | "act now", "within 24 hours", "suspended" | 0.20 |
| **Credential Keywords** | "password", "SSN", "credit card" | 0.25 |
| **Spam/Fraud Intent** | "guaranteed winner", "wire transfer", "free money" | 0.30 |
| **Impersonation** | "official notice from", "ministry of", "IRS notice" | 0.25 |
| **Deceptive Patterns** | "verify your identity", "confirm your account" | 0.20 |
| **High URL Count** | More than 3 URLs in text | 0.10 |
| **Email in Body** | Embedded email addresses | 0.05 |

### Classification Thresholds

| Final Score | Label | Platform Status | Action |
|-------------|-------|----------------|--------|
| `< 0.40` | Safe | `verified` | Blockchain attestation proceeds |
| `0.40 – 0.69` | Suspicious | `flagged` | Awaiting human review |
| `>= 0.70` | High Risk | `rejected` | Campaign blocked |

### What the AI Catches

- Phishing campaigns disguised as brand promotions
- Credential harvesting campaigns ("verify your password")
- Spam/scam campaigns (lottery scams, advance-fee fraud)
- Impersonation of government/official organizations
- Campaigns with suspicious URLs, TLDs, or IP-based links
- Deceptive data-collection campaigns

### What Passes Through

- Legitimate marketing campaigns (product launches, promotions)
- Real political/PSA campaigns
- Normal brand communications
- Campaign with clean language and legitimate URLs

---

## Backend Core

### Technology

- **Framework:** FastAPI 0.111
- **Language:** Python 3.12
- **ORM:** SQLAlchemy 2.0 (async-compatible via `asyncio.to_thread`)
- **Auth:** JWT (HS256) via `python-jose`
- **Password Hashing:** bcrypt via `passlib`
- **HTTP Client:** httpx (async, 30s timeout to AI service)
- **Database:** PostgreSQL 16

### Authentication Flow

1. User registers via `POST /api/v1/auth/register` (email, password, full_name, organization)
2. User logs in via `POST /api/v1/auth/login` → receives JWT access token (24h expiry)
3. All campaign endpoints require `Authorization: Bearer <token>` header
4. Token is decoded and validated on each request via `get_current_user` dependency

### Campaign Service Logic

```
submit(payload, user_id)
  ├── Generate campaign_id (cmp_{uuid8})
  ├── Insert into PostgreSQL (status="analyzing")
  ├── Return 201 immediately
  └── Background task: _analyze_and_attest(campaign_id)
        ├── Fetch campaign from DB
        ├── Combine title + brand + description + media_url
        ├── POST to AI service /predict
        ├── Translate: final_score → authenticity (0-100), deepfake (0-100)
        ├── Map label → verified/flagged/rejected
        ├── Generate blockchain hash
        └── Persist scores + hash + status to DB
```

---

## Frontend

### Technology

- **Framework:** Next.js 14 (App Router)
- **UI:** TailwindCSS + custom component library (shadcn-style)
- **Icons:** Lucide React
- **State:** React hooks (no external state library)
- **Auth:** localStorage-based JWT token persistence

### Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/auth/login` | Login form |
| `/auth/register` | Registration form |
| `/dashboard` | Campaign overview: total, verified, flagged, in-flight, verification volume chart, activity feed |
| `/campaigns/submit` | Campaign submission form (title, brand, category, media, description) |
| `/campaigns/[id]` | Campaign detail: scores, AI signals, detected indicators, blockchain proof, timeline, trust badge |

### Key UX Features

- **Real-time polling** — detail page polls every 1.5s while campaign is "analyzing"
- **Score visualization** — animated SVG ring charts for authenticity and deepfake risk
- **AI indicator badges** — shows exactly what the model flagged (e.g., `spam_fraud_intent_x3`)
- **Trust badge embed** — verified campaigns get a copy-paste HTML badge snippet
- **Responsive design** — works on desktop and mobile

---

## Blockchain Infrastructure

### Smart Contract: `CampaignRegistry.sol`

- **Solidity:** ^0.8.20
- **Deployed to:** Anvil local node (chain ID 31337)
- **Compiler:** solc 0.8.20 (via py-solc-x)

### Contract Features

| Function | Access | Description |
|----------|--------|-------------|
| `attest(campaignId, contentHash, authBp, dfBp, offChainUri)` | Verifier only | One-shot immutable attestation. Stores content hash, scores (basis points), timestamp, verifier address |
| `getAttestation(campaignId)` | Public (view) | Retrieve full attestation struct |
| `isAttested(campaignId)` | Public (view) | Cheap existence check for badge endpoint |
| `addVerifier(address)` | Owner only | Authorize a new verifier wallet |
| `removeVerifier(address)` | Owner only | Revoke verifier access |

### Data Stored On-Chain

```solidity
struct Attestation {
    bytes32 contentHash;        // SHA-256 of campaign content
    uint16 authenticityScore;   // 0–10000 (basis points, e.g. 9740 = 97.40%)
    uint16 deepfakeScore;       // 0–10000
    uint64 verifiedAt;          // Unix timestamp
    address verifier;           // Backend wallet address
    string offChainUri;         // Link to full off-chain record
}
```

---

## Database Schema

### `users` Table

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | VARCHAR(64) | PRIMARY KEY |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL |
| `full_name` | VARCHAR(120) | NOT NULL |
| `organization` | VARCHAR(120) | NULLABLE |
| `role` | VARCHAR(20) | NOT NULL, default `"submitter"` |
| `hashed_password` | VARCHAR(255) | NOT NULL |
| `created_at` | TIMESTAMP(TZ) | server default `now()` |

### `campaigns` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR(64) | PRIMARY KEY (format: `cmp_{uuid8}`) |
| `title` | VARCHAR(200) | Campaign title |
| `brand` | VARCHAR(120) | Brand or organization name |
| `description` | TEXT | Campaign description |
| `media_url` | TEXT | Optional media URL |
| `category` | VARCHAR(30) | `marketing`, `political`, `public_service`, `other` |
| `status` | VARCHAR(20) | `pending`, `analyzing`, `verified`, `flagged`, `rejected` |
| `authenticity_score` | FLOAT | 0-100 (higher = safer) |
| `deepfake_score` | FLOAT | 0-100 (higher = riskier) |
| `ai_indicators` | JSON | Array of detected indicator strings |
| `ml_score` | FLOAT | Raw ML phishing probability (0-1) |
| `rule_score` | FLOAT | Raw rule engine score (0-1) |
| `blockchain_tx` | VARCHAR(80) | Transaction hash |
| `blockchain_block` | INTEGER | Block number |
| `submitted_by` | VARCHAR(64) | FK → users.id |
| `submitted_at` | TIMESTAMP(TZ) | Submission timestamp |
| `verified_at` | TIMESTAMP(TZ) | Verification completion timestamp |

---

## API Reference

### Backend Core (Port 8000)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/auth/register` | Public | Register new user |
| `POST` | `/api/v1/auth/login` | Public | Login, returns JWT |
| `GET` | `/api/v1/users/me` | Bearer | Get current user profile |
| `GET` | `/api/v1/campaigns` | Bearer | List user's campaigns |
| `POST` | `/api/v1/campaigns` | Bearer | Submit new campaign for verification |
| `GET` | `/api/v1/campaigns/{id}` | Bearer | Get campaign detail (owner or admin) |
| `GET` | `/health` | Public | Health check |
| `GET` | `/docs` | Public | Swagger UI |

### AI/ML Module (Port 8001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/predict` | Analyze single text → label, scores, indicators |
| `POST` | `/predict/batch` | Analyze multiple texts (max batch size configurable) |
| `POST` | `/model/reload` | Hot-reload model artifacts without restart |
| `GET` | `/health` | Health check (model loaded, uptime) |

#### Example `/predict` Request
```json
{
  "text": "URGENT: Verify your PayPal account at http://paypal-secure.xyz/login"
}
```

#### Example `/predict` Response
```json
{
  "label": "High Risk",
  "confidence": 0.93,
  "final_score": 0.9338,
  "ml_phishing_score": 0.9338,
  "rule_score": 0.63,
  "indicators": [
    "suspicious_tld_x1",
    "phishing_domain_fragment_x1",
    "urgency_keywords_x6",
    "credential_keywords_x1",
    "deceptive_campaign_x1"
  ],
  "model_active": true
}
```

---

## Deployment & Quick Start

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) + [Docker Compose](https://docs.docker.com/compose/install/)
- No other local dependencies required

### 1. Clone & Configure
```bash
git clone <repo-url>
cd project
cp .env.example .env
# Edit .env if needed (defaults work for local dev)
```

### 2. Launch All Services
```bash
docker-compose up -d --build
```

This starts 5 containers:
1. **`verit-db`** — PostgreSQL 16 (auto-creates tables on first boot)
2. **`verit-ai`** — AI/ML inference service (loads pre-trained model)
3. **`verit-anvil`** — Local Ethereum node
4. **`verit-deployer`** — Compiles and deploys `CampaignRegistry.sol`
5. **`verit-backend`** — FastAPI backend (seeds demo data)
6. **`verit-frontend`** — Next.js UI

### 3. Access Services

| Service | URL |
|---------|-----|
| Frontend UI | [http://localhost:3000](http://localhost:3000) |
| Backend API Docs | [http://localhost:8000/docs](http://localhost:8000/docs) |
| AI/ML API Docs | [http://localhost:8001/docs](http://localhost:8001/docs) |
| PostgreSQL | `localhost:5432` (user: `verit`, pass: `verit_dev_password`) |
| Anvil RPC | `http://localhost:8545` |

### 4. Stop Services
```bash
docker-compose down          # Keeps database volume
docker-compose down -v       # Destroys everything (fresh start)
```

### Retraining the AI Model
```bash
cd ai-ml-module
python -m training.train     # Trains on Phishing_Email.csv
python -m training.final_test  # Validates 9/9 campaign test cases
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | `change-me-in-production` | JWT signing key |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` (24h) | Token expiry |
| `DATABASE_URL` | `postgresql://verit:...@db:5432/verit_db` | PostgreSQL connection |
| `AI_SERVICE_URL` | `http://ai:8001` | AI module URL (Docker) |
| `BLOCKCHAIN_RPC_URL` | `http://anvil:8545` | Ethereum RPC endpoint |
| `REGISTRY_CONTRACT_ADDRESS` | _(empty)_ | Deployed contract address |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend URL for frontend |

---

## Project Structure

```
project/
├── docker-compose.yml              # Orchestrates all 6 services
├── .env.example                    # Environment variable template
├── README.md                       # This documentation
├── LICENSE                         # MIT License
│
├── frontend/                       # Next.js 14 UI
│   ├── app/
│   │   ├── auth/                   # Login + Register pages
│   │   ├── dashboard/              # Campaign overview dashboard
│   │   ├── campaigns/
│   │   │   ├── submit/page.tsx     # Campaign submission form
│   │   │   └── [id]/page.tsx       # Campaign detail + scores + blockchain
│   │   ├── layout.tsx              # Root layout
│   │   └── page.tsx                # Landing page
│   ├── components/                 # Reusable UI components
│   ├── lib/
│   │   ├── api-client.ts           # Typed API client (fetch wrapper)
│   │   ├── auth.ts                 # JWT token management
│   │   └── utils.ts                # Utility functions
│   └── package.json
│
├── backend-core/                   # FastAPI Backend
│   ├── main.py                     # App entrypoint + seed data
│   ├── app/
│   │   ├── api/v1/endpoints/
│   │   │   ├── auth.py             # Login/register endpoints
│   │   │   ├── campaigns.py        # Campaign CRUD endpoints
│   │   │   └── users.py            # User profile endpoint
│   │   ├── core/
│   │   │   ├── config.py           # Pydantic settings (env-aware)
│   │   │   ├── deps.py             # Auth dependencies (JWT decode)
│   │   │   └── security.py         # Password hashing + token creation
│   │   ├── db/
│   │   │   ├── base.py             # SQLAlchemy ORM models
│   │   │   └── session.py          # Engine + session factory
│   │   ├── models/
│   │   │   ├── campaign.py         # Pydantic request/response models
│   │   │   └── user.py             # Pydantic user model
│   │   └── services/
│   │       ├── auth_service.py     # User registration + lookup
│   │       └── campaign_service.py # Campaign lifecycle + AI orchestration
│   ├── tests/                      # pytest test suite
│   └── requirements.txt
│
├── ai-ml-module/                   # AI/ML Inference Service
│   ├── Phishing_Email.csv          # Training dataset (~18,650 emails)
│   ├── app/
│   │   ├── api/endpoints.py        # FastAPI routes (/predict, /health, /batch)
│   │   ├── core/
│   │   │   ├── config.py           # ML settings (weights, thresholds)
│   │   │   ├── features.py         # Rule engine (phishing + campaign fraud)
│   │   │   └── tokenizer.py        # Text preprocessing pipeline
│   │   └── models/
│   │       ├── load_model.py       # Thread-safe model loader
│   │       └── predict.py          # Hybrid ML + Rule scoring
│   ├── training/
│   │   ├── train.py                # Training pipeline (single clean dataset)
│   │   ├── final_test.py           # 9 campaign verification test cases
│   │   ├── eda.ipynb               # Exploratory Data Analysis
│   │   ├── model.pkl               # Trained Logistic Regression
│   │   └── vectorizer.pkl          # Fitted TF-IDF (50k features)
│   └── requirements.txt
│
└── blockchain-infra/               # Smart Contract Deployment
    ├── contracts/
    │   └── CampaignRegistry.sol    # Attestation registry (Solidity ^0.8.20)
    ├── scripts/
    │   ├── deploy.py               # Deploy contract to Anvil
    │   └── interact.py             # CLI for manual attestations
    └── Dockerfile                  # Compiles + deploys on boot
```

---

## Known Limitations

| Area | Limitation | Mitigation |
|------|-----------|------------|
| **Blockchain** | Attestation hash is currently simulated (SHA-256 of campaign ID, not a real on-chain tx) | The `CampaignRegistry.sol` contract is ready; backend integration is pending |
| **File Upload** | Media files are not actually uploaded to a storage backend; only filename is appended to description | Add S3/MinIO integration for real media analysis |
| **Deepfake Detection** | The `deepfake_score` field measures phishing risk, not actual deepfake detection | Rename or add a separate visual deepfake model |
| **AI Training Data** | Model trained on email-style text; campaign descriptions are shorter | 98% F1 + rule engine compensates; add SMS Spam / SpamAssassin corpus for improvement |
| **Scalability** | Single-instance services with SQLite-style sessions | Add Redis caching, connection pooling, and horizontal scaling for production |

---

## License

MIT License — Copyright (c) 2026 Hafiz Huzaifa

See [LICENSE](LICENSE) for full text.
