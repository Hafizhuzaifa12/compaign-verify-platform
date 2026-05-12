"""Campaign endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user
from app.models.campaign import Campaign, CampaignCreate
from app.models.user import User
from app.services.campaign_service import campaign_service

router = APIRouter()


@router.get("", response_model=list[Campaign])
def list_campaigns(current_user: User = Depends(get_current_user)) -> list[Campaign]:
    return campaign_service.list_for_user(current_user.id)


@router.post("", response_model=Campaign, status_code=status.HTTP_201_CREATED)
async def submit_campaign(
    payload: CampaignCreate,
    current_user: User = Depends(get_current_user),
) -> Campaign:
    return await campaign_service.submit(payload, current_user.id)


@router.get("/{campaign_id}", response_model=Campaign)
def get_campaign(
    campaign_id: str,
    current_user: User = Depends(get_current_user),
) -> Campaign:
    campaign = campaign_service.get(campaign_id)
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found"
        )
    if campaign.submitted_by != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )
    return campaign
