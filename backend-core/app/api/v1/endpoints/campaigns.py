from fastapi import APIRouter, BackgroundTasks, Depends, status
from pydantic import BaseModel, ConfigDict, field_validator
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.db.session import get_db, SessionLocal
from app.models.campaign import Campaign
from app.services import campaign_service

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


def _run_analysis_job(campaign_id: int, content: str) -> None:
    db = SessionLocal()
    try:
        campaign_service.analyze_campaign_content(db, campaign_id, content)
    finally:
        db.close()


class CampaignCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str
    type: str
    content: str
    url: str = ""

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
    }
