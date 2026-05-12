"""AI/ML service entrypoint."""

from __future__ import annotations

from fastapi import FastAPI

from app.api.endpoints import router as ml_router
from app.core.config import settings
from app.models.load_model import load_model

app = FastAPI(
    title=f"{settings.service_name}",
    version=settings.version,
    description="Verit AI/ML inference service",
)

app.include_router(ml_router, prefix="/v1", tags=["inference"])


@app.on_event("startup")
def _warm_model() -> None:
    # Caches the model handle so the first request isn't slow.
    load_model()


@app.get("/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.service_name}
