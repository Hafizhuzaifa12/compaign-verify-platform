# Verit — Campaign Verification Platform

> Proof of authentic campaigns. Powered by AI + Blockchain.

Verit is an enterprise-grade SaaS platform designed to verify the authenticity of marketing, political, and public relations campaigns. By combining state-of-the-art AI content analysis (phishing, clickbait, and deepfake detection) with immutable on-chain Ethereum proofs, Verit allows brands, agencies, and the public to trust digital communications.

---

## Architecture Overview

The platform operates on a robust microservices architecture, fully containerized via Docker for seamless cross-platform deployment.

```text
┌────────────────────────┐     ┌────────────────────────┐
│  Next.js 14 Frontend   │ ──▶ │  FastAPI Backend Core  │
│  (Tailwind + shadcn)   │     │  (Auth, Campaigns API) │
└────────────────────────┘     └──────────┬─────────────┘
                                          │
                          ┌───────────────┼────────────────┐
                          ▼               ▼                ▼
                ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
                │  AI/ML Svc   │  │  PostgreSQL  │  │  Blockchain  │
                │  (FastAPI +  │  │  (Campaigns, │  │  (Local Anvil│
                │ Scikit-Learn)│  │   Users)     │  │   Node)      │
                └──────────────┘  └──────────────┘  └──────────────┘
```

## System Modules

| Module | Technology Stack | Purpose |
|---|---|---|
| `frontend/` | Next.js 14, React, TailwindCSS, TypeScript | User-facing dashboard for authenticating and reviewing campaigns. |
| `backend-core/` | FastAPI, Python 3.12, SQLAlchemy, JWT | The central brain handling business logic, database persistence, and external service orchestration. |
| `ai-ml-module/` | FastAPI, Scikit-Learn, NLTK, Pandas | A high-accuracy (90% F1-Score) Machine Learning engine capable of analyzing combined text and URLs to detect phishing, fake news, and clickbait. Trained on over 120,000 real-world samples. |
| `blockchain-infra/` | Solidity, Foundry (Anvil), Web3 | Immutable ledger ensuring that once a campaign is verified, its authenticity scores are permanently anchored on-chain. |

## The AI Detection Engine

The `ai-ml-module` features a highly optimized Natural Language Processing (NLP) pipeline. It fuses a rule-based heuristics engine with a dynamically trained Logistic Regression algorithm using advanced TF-IDF vectorization (50,000 features). 

**Key Capabilities:**
- **URL & Network Preservation**: Intelligently parses and preserves malicious IPs and suspicious URLs as embedded tokens rather than discarding them as noise.
- **Multi-Dataset Intelligence**: The model is trained on diverse datasets including classic spam (`Phishing_Email.csv`), fake news articles, clickbait headlines, and the LIAR political benchmark dataset.
- **Zero-Latency Boot**: The module does not retrain on startup. It relies on pre-trained serialized artifacts (`model.pkl` and `vectorizer.pkl`) ensuring instantaneous deployment.

---

## Deployment & Quick Start

The entire platform is orchestrated through `docker-compose`, meaning no localized virtual environments or heavy setups are required.

### 1. Prerequisites
Ensure you have the following installed on your system (Windows/macOS/Linux):
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### 2. Launching the Platform
To build and spin up the complete architecture (Database, AI Engine, Blockchain Node, Smart Contract Deployer, Backend API, and Frontend UI):

```bash
docker-compose up -d --build
```

### 3. Service Ports
Once the containers are healthy, you can access the various services:
- **Frontend UI**: [http://localhost:3000](http://localhost:3000)
- **Backend API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **AI/ML Engine Docs (Swagger)**: [http://localhost:8001/docs](http://localhost:8001/docs)
- **PostgreSQL Database**: `localhost:5432`
- **Anvil Blockchain Node**: `http://localhost:8545`

### 4. Stopping the Environment
To safely spin down the services without losing database volume data:
```bash
docker-compose down
```

---

## License

This project is licensed under the MIT License.
