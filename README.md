# Verit — Campaign Verification Platform

> Proof of authentic campaigns. Powered by AI + Blockchain.

Verit is a SaaS platform that verifies the authenticity of marketing and political campaigns. It combines AI-based content analysis (deepfake detection, claim verification, sentiment & manipulation scoring) with immutable on-chain proofs, so brands, agencies, and regulators can trust what they see.

---

## Architecture

```
┌────────────────────────┐     ┌────────────────────────┐
│  Next.js 14 Frontend   │ ──▶ │  FastAPI Backend Core  │
│  (Tailwind + shadcn)   │     │  (Auth, Campaigns API) │
└────────────────────────┘     └──────────┬─────────────┘
                                          │
                          ┌───────────────┼────────────────┐
                          ▼               ▼                ▼
                ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
                │  AI/ML Svc   │  │  PostgreSQL  │  │  Blockchain  │
                │  (FastAPI +  │  │  (Campaigns, │  │  (Solidity   │
                │   PyTorch)   │  │   Users)     │  │   contract)  │
                └──────────────┘  └──────────────┘  └──────────────┘
```

## Modules

| Module | Stack | Purpose |
|---|---|---|
| `frontend/` | Next.js 14, Tailwind, TypeScript | Marketing site, auth, dashboard, campaign submission |
| `backend-core/` | FastAPI, SQLAlchemy, JWT | REST API, auth, user & campaign management |
| `ai-ml-module/` | FastAPI, PyTorch, Transformers | Authenticity scoring & deepfake detection |
| `blockchain-infra/` | Solidity, Hardhat, Web3.py | On-chain campaign registry & proofs |

## Quick start

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend-core && pip install -r requirements.txt && uvicorn main:app --reload

# AI/ML
cd ai-ml-module && pip install -r requirements.txt && uvicorn app.main:app --port 8001

# Blockchain (local node)
cd blockchain-infra && docker compose -f docker/docker-compose.yml up
```

## License

MIT
