import hashlib
import json
import logging
import re

import requests
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import check_misleading_words, check_suspicious_url
from app.models.campaign import Campaign

logger = logging.getLogger(__name__)


def _status_from_ai_response(data: dict) -> str:
    """Map AI /predict response to a campaign status."""
    if data.get("error") is True:
        return "Analysis Failed"
    label = str(data.get("label") or "").strip()
    if label == "High Risk":
        return "High Risk"
    if label == "Safe":
        return "Safe"
    if label == "Suspicious":
        return "Suspicious"
    if label:
        return label
    return "Pending"


def _safe_float(value: object, fallback: float = 0.0) -> float:
    try:
        if value is None:
            return fallback
        return float(value)
    except (TypeError, ValueError):
        return fallback


def _link_count(text: str) -> int:
    if not text:
        return 0
    http_links = re.findall(r"https?://[^\s<>\"']+", text, re.IGNORECASE)
    www_links = re.findall(r"(?<![/.])www\.[^\s<>\"']+", text, re.IGNORECASE)
    return len(http_links) + len(www_links)


def _word_count(text: str) -> int:
    if not text or not str(text).strip():
        return 0
    return len(re.findall(r"\b\w+\b", str(text)))


def _set_marketing_tips(campaign: Campaign, content: str) -> None:
    """
    Digital marketing heuristics; stored as JSON array on the campaign.
    """
    tips: list[str] = []
    ct = (campaign.campaign_type or "").lower()
    if "email" in ct and _link_count(content) > 3:
        tips.append("Emails with too many links look spammy. Keep it under 2.")
    if "social" in ct and _word_count(content) > 200:
        tips.append("Social media captions should be concise.")
    campaign.marketing_tips = (
        json.dumps(tips, ensure_ascii=False) if tips else None
    )


def _post_json_with_retries(url: str, payload: dict) -> dict:
    last_error: Exception | None = None
    for attempt in range(settings.service_retry_count + 1):
        try:
            response = requests.post(
                url,
                json=payload,
                timeout=settings.service_timeout_seconds,
            )
            response.raise_for_status()
            return response.json() if response.content else {}
        except requests.RequestException as exc:
            last_error = exc
            logger.warning(
                "Service call failed (%s/%s) url=%s err=%s",
                attempt + 1,
                settings.service_retry_count + 1,
                url,
                exc,
            )
    raise RuntimeError(f"Failed service call for {url}: {last_error}") from last_error


def _run_blockchain_store(campaign_id: int, content_hash_hex: str) -> dict:
    base = settings.blockchain_service_url.rstrip("/")
    return _post_json_with_retries(
        f"{base}/records/store",
        {"campaign_id": campaign_id, "content_hash": content_hash_hex},
    )


def verify_campaign_integrity(campaign: Campaign) -> dict:
    if not campaign.content_hash_sha256:
        return {
            "content_hash_match": False,
            "blockchain_hash_match": False,
            "verification_state": "not_hashed",
        }

    current_hash = hashlib.sha256(campaign.content.encode("utf-8")).hexdigest()
    content_hash_match = current_hash.lower() == campaign.content_hash_sha256.lower()
    blockchain_hash_match = False
    verification_state = "content_hash_only"

    if campaign.tx_hash:
        try:
            base = settings.blockchain_service_url.rstrip("/")
            data = _post_json_with_retries(
                f"{base}/records/verify",
                {"campaign_id": campaign.id, "content_hash": current_hash},
            )
            blockchain_hash_match = bool(data.get("is_match"))
            verification_state = "verified" if blockchain_hash_match else "mismatch"
        except RuntimeError as exc:
            logger.warning("Blockchain verify failed for campaign %s: %s", campaign.id, exc)
            verification_state = "blockchain_unreachable"

    return {
        "content_hash_match": content_hash_match,
        "blockchain_hash_match": blockchain_hash_match,
        "verification_state": verification_state,
        "current_hash_sha256": current_hash,
    }


def analyze_campaign_content(db: Session, campaign_id: int, content: str) -> None:
    """
    1) Call AI module. 2) Run URL + misleading-text checks. 3) If AI Safe and security
    has no issues, hash content, record on chain, and mark Verified.
    """
    campaign = db.get(Campaign, campaign_id)
    if not campaign:
        logger.warning("Campaign %s not found for analysis", campaign_id)
        return

    # --- AI
    data: dict = {}
    try:
        data = _post_json_with_retries(settings.ai_predict_url, {"text": content})
        ai_status = _status_from_ai_response(data)
    except RuntimeError as exc:
        logger.exception("AI request failed for campaign %s: %s", campaign_id, exc)
        ai_status = "Analysis Failed"
        data = {"label": "Unavailable", "confidence": 0.0, "final_score": 1.0}

    risk_score = _safe_float(data.get("final_score"), 0.0)
    ai_confidence = _safe_float(data.get("confidence"), risk_score)
    trust_score = max(0.0, min(1.0, 1.0 - risk_score))
    campaign.ai_label = str(data.get("label") or ai_status)
    campaign.ai_confidence = round(ai_confidence, 4)
    campaign.risk_score = round(risk_score, 4)
    campaign.trust_score = round(trust_score, 4)

    # --- Custom security (after AI)
    warnings: list[str] = []
    url = campaign.url or ""
    if check_suspicious_url(url):
        warnings.append(
            "URL uses a raw IP address, IPv6, or a known link shortener (e.g. bit.ly, tinyurl)"
        )
    warnings.extend(check_misleading_words(content))

    if warnings:
        campaign.status = "Suspicious"
        campaign.security_warnings = json.dumps(warnings, ensure_ascii=False)
        campaign.risk_score = max(campaign.risk_score or 0.0, 0.65)
        campaign.trust_score = round(1.0 - (campaign.risk_score or 0.65), 4)
        _set_marketing_tips(campaign, content)
        # AI outcome still available in logs; user-facing status is the firewall.
        db.commit()
        return

    campaign.security_warnings = None

    if ai_status != "Safe":
        campaign.status = ai_status
        if ai_status == "High Risk":
            campaign.risk_score = max(campaign.risk_score or 0.0, 0.85)
            campaign.trust_score = round(1.0 - (campaign.risk_score or 0.85), 4)
        _set_marketing_tips(campaign, content)
        db.commit()
        return

    # --- AI Safe and security heuristics pass: hash + chain
    content_hash_hex = hashlib.sha256(content.encode("utf-8")).hexdigest()
    campaign.content_hash_sha256 = content_hash_hex

    try:
        blockchain_data = _run_blockchain_store(campaign_id, content_hash_hex)
        tx_hash = str(blockchain_data.get("tx_hash") or "")
        if not tx_hash:
            raise ValueError("Blockchain service did not return tx_hash")
    except (RuntimeError, ValueError) as exc:
        logger.exception("Blockchain step failed for campaign %s: %s", campaign_id, exc)
        campaign.status = "Blockchain Error"
        _set_marketing_tips(campaign, content)
        db.commit()
        return

    campaign.tx_hash = tx_hash
    campaign.blockchain_network = str(blockchain_data.get("network") or "unknown")
    campaign.status = "Verified on Blockchain"
    _set_marketing_tips(campaign, content)
    db.commit()
    db.refresh(campaign)
