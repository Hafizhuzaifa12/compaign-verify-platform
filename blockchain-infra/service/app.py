import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock

from fastapi import FastAPI
from pydantic import BaseModel, Field, field_validator

LEDGER_FILE = Path(os.environ.get("LEDGER_FILE", "/data/ledger.json"))
BLOCKCHAIN_NETWORK = os.environ.get("BLOCKCHAIN_NETWORK", "simulated-local")
EXPLORER_TX_BASE = os.environ.get("EXPLORER_TX_BASE", "").strip()
TX_SALT = os.environ.get("TX_SALT", "local-dev-salt")

_lock = Lock()


def _ensure_parent_dir() -> None:
    LEDGER_FILE.parent.mkdir(parents=True, exist_ok=True)


def _read_ledger() -> dict[str, dict]:
    _ensure_parent_dir()
    if not LEDGER_FILE.exists():
        return {}
    raw = LEDGER_FILE.read_text(encoding="utf-8").strip()
    if not raw:
        return {}
    data = json.loads(raw)
    if not isinstance(data, dict):
        return {}
    return data


def _write_ledger(data: dict[str, dict]) -> None:
    _ensure_parent_dir()
    LEDGER_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")


def _generate_tx_hash(campaign_id: int, content_hash: str, ts: str) -> str:
    digest = hashlib.sha256(
        f"{campaign_id}|{content_hash}|{ts}|{TX_SALT}".encode("utf-8")
    ).hexdigest()
    return f"0x{digest}"


class StoreRecordRequest(BaseModel):
    campaign_id: int = Field(gt=0)
    content_hash: str = Field(min_length=64, max_length=64)

    @field_validator("content_hash")
    @classmethod
    def validate_hash_hex(cls, value: str) -> str:
        normalized = value.lower().strip()
        if len(normalized) != 64 or any(ch not in "0123456789abcdef" for ch in normalized):
            raise ValueError("content_hash must be a 64-char SHA-256 hex string")
        return normalized


class VerifyRecordRequest(BaseModel):
    campaign_id: int = Field(gt=0)
    content_hash: str = Field(min_length=64, max_length=64)

    @field_validator("content_hash")
    @classmethod
    def validate_hash_hex(cls, value: str) -> str:
        normalized = value.lower().strip()
        if len(normalized) != 64 or any(ch not in "0123456789abcdef" for ch in normalized):
            raise ValueError("content_hash must be a 64-char SHA-256 hex string")
        return normalized


app = FastAPI(title="Campaign Blockchain Bridge", version="1.0.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy", "network": BLOCKCHAIN_NETWORK}


@app.post("/v1/records/store")
def store_record(body: StoreRecordRequest) -> dict[str, str]:
    ts = datetime.now(timezone.utc).isoformat()
    tx_hash = _generate_tx_hash(body.campaign_id, body.content_hash, ts)
    key = str(body.campaign_id)

    with _lock:
        ledger = _read_ledger()
        ledger[key] = {
            "campaign_id": body.campaign_id,
            "content_hash": body.content_hash,
            "tx_hash": tx_hash,
            "network": BLOCKCHAIN_NETWORK,
            "stored_at": ts,
        }
        _write_ledger(ledger)

    verification_url = f"{EXPLORER_TX_BASE}{tx_hash}" if EXPLORER_TX_BASE else ""
    return {
        "tx_hash": tx_hash,
        "network": BLOCKCHAIN_NETWORK,
        "stored_at": ts,
        "verification_url": verification_url,
    }


@app.post("/v1/records/verify")
def verify_record(body: VerifyRecordRequest) -> dict[str, str | bool]:
    with _lock:
        ledger = _read_ledger()
        record = ledger.get(str(body.campaign_id))

    if not record:
        return {
            "has_record": False,
            "is_match": False,
            "network": BLOCKCHAIN_NETWORK,
            "stored_hash": "",
        }

    stored_hash = str(record.get("content_hash") or "").lower()
    return {
        "has_record": True,
        "is_match": stored_hash == body.content_hash,
        "network": str(record.get("network") or BLOCKCHAIN_NETWORK),
        "stored_hash": stored_hash,
        "tx_hash": str(record.get("tx_hash") or ""),
    }
