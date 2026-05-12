"""Pydantic models for campaigns."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, HttpUrl

CampaignCategory = Literal["marketing", "political", "public_service", "other"]
VerificationStatus = Literal[
    "pending", "analyzing", "verified", "flagged", "rejected"
]


class CampaignCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    brand: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1, max_length=2000)
    media_url: HttpUrl | None = None
    category: CampaignCategory = "marketing"


class Campaign(BaseModel):
    id: str
    title: str
    brand: str
    description: str
    media_url: str | None = None
    category: CampaignCategory
    status: VerificationStatus = "pending"
    authenticity_score: float = 0.0
    deepfake_score: float = 0.0
    blockchain_tx: str | None = None
    blockchain_block: int | None = None
    submitted_by: str
    submitted_at: datetime
    verified_at: datetime | None = None
