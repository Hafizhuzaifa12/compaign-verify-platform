"""FastAPI surface for the AI/ML service."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.core.config import settings
from app.models.load_model import load_model
from app.models.predict import score

router = APIRouter()


class PredictRequest(BaseModel):
    title: str = Field(min_length=1)
    description: str = Field(min_length=1)
    media_url: str | None = None


class PredictResponse(BaseModel):
    authenticity_score: float
    deepfake_score: float
    status: str
    signals: dict[str, float]
    model_name: str
    model_version: str


@router.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest) -> PredictResponse:
    text = f"{payload.title}. {payload.description}"
    has_media = bool(payload.media_url)

    pred = score(text, has_media=has_media)

    status = (
        "verified"
        if pred.authenticity_score >= settings.authenticity_verified_threshold
        and pred.deepfake_score <= settings.deepfake_risk_threshold
        else "flagged"
    )

    return PredictResponse(
        authenticity_score=pred.authenticity_score,
        deepfake_score=pred.deepfake_score,
        status=status,
        signals=pred.signals,
        model_name=pred.model_name,
        model_version=pred.model_version,
    )


@router.get("/model")
def model_info() -> dict[str, str]:
    mdl = load_model()
    return {"name": mdl.name, "version": mdl.version}
