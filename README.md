# Campaign Verify Platform

AI-powered SaaS platform to verify campaign content using secure APIs, ML scoring, and blockchain-backed transparency.

## Architecture Diagram

Export your Draw.io diagram as `docs/architecture.png` and keep this embed:

![Campaign Verify Platform Architecture](docs/architecture.png)

Recommended flow in the diagram:
- Frontend (`Next.js`) -> Backend (`FastAPI`)
- Backend -> AI Service (`FastAPI + ML model`)
- Backend -> PostgreSQL
- Backend -> Blockchain Bridge Service (`FastAPI`) -> Ledger records

## Tech Stack

- Next.js (Frontend UI)
- FastAPI (Core backend APIs)
- TensorFlow/Scikit-learn (AI/ML scoring service)
- Solidity + blockchain bridge service (in `blockchain-infra`)
- Docker + Docker Compose (Orchestration)

## Features

- User auth with JWT-based access and refresh flow
- Campaign submission and verification pipeline
- AI-powered phishing/safety classification
- Trust/risk scoring with confidence output
- Dashboard with verification outcomes
- Service-to-service blockchain record and integrity verification APIs
- Re-verification workflow for campaign edits

## Setup Instructions

### 1) Clone Repository

```bash
git clone <your-repo-url>
cd compaign-verify-platform
```

### 2) Run Full Stack (One Command)

```bash
docker compose up --build
```

This starts:
- Frontend on `http://localhost:3000`
- Backend API on `http://localhost:8000`
- AI Service on `http://localhost:8001`
- Blockchain service on `http://localhost:8002` (bridge API under `/v1/*`)
- PostgreSQL on `localhost:5432`

### 3) Open the App

- Frontend: `http://localhost:3000`
- Backend health/root: `http://localhost:8000/`
- AI health: `http://localhost:8001/health`
- Blockchain service health: `http://localhost:8002/health`

### 4) Quick End-to-End API Check

1. Register/login in frontend and submit a campaign.
2. Verify backend campaign response includes:
   - `ai_label`, `risk_score`, `trust_score`
   - `status` (e.g., `Verified on Blockchain`, `Suspicious`, `High Risk`)
   - `tx_hash` when blockchain store succeeds
3. Verify blockchain API directly:

```bash
curl -X POST http://localhost:8002/v1/records/verify \
  -H "Content-Type: application/json" \
  -d '{"campaign_id":1,"content_hash":"<sha256-from-backend>"}'
```

## Docker Orchestration Notes

- Root compose file: `docker-compose.yml`
- Backend Dockerfile: `backend-core/Dockerfile`
- Frontend Dockerfile: `frontend/Dockerfile`
- AI Dockerfile: `ai-ml-module/Dockerfile`
- Blockchain Dockerfile: `blockchain-infra/Dockerfile`
- Database service included as `db` (PostgreSQL)

## Lead Checklist (Pre-Presentation)

Use this checklist before demo:

- One-command run works: `docker compose up --build`
- Frontend auth flow works without CORS/token issues
- End-to-end loop works: Login -> Submit -> AI+security -> blockchain record -> report -> re-verify
- Security checks work: weak password rejection + marketing tips visibility
- Documentation quality: `README.md` and EDA notebook are clear and formatted
