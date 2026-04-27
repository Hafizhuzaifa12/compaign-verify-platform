import logging

import requests
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.campaign import Campaign

logger = logging.getLogger(__name__)


def _status_from_ai_response(data: dict) -> str:
    """Map AI /predict JSON to a campaign status string."""
    if data.get("error"):
        return "Analysis Failed"
    label = (data.get("label") or "").strip()
    original = (data.get("original_prediction") or "").strip()

    if original == "Phishing" or label == "High Risk" or label == "Phishing":
        return "High Risk"
    if label == "Safe" and original == "Safe":
        return "Safe"
    if label == "Safe":
        return "Safe"
    if label == "Suspicious":
        return "Suspicious"
    return "Pending"


def analyze_campaign_content(db: Session, campaign_id: int, content: str) -> None:
    """
    Call the AI module, then persist the derived status for this campaign.
    """
    campaign = db.get(Campaign, campaign_id)
    if not campaign:
        logger.warning("Campaign %s not found for analysis", campaign_id)
        return

    try:
        response = requests.post(
            settings.ai_predict_url,
            json={"text": content},
            timeout=120,
        )
        response.raise_for_status()
        data = response.json() if response.content else {}
    except requests.RequestException as exc:
        logger.exception("AI request failed for campaign %s: %s", campaign_id, exc)
        campaign.status = "Analysis Failed"
        db.commit()
        return

    campaign.status = _status_from_ai_response(data)
    db.commit()
    db.refresh(campaign)
