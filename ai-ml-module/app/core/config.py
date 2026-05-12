"""AI/ML service configuration."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    service_name: str = "verit-ai"
    version: str = "0.1.0"

    # Path to the (placeholder) trained model artifact.
    model_path: Path = Path(__file__).resolve().parents[2] / "training" / "model.bin"

    # Score thresholds used for status assignment.
    authenticity_verified_threshold: float = 90.0
    deepfake_risk_threshold: float = 15.0


settings = Settings()
