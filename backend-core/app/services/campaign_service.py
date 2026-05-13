"""DB-backed campaign service.

Owns submission, persistence, AI orchestration, and on-chain attestation
recording. AI scoring is real (HTTP to ai-ml-module); blockchain anchoring
is still simulated locally for now.
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
import random
import uuid
from datetime import datetime, timezone
from typing import Iterable

import httpx
from sqlalchemy import select

from app.core.config import settings
from app.db.base import CampaignRecord
from app.db.session import session_scope
from app.models.campaign import Campaign, CampaignCreate

logger = logging.getLogger(__name__)


class CampaignService:
    # ----- queries -----

    def list_for_user(self, user_id: str) -> list[Campaign]:
        with session_scope() as db:
            rows = db.execute(
                select(CampaignRecord)
                .where(CampaignRecord.submitted_by == user_id)
                .order_by(CampaignRecord.submitted_at.desc())
            ).scalars().all()
            return [self._to_pydantic(r) for r in rows]

    def get(self, campaign_id: str) -> Campaign | None:
        with session_scope() as db:
            rec = db.get(CampaignRecord, campaign_id)
            return self._to_pydantic(rec) if rec else None

    # ----- commands -----

    async def submit(self, payload: CampaignCreate, user_id: str) -> Campaign:
        campaign_id = f"cmp_{uuid.uuid4().hex[:8]}"

        def _insert() -> CampaignRecord:
            with session_scope() as db:
                rec = CampaignRecord(
                    id=campaign_id,
                    title=payload.title,
                    brand=payload.brand,
                    description=payload.description,
                    media_url=str(payload.media_url) if payload.media_url else None,
                    category=payload.category,
                    status="analyzing",
                    authenticity_score=0.0,
                    deepfake_score=0.0,
                    submitted_by=user_id,
                    submitted_at=datetime.now(timezone.utc),
                )
                db.add(rec)
                db.commit()
                db.refresh(rec)
                return rec

        rec = await asyncio.to_thread(_insert)
        logger.info("Campaign %s persisted by user %s", campaign_id, user_id)

        # Kick off analysis without blocking the request.
        asyncio.create_task(self._analyze_and_attest(campaign_id))
        return self._to_pydantic(rec)

    # ----- internal -----

    async def _analyze_and_attest(self, campaign_id: str) -> None:
        """Calls the AI/ML service, persists scores + simulated on-chain hash."""
        campaign = await asyncio.to_thread(self._fetch_for_analysis, campaign_id)
        if not campaign:
            return

        try:
            authenticity, deepfake, ai_status = await self._call_ai_service(campaign)
            ai_failed = False
        except Exception as exc:
            logger.warning(
                "AI service call failed for %s: %s — falling back to flagged",
                campaign_id,
                exc,
            )
            # Honest fallback: we couldn't analyze, so mark as flagged
            authenticity = 50.0
            deepfake = 25.0
            ai_status = "flagged"
            ai_failed = True

        tx_hash = "0x" + hashlib.sha256(campaign_id.encode()).hexdigest()
        block = random.randint(18_000_000, 19_000_000)

        def _persist() -> None:
            with session_scope() as db:
                rec = db.get(CampaignRecord, campaign_id)
                if not rec:
                    return
                rec.status = ai_status
                rec.authenticity_score = authenticity
                rec.deepfake_score = deepfake
                rec.blockchain_tx = tx_hash
                rec.blockchain_block = block
                rec.verified_at = datetime.now(timezone.utc)
                db.commit()

        await asyncio.to_thread(_persist)
        logger.info(
            "Campaign %s scored: authenticity=%.1f deepfake=%.1f status=%s ai=%s",
            campaign_id,
            authenticity,
            deepfake,
            ai_status,
            "fallback" if ai_failed else "real",
        )

    def _fetch_for_analysis(self, campaign_id: str) -> Campaign | None:
        return self.get(campaign_id)

    async def _call_ai_service(
        self, campaign: Campaign
    ) -> tuple[float, float, str]:
        """Call the AI phishing-detection service and translate the result.

        The AI module expects ``{"text": "..."}`` and returns a phishing
        analysis.  We convert its 0-1 phishing score into the platform's
        0-100 authenticity / deepfake-risk scores:

        - authenticity = (1 - final_score) * 100
        - deepfake_risk = final_score * 100
        - label mapping: Safe → verified, Suspicious → flagged,
          High Risk → rejected
        """
        url = f"{settings.AI_SERVICE_URL.rstrip('/')}/predict"

        # Combine campaign fields into a single text block for analysis
        text_parts = [campaign.title]
        if campaign.description:
            text_parts.append(campaign.description)
        if campaign.media_url:
            text_parts.append(campaign.media_url)
        combined_text = " | ".join(text_parts)

        payload = {"text": combined_text}
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()

        # Translate phishing score (0-1) → platform scores (0-100)
        final_score = float(data.get("final_score", 0.5))
        authenticity = round((1.0 - final_score) * 100.0, 1)
        deepfake = round(final_score * 100.0, 1)

        # Map AI label → platform status
        label = data.get("label", "Suspicious")
        status_map = {
            "Safe": "verified",
            "Suspicious": "flagged",
            "High Risk": "rejected",
        }
        status = status_map.get(label, "flagged")

        logger.info(
            "AI response for %s: label=%s final_score=%.4f → auth=%.1f df=%.1f status=%s | indicators=%s",
            campaign.id, label, final_score, authenticity, deepfake, status,
            data.get("indicators", []),
        )

        return (authenticity, deepfake, status)

    # ----- maintenance -----

    def seed(self, samples: Iterable[Campaign]) -> None:
        with session_scope() as db:
            for c in samples:
                if db.get(CampaignRecord, c.id):
                    continue
                rec = CampaignRecord(
                    id=c.id,
                    title=c.title,
                    brand=c.brand,
                    description=c.description,
                    media_url=c.media_url,
                    category=c.category,
                    status=c.status,
                    authenticity_score=c.authenticity_score,
                    deepfake_score=c.deepfake_score,
                    blockchain_tx=c.blockchain_tx,
                    blockchain_block=c.blockchain_block,
                    submitted_by=c.submitted_by,
                    submitted_at=c.submitted_at,
                    verified_at=c.verified_at,
                )
                db.add(rec)
            db.commit()

    # ----- helpers -----

    @staticmethod
    def _to_pydantic(rec: CampaignRecord) -> Campaign:
        return Campaign(
            id=rec.id,
            title=rec.title,
            brand=rec.brand,
            description=rec.description,
            media_url=rec.media_url,
            category=rec.category,  # type: ignore[arg-type]
            status=rec.status,  # type: ignore[arg-type]
            authenticity_score=rec.authenticity_score,
            deepfake_score=rec.deepfake_score,
            blockchain_tx=rec.blockchain_tx,
            blockchain_block=rec.blockchain_block,
            submitted_by=rec.submitted_by,
            submitted_at=rec.submitted_at,
            verified_at=rec.verified_at,
        )


campaign_service = CampaignService()
