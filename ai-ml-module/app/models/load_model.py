"""Model loading.

In production this restores a PyTorch checkpoint. For the scaffold we
load a tiny scikit-learn-style serialised dict so the service runs in a
slim container without GPU dependencies.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class Model:
    name: str
    version: str
    weights: dict[str, float]


_FALLBACK_WEIGHTS = {
    "length_norm": 0.18,
    "red_flag_penalty": -7.5,
    "vocab_coverage_bonus": 12.0,
    "bias": 86.0,
}


@lru_cache(maxsize=1)
def load_model() -> Model:
    path: Path = settings.model_path
    if path.exists():
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            return Model(
                name=payload.get("name", "verit-authenticity"),
                version=payload.get("version", "0.1.0"),
                weights={**_FALLBACK_WEIGHTS, **payload.get("weights", {})},
            )
        except (OSError, json.JSONDecodeError) as exc:
            logger.warning("Failed to load model from %s: %s — using fallback", path, exc)
    else:
        logger.info("No trained model at %s — using fallback weights", path)

    return Model(
        name="verit-authenticity-fallback",
        version="0.1.0-fallback",
        weights=dict(_FALLBACK_WEIGHTS),
    )
