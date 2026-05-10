# 🛡️ AI-Powered Phishing Detection Microservice

> Intelligent email/campaign content classification using a hybrid ML + Rule Engine approach.

[![Python 3.9+](https://img.shields.io/badge/Python-3.9+-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.5-F7931E?logo=scikit-learn)](https://scikit-learn.org)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://docker.com)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Model Details](#model-details)
- [Feature Extraction](#feature-extraction)
- [API Endpoints](#api-endpoints)
- [Setup & Installation](#setup--installation)
- [Docker Deployment](#docker-deployment)
- [Testing](#testing)
- [Project Structure](#project-structure)

---

## 🔍 Overview

This microservice is the **AI/ML brain** of the Campaign Verify Platform. It analyzes marketing campaign content (emails, social media posts, ads) and classifies them as **Safe**, **Suspicious**, or **High Risk** for phishing indicators.

### Key Capabilities
- ✅ Real-time phishing detection via REST API
- ✅ Hybrid scoring: ML model + rule-based engine
- ✅ Batch prediction support (up to 50 texts per request)
- ✅ Thread-safe model loading with hot-reload support
- ✅ Health checks & Docker-ready deployment

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    FastAPI Application                        │
│                                                              │
│  ┌────────────┐    ┌─────────────────┐    ┌──────────────┐  │
│  │  /predict   │───▶│  Prediction     │───▶│  Response     │  │
│  │  /predict/  │    │  Pipeline       │    │  Builder      │  │
│  │    batch    │    │                 │    │               │  │
│  └────────────┘    │  ┌───────────┐  │    └──────────────┘  │
│                    │  │ Tokenizer │  │                       │
│                    │  └─────┬─────┘  │                       │
│                    │        │        │                       │
│                    │  ┌─────▼─────┐  │                       │
│                    │  │  TF-IDF   │  │                       │
│                    │  │ Vectorizer│  │                       │
│                    │  └─────┬─────┘  │                       │
│                    │        │        │                       │
│                    │  ┌─────▼──────────────────┐             │
│                    │  │    Hybrid Scorer        │             │
│                    │  │  ┌──────┐  ┌────────┐  │             │
│                    │  │  │  ML  │  │ Rules  │  │             │
│                    │  │  │ 0.45 │  │  0.55  │  │             │
│                    │  │  └──────┘  └────────┘  │             │
│                    │  └────────────────────────┘             │
│                    └─────────────────┘                       │
└──────────────────────────────────────────────────────────────┘
```

---

## 🤖 Model Details

### Algorithm: Soft-Voting Ensemble

| Component | Algorithm | Role |
|-----------|-----------|------|
| **Estimator 1** | Logistic Regression | Fast, interpretable baseline with strong linear decision boundary |
| **Estimator 2** | LinearSVC (Calibrated) | Margin-based classifier excelling in high-dimensional text spaces |
| **Estimator 3** | Gradient Boosting (150 trees) | Captures non-linear patterns and complex feature interactions |

### Why This Architecture?

1. **Logistic Regression** — The gold standard for binary text classification. It's fast, interpretable, and provides well-calibrated probabilities. Ideal for production where latency matters.

2. **LinearSVC** — Support Vector Machines with linear kernels are proven performers on TF-IDF features. Wrapped in `CalibratedClassifierCV` to produce probability estimates.

3. **Gradient Boosting** — Adds ensemble depth by learning from residual errors. Captures feature interactions that linear models miss.

4. **Soft Voting** — Averages probability predictions from all three models, producing more robust and stable classifications than any single model.

### Training Details

| Parameter | Value |
|-----------|-------|
| Dataset | `Phishing_Email.csv` — 18,650 real-world email samples |
| Train/Test Split | 80/20 stratified |
| Cross-Validation | 5-fold stratified (F1 scoring) |
| Text Preprocessing | Lowercase → HTML strip → URL/IP removal → Stopword removal |
| Feature Space | TF-IDF with 10,000 features, unigrams + bigrams |
| Min Document Freq | 3 |
| Max Document Freq | 95% |
| Sublinear TF | Enabled |

### Classification Thresholds

| Score Range | Label | Meaning |
|-------------|-------|---------|
| `≥ 0.70` | 🔴 **High Risk** | Strong phishing indicators detected |
| `0.40 – 0.69` | 🟡 **Suspicious** | Some warning signs present |
| `< 0.40` | 🟢 **Safe** | Content appears legitimate |

### Score Blending

The final score is a weighted combination of ML and rule-based analysis:

```
final_score = 0.45 × ML_score + 0.55 × Rule_score
```

If either score exceeds `0.80`, the maximum is used instead (high-confidence override).

---

## 🔬 Feature Extraction

### TF-IDF Vectorizer (ML Pipeline)
- Converts raw email text into numerical feature vectors
- 10,000 most informative uni/bigram features
- Sublinear TF scaling reduces the impact of extremely frequent terms
- NLTK stopword removal + HTML/URL stripping

### Rule-Based Engine (Structural Analysis)

| Signal | Weight | Description |
|--------|--------|-------------|
| IP in URL | +0.30 | URLs containing raw IP addresses (e.g., `http://192.168.1.1/login`) |
| Suspicious TLD | +0.15/hit (max 0.30) | Domains ending in `.xyz`, `.tk`, `.ml`, `.top`, etc. |
| Phishing Domain Fragments | +0.10/hit (max 0.20) | Domains containing `secure-`, `login-`, `verify-`, etc. |
| Urgency Keywords | +0.05/hit (max 0.20) | Words like "urgent", "immediately", "verify now", "act now" |
| Credential Keywords | +0.10/hit (max 0.25) | Words like "password", "SSN", "credit card", "bank account" |
| High URL Count | +0.10 | Emails with more than 3 embedded URLs |
| Email in Body | +0.05 | Email addresses detected in the message body |

---

## 🌐 API Endpoints

### Base URL
```
http://localhost:8001
```

### `GET /health` — Health Check

Returns service status and model availability.

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "uptime_seconds": 142.5,
  "version": "2.1.0"
}
```

---

### `POST /predict` — Single Prediction

Analyze a single piece of text content.

**Request:**
```json
{
  "text": "URGENT: Your account has been suspended. Click here to verify: http://secure-banking.xyz/login"
}
```

**Response:**
```json
{
  "label": "High Risk",
  "confidence": 0.8723,
  "final_score": 0.8723,
  "ml_phishing_score": 0.9145,
  "rule_score": 0.85,
  "indicators": [
    "suspicious_tld_x1",
    "phishing_domain_fragment_x1",
    "urgency_keywords_x3",
    "credential_keywords_x1"
  ],
  "model_active": true,
  "request_id": "a1b2c3d4-e5f6-..."
}
```

---

### `POST /predict/batch` — Batch Prediction

Analyze up to 50 texts in a single request.

**Request:**
```json
{
  "texts": [
    "Meeting at 3pm tomorrow to discuss Q4 results.",
    "URGENT: Verify your PayPal account at http://paypal-verify.tk/secure"
  ]
}
```

**Response:**
```json
{
  "request_id": "...",
  "count": 2,
  "results": [
    {
      "label": "Safe",
      "confidence": 0.0812,
      "final_score": 0.0812,
      "ml_phishing_score": 0.0523,
      "rule_score": 0.0,
      "indicators": [],
      "model_active": true
    },
    {
      "label": "High Risk",
      "confidence": 0.9102,
      "...": "..."
    }
  ]
}
```

---

### `POST /model/reload` — Hot Reload Model

Reload model artifacts from disk without restarting the service.

**Response:**
```json
{
  "success": true,
  "model_loaded": true
}
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.9+
- pip

### Local Development

```bash
# 1. Navigate to the AI module
cd ai-ml-module

# 2. Install dependencies
pip install -r requirements.txt

# 3. Train the model (requires Phishing_Email.csv in root)
python -m training.train

# 4. Start the API server
uvicorn app.api.endpoints:app --host 0.0.0.0 --port 8001 --reload
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MODEL_PATH` | `training/model.pkl` | Path to trained model |
| `VECTORIZER_PATH` | `training/vectorizer.pkl` | Path to TF-IDF vectorizer |
| `DATASET_PATH` | `Phishing_Email.csv` | Path to training dataset |
| `CONFIDENCE_THRESHOLD` | `0.70` | Score threshold for "High Risk" |
| `SUSPICIOUS_THRESHOLD` | `0.40` | Score threshold for "Suspicious" |
| `ML_WEIGHT` | `0.45` | ML score weight in blending |
| `RULE_WEIGHT` | `0.55` | Rule score weight in blending |
| `MAX_BATCH_SIZE` | `50` | Maximum texts per batch request |
| `MAX_INPUT_LENGTH` | `50000` | Maximum characters per text |
| `LOG_LEVEL` | `INFO` | Logging level |
| `CORS_ORIGINS` | `*` | Allowed CORS origins |
| `API_PORT` | `8001` | API server port |

---

## 🐳 Docker Deployment

```bash
# Build the image (trains model during build)
docker build -t campaign-ai-service .

# Run the container
docker run -p 8001:8001 campaign-ai-service

# Test health
curl http://localhost:8001/health
```

The Dockerfile:
1. Installs Python dependencies
2. Downloads NLTK stopwords
3. Runs `training.train` to produce `model.pkl` + `vectorizer.pkl`
4. Starts uvicorn on port 8001
5. Includes a health check endpoint

---

## 🧪 Testing

### Quick Smoke Test (curl)

```bash
# Safe content
curl -X POST http://localhost:8001/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "Hi team, the quarterly report is attached. Please review by Friday."}'

# Phishing content
curl -X POST http://localhost:8001/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "URGENT: Your account will be suspended! Click http://secure-login.xyz/verify to confirm your password immediately."}'

# Suspicious content
curl -X POST http://localhost:8001/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "Important: Please update your billing information at your earliest convenience."}'
```

### Postman Collection

Import the following tests into Postman:

| # | Test Case | Expected Label |
|---|-----------|---------------|
| 1 | "Meeting tomorrow at 3pm in conference room B" | Safe |
| 2 | "URGENT: Verify your account at http://banking-secure.xyz" | High Risk |
| 3 | "Update your payment details to avoid service interruption" | Suspicious |
| 4 | "" (empty string) | 422 Validation Error |
| 5 | "!@#$%^&*()" (special chars only) | Safe |
| 6 | "Click http://192.168.1.1/login to reset password immediately" | High Risk |

---

## 📁 Project Structure

```
ai-ml-module/
├── Dockerfile                  # Container build instructions
├── Phishing_Email.csv          # Training dataset (18,650 samples)
├── README.md                   # This file
├── requirements.txt            # Python dependencies
├── app/
│   ├── __init__.py
│   ├── api/
│   │   ├── __init__.py
│   │   └── endpoints.py        # FastAPI routes (/predict, /health, /batch)
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py           # Environment-aware settings
│   │   ├── features.py         # Rule-based phishing signal detection
│   │   └── tokenizer.py        # Text cleaning & signal extraction
│   └── models/
│       ├── __init__.py
│       ├── load_model.py       # Thread-safe model lifecycle manager
│       └── predict.py          # Hybrid prediction pipeline
└── training/
    ├── __init__.py
    ├── train.py                # Full training pipeline
    ├── eda.ipynb               # Exploratory Data Analysis notebook
    ├── model.pkl               # Trained ensemble model
    └── vectorizer.pkl          # Fitted TF-IDF vectorizer
```

---

## 📄 License

Part of the **Campaign Verify Platform** project.

---

*AI/ML Module v2.1.0 — Built with ❤️ for secure digital marketing*
