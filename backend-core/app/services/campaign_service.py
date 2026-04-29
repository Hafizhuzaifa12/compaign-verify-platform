import hashlib
import json
import logging
import re
import subprocess
import sys
from pathlib import Path

import requests
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import check_misleading_words, check_suspicious_url
from app.models.campaign import Campaign

logger = logging.getLogger(__name__)

# backend-core -> repo root: app/services/ -> app/ -> backend-core/ -> repo
_REPO_ROOT = Path(__file__).resolve().parents[3]
_INTERACT_SCRIPT = _REPO_ROOT / "blockchain-infra" / "scripts" / "interact.py"


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


def _parse_tx_from_output(stdout: str) -> str:
    if not stdout or not stdout.strip():
        raise ValueError("Empty script output")
    lines = [line.strip() for line in stdout.strip().splitlines() if line.strip()]
    line = lines[-1]
    if re.match(r"^0x[0-9a-fA-F]{64}$", line):
        return line
    if re.match(r"^0x[0-9a-fA-F]+$", line) and 10 <= len(line) <= 128:
        return line
    raise ValueError(f"Unrecognized transaction hash in output: {line!r}")


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


def _run_blockchain_store(campaign_id: int, content_hash_hex: str) -> str:
    if not _INTERACT_SCRIPT.is_file():
        raise FileNotFoundError(f"interact script not found: {_INTERACT_SCRIPT}")
    result = subprocess.run(
        [sys.executable, str(_INTERACT_SCRIPT), str(campaign_id), content_hash_hex],
        capture_output=True,
        text=True,
        timeout=120,
        cwd=str(_REPO_ROOT),
    )
    if result.returncode != 0:
        err = (result.stderr or result.stdout or "").strip()
        raise RuntimeError(f"interact.py failed: {err}")
    return _parse_tx_from_output(result.stdout or "")


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
        response = requests.post(
            settings.ai_predict_url,
            json={"text": content},
            timeout=120,
        )
        response.raise_for_status()
        data = response.json() if response.content else {}
        ai_status = _status_from_ai_response(data)
    except requests.RequestException as exc:
        logger.exception("AI request failed for campaign %s: %s", campaign_id, exc)
        ai_status = "Analysis Failed"

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
        _set_marketing_tips(campaign, content)
        # AI outcome still available in logs; user-facing status is the firewall.
        db.commit()
        return

    campaign.security_warnings = None

    if ai_status != "Safe":
        campaign.status = ai_status
        _set_marketing_tips(campaign, content)
        db.commit()
        return

    # --- AI Safe and security heuristics pass: hash + chain
    content_hash_hex = hashlib.sha256(content.encode("utf-8")).hexdigest()
    campaign.content_hash_sha256 = content_hash_hex

    try:
        tx_hash = _run_blockchain_store(campaign_id, content_hash_hex)
    except (FileNotFoundError, OSError, RuntimeError, ValueError) as exc:
        logger.exception("Blockchain step failed for campaign %s: %s", campaign_id, exc)
        campaign.status = "Blockchain Error"
        _set_marketing_tips(campaign, content)
        db.commit()
        return

    campaign.tx_hash = tx_hash
    campaign.status = "Verified on Blockchain"
    _set_marketing_tips(campaign, content)
    db.commit()
    db.refresh(campaign)
