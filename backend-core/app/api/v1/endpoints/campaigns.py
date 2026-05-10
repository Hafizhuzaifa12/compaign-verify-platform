import json
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.db.session import get_db, SessionLocal
from app.models.campaign import Campaign
from app.services import campaign_service

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


def _campaign_to_dict(c: Campaign) -> dict[str, Any]:
    tips: list[str] = []
    if c.marketing_tips:
        try:
            raw = json.loads(c.marketing_tips)
            if isinstance(raw, list):
                tips = [str(x) for x in raw]
        except json.JSONDecodeError:
            tips = []
    out: dict[str, Any] = {
        "id": c.id,
        "user_id": c.user_id,
        "title": c.title,
        "type": c.campaign_type,
        "content": c.content,
        "url": c.url or "",
        "status": c.status,
        "marketing_tips": tips,
        "ai_label": c.ai_label,
        "ai_confidence": c.ai_confidence,
        "risk_score": c.risk_score,
        "trust_score": c.trust_score,
        "blockchain_network": c.blockchain_network,
    }
    if c.security_warnings:
        try:
            out["security_warnings"] = json.loads(c.security_warnings)
        except json.JSONDecodeError:
            out["security_warnings"] = c.security_warnings
    if c.tx_hash is not None:
        out["tx_hash"] = c.tx_hash
    if c.content_hash_sha256 is not None:
        out["content_hash_sha256"] = c.content_hash_sha256
    return out


def _run_analysis_job(campaign_id: int, content: str) -> None:
    db = SessionLocal()
    try:
        campaign_service.analyze_campaign_content(db, campaign_id, content)
    finally:
        db.close()


class CampaignCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(min_length=3, max_length=160)
    type: str = Field(min_length=3, max_length=80)
    content: str = Field(min_length=5, max_length=50000)
    url: str = Field(default="", max_length=500)

    @field_validator("type", "title", "content", mode="after")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("must not be empty")
        return v.strip()


@router.post("", status_code=status.HTTP_201_CREATED, response_model=dict)
def create_campaign(
    body: CampaignCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
) -> dict:
    campaign = Campaign(
        user_id=current_user_id,
        title=body.title,
        campaign_type=body.type,
        content=body.content,
        url=body.url,
        status="Pending",
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    background_tasks.add_task(_run_analysis_job, campaign.id, campaign.content)

    return {
        "id": campaign.id,
        "user_id": campaign.user_id,
        "title": campaign.title,
        "type": body.type,
        "content": campaign.content,
        "url": campaign.url or "",
        "status": campaign.status,
        "marketing_tips": [],
        "ai_label": campaign.ai_label,
        "ai_confidence": campaign.ai_confidence,
        "risk_score": campaign.risk_score,
        "trust_score": campaign.trust_score,
        "blockchain_network": campaign.blockchain_network,
    }


@router.get("", response_model=list[dict])
def list_campaigns(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
) -> list[dict[str, Any]]:
    rows = (
        db.query(Campaign)
        .filter(Campaign.user_id == current_user_id)
        .order_by(Campaign.id.desc())
        .all()
    )
    return [_campaign_to_dict(c) for c in rows]


@router.get("/{campaign_id}", response_model=dict)
def get_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
) -> dict[str, Any]:
    c = (
        db.query(Campaign)
        .filter(
            Campaign.id == campaign_id,
            Campaign.user_id == current_user_id,
        )
        .first()
    )
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return _campaign_to_dict(c)


@router.post("/{campaign_id}/verify-integrity", response_model=dict)
def verify_integrity(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id),
) -> dict[str, Any]:
    c = (
        db.query(Campaign)
        .filter(
            Campaign.id == campaign_id,
            Campaign.user_id == current_user_id,
        )
        .first()
    )
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign_service.verify_campaign_integrity(c)
