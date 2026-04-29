import logging
import time
import uuid
from contextlib import asynccontextmanager
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from typing import List, Optional
from app.models.predict import get_prediction
from app.models.load_model import is_model_loaded, reload_model, load_trained_artifacts
from app.core.config import settings

logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

_executor = ThreadPoolExecutor(max_workers=4)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model at startup so /health reports correctly from the start."""
    logger.info("Loading model at startup ...")
    load_trained_artifacts()
    if is_model_loaded():
        logger.info("Model ready")
    else:
        logger.warning("Model not available — running in rule-only fallback mode")
    yield
    _executor.shutdown(wait=False)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

START_TIME = time.time()


# ── Request / response schemas ───────────────────────────────────────

class CampaignRequest(BaseModel):
    text: str

    @field_validator("text")
    @classmethod
    def text_must_be_valid(cls, v):
        if not v or not v.strip():
            raise ValueError("Text must not be empty")
        if len(v) > settings.MAX_INPUT_LENGTH:
            raise ValueError(f"Text exceeds maximum length of {settings.MAX_INPUT_LENGTH}")
        return v


class BatchRequest(BaseModel):
    texts: List[str]

    @field_validator("texts")
    @classmethod
    def texts_must_be_valid(cls, v):
        if not v:
            raise ValueError("Texts list must not be empty")
        if len(v) > settings.MAX_BATCH_SIZE:
            raise ValueError(f"Batch size exceeds maximum of {settings.MAX_BATCH_SIZE}")
        for i, t in enumerate(v):
            if not t or not t.strip():
                raise ValueError(f"Text at index {i} is empty")
            if len(t) > settings.MAX_INPUT_LENGTH:
                raise ValueError(f"Text at index {i} exceeds maximum length")
        return v


def _build_response(result) -> dict:
    return {
        "label": result.label,
        "confidence": result.confidence,
        "final_score": result.final_score,
        "ml_phishing_score": result.ml_phishing_score,
        "rule_score": result.rule_score,
        "indicators": result.indicators,
        "model_active": not result.is_fallback,
    }


# ── Endpoints ────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "model_loaded": is_model_loaded(),
        "uptime_seconds": round(time.time() - START_TIME, 2),
        "version": settings.VERSION,
    }


@app.post("/predict")
async def predict(request: CampaignRequest):
    request_id = str(uuid.uuid4())
    logger.info("[%s] Predict: %d chars", request_id, len(request.text))

    result = get_prediction(request.text)

    logger.info("[%s] Result: %s (%.4f)", request_id, result.label, result.confidence)

    response = _build_response(result)
    response["request_id"] = request_id
    return response


@app.post("/predict/batch")
async def predict_batch(request: BatchRequest):
    request_id = str(uuid.uuid4())
    logger.info("[%s] Batch: %d texts", request_id, len(request.texts))

    results = list(_executor.map(
        lambda t: _build_response(get_prediction(t)),
        request.texts,
    ))

    return {
        "request_id": request_id,
        "count": len(results),
        "results": results,
    }


@app.post("/model/reload")
async def model_reload():
    model, vectorizer = reload_model()
    return {
        "success": model is not None,
        "model_loaded": is_model_loaded(),
    }
