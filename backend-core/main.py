"""Verit backend-core entrypoint.

Run with:
    uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.core.config import settings
from app.db.base import init_db
from app.models.campaign import Campaign
from app.services.campaign_service import campaign_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ── Demo seed data ─────────────────────────────────────────────────────────
# Pre-populated so the dashboard isn't empty on first launch.
_SEED_CAMPAIGNS = [
    Campaign(
        id="cmp_demo_001",
        title="Aurora — Spring Drop",
        brand="Aurora Beauty",
        description="Seasonal product launch featuring real talent narration with disclosed CG backgrounds. All participants provided verified consent forms.",
        media_url="https://example.com/aurora-spring.mp4",
        category="marketing",
        status="verified",
        authenticity_score=88.6,
        deepfake_score=3.2,
        blockchain_tx="0xa4f1e8c92b3d7f6a1b5e4c8d2f9a3b7e6c1d5f8a2e4b9c7d3f6a8e1b5c92b",
        blockchain_block=18_294_771,
        submitted_by="__seed__",
        submitted_at=datetime(2026, 4, 15, 10, 30, tzinfo=timezone.utc),
        verified_at=datetime(2026, 4, 15, 10, 31, tzinfo=timezone.utc),
    ),
    Campaign(
        id="cmp_demo_002",
        title="Nova PSA — Vote 2026",
        brand="Nova Civic",
        description="Non-partisan civic engagement message recorded by verified voice talent according to election commission standards.",
        category="political",
        status="verified",
        authenticity_score=86.1,
        deepfake_score=5.8,
        blockchain_tx="0xb7c3d9e1f4a6b8c2d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9",
        blockchain_block=18_295_102,
        submitted_by="__seed__",
        submitted_at=datetime(2026, 4, 20, 14, 0, tzinfo=timezone.utc),
        verified_at=datetime(2026, 4, 20, 14, 1, tzinfo=timezone.utc),
    ),
    Campaign(
        id="cmp_demo_003",
        title="Miracle Weight Loss Secret",
        brand="Unknown Seller",
        description="Shocking secret they won't tell you — guaranteed 100% results. Act now! Limited time! This miracle breakthrough will change your life!",
        category="marketing",
        status="rejected",
        authenticity_score=27.4,
        deepfake_score=72.0,
        blockchain_tx="0xc1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1",
        blockchain_block=18_296_540,
        submitted_by="__seed__",
        submitted_at=datetime(2026, 5, 1, 9, 15, tzinfo=timezone.utc),
        verified_at=datetime(2026, 5, 1, 9, 16, tzinfo=timezone.utc),
    ),
    Campaign(
        id="cmp_demo_004",
        title="Green Future Initiative",
        brand="EcoPlanet Foundation",
        description="Documentary-style fundraising campaign with real beneficiary interviews. Independently audited by the Environmental Research Institute.",
        media_url="https://example.com/eco-future.mp4",
        category="public_service",
        status="verified",
        authenticity_score=91.2,
        deepfake_score=2.1,
        blockchain_tx="0xd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
        blockchain_block=18_297_888,
        submitted_by="__seed__",
        submitted_at=datetime(2026, 5, 5, 16, 45, tzinfo=timezone.utc),
        verified_at=datetime(2026, 5, 5, 16, 46, tzinfo=timezone.utc),
    ),
]


def _db_host_display() -> str:
    """Mask password from DATABASE_URL for safe logging."""
    url = settings.DATABASE_URL
    if "@" in url:
        return url.split("@")[-1]
    return url


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Make sure the DB schema exists on first boot.
    try:
        init_db()
        logger.info("Database tables ready at %s", _db_host_display())
    except Exception as exc:
        logger.error("Failed to initialise database: %s", exc)
        raise

    # Seed demo data (idempotent — skips rows that already exist).
    try:
        campaign_service.seed(_SEED_CAMPAIGNS)
        logger.info("Seed data checked — %d demo campaigns available", len(_SEED_CAMPAIGNS))
    except Exception as exc:
        logger.warning("Seed data skipped: %s", exc)

    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Verit — Campaign Verification Platform API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["meta"])
def root() -> dict[str, str]:
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
    }


@app.get("/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok"}
