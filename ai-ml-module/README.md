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
│                    │  │  │ 0.55 │  │  0.45  │  │             │
│                    │  │  └──────┘  └────────┘  │             │
│                    │  └────────────────────────┘             │
│                    └─────────────────┘                       │
└──────────────────────────────────────────────────────────────┘
```

---

## 🤖 Model Details

### Algorithm: Logistic Regression

The classification engine relies on a single, highly-optimized **Logistic Regression** model. 

### Why This Architecture?

1. **High Performance**: Logistic Regression is incredibly fast at inference, making it ideal for real-time validation in an API context.
2. **Interpretability & Calibration**: The model returns calibrated probabilities rather than hard boundaries, which are then blended with the rules engine to compute a final `final_score`.
3. **High-Dimensional Spaces**: When combined with a 50,000-feature TF-IDF vectorizer, Logistic Regression effortlessly discovers linear relationships identifying malicious intent.

### Training Details

| Parameter | Value |
|-----------|-------|
| Dataset | **~18,650 samples** from Phishing_Email.csv (domain-relevant phishing & safe emails only) |
| Train/Test Split | 80/20 stratified |
| Cross-Validation | 5-fold Stratified CV (F1-weighted) |
| Class Balancing | `class_weight='balanced'` (handles ~1.55:1 imbalance) |
| Text Preprocessing | Lowercase → HTML strip → Token Replacement (`specialtokenurl`, `specialtokenip`, `specialtokenemail`, `specialtokenphone`) → Base64 removal → Stopword removal |
| Feature Space | TF-IDF with **50,000** features, unigrams + bigrams |
| Min Document Freq | 3 |
| Max Document Freq | 95% |
| Sublinear TF | Enabled |

> **Note:** Previously included datasets (Fake news, Clickbait, LIAR) were removed as they contaminated the model with irrelevant decision boundaries. Only phishing-specific email data is used for training.

### Classification Thresholds

| Score Range | Label | Meaning |
|-------------|-------|---------|
| `≥ 0.70` | 🔴 **High Risk** | Strong phishing indicators detected |
| `0.40 – 0.69` | 🟡 **Suspicious** | Some warning signs present |
| `< 0.40` | 🟢 **Safe** | Content appears legitimate |

### Score Blending

The final score is a weighted combination of ML and rule-based analysis:

```
final_score = 0.55 × ML_score + 0.45 × Rule_score
```

If either score exceeds `0.80`, the maximum is used instead (high-confidence override).

---

## 🔬 Feature Extraction

### TF-IDF Vectorizer (ML Pipeline)
- Converts raw email text into numerical feature vectors
- **50,000** most informative uni/bigram features
- URLs, emails, IPs, and phone numbers are mapped to unique tokens (`specialtokenurl`, `specialtokenemail`, etc.) instead of being erased, dramatically increasing malicious indicator retention.

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
  "confidence": 0.8957,
  "final_score": 0.8957,
  "ml_phishing_score": 0.8957,
  "rule_score": 0.55,
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

---

### `POST /model/reload` — Hot Reload Model

Reload model artifacts from disk without restarting the service.

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

# 3. Train the model (uses dataset from ai-ml-module/datasets of CD)
python -m training.train

# 4. Start the API server
uvicorn app.api.endpoints:app --host 0.0.0.0 --port 8001 --reload
```

---

## 🐳 Docker Deployment

```bash
# Run the container alongside other services via docker-compose
docker-compose up -d --build
```

The Dockerfile:
1. Installs Python dependencies
2. Downloads NLTK stopwords
3. Copies over the `training/` directory containing the previously generated `model.pkl` + `vectorizer.pkl` (skips live training to save startup time).
4. Starts uvicorn on port 8001
5. Includes a health check endpoint

---

## 📁 Project Structure

```
ai-ml-module/
├── Dockerfile                  # Container build instructions
├── Phishing_Email.csv          # Training dataset (~18,650 emails)
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
│   │   ├── features.py         # Rule-based + campaign spam/fraud detection
│   │   └── tokenizer.py        # Text cleaning & signal extraction
│   └── models/
│       ├── __init__.py
│       ├── load_model.py       # Thread-safe model lifecycle manager
│       └── predict.py          # Hybrid prediction pipeline
└── training/
    ├── __init__.py
    ├── train.py                # Full training pipeline (single clean dataset)
    ├── eda.ipynb               # Exploratory Data Analysis notebook
    ├── final_test.py           # Campaign verification test suite
    ├── model.pkl               # Trained Logistic Regression model
    └── vectorizer.pkl          # Fitted TF-IDF vectorizer (50k features)
```

---

## 📄 License

Part of the **Campaign Verify Platform** project.

---

*AI/ML Module v2.1.0 — Built with ❤️ for secure digital marketing*
