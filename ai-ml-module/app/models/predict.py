"""Authenticity & deepfake-risk prediction.

The scaffolded scorer is intentionally simple — a transparent set of
heuristics on top of token statistics. Swap `score()` for a real
multimodal model when one is available; the I/O contract stays stable.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

from app.core.tokenizer import tokenizer
from app.models.load_model import Model, load_model


@dataclass
class Prediction:
    authenticity_score: float  # 0–100, higher = more authentic
    deepfake_score: float  # 0–100, higher = more synthetic
    signals: dict[str, float]
    model_name: str
    model_version: str


def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))


def score(text: str, has_media: bool, model: Model | None = None) -> Prediction:
    """Compute authenticity & deepfake-risk for a campaign.

    Args:
        text: Concatenation of campaign title + description.
        has_media: Whether the campaign attached a media URL.
        model: Optional model handle — `load_model()` is used otherwise.
    """
    mdl = model or load_model()
    w = mdl.weights

    tokens = tokenizer.tokenize(text)
    red_flags = tokenizer.count_red_flags(text)
    coverage = tokenizer.vocab_coverage(tokens)

    length_signal = math.log1p(len(tokens)) * w["length_norm"]

    authenticity = (
        w["bias"]
        + w["red_flag_penalty"] * red_flags
        + w["vocab_coverage_bonus"] * (coverage - 0.5)
        + length_signal
    )
    if has_media:
        authenticity += 2.5

    authenticity = _clamp(authenticity)

    # Deepfake risk is the inverse residual, modulated by red-flag count.
    deepfake = _clamp((100.0 - authenticity) * 0.35 + red_flags * 1.8)

    signals = {
        "tokens": float(len(tokens)),
        "red_flags": float(red_flags),
        "vocab_coverage": round(coverage, 3),
        "has_media": float(has_media),
    }

    return Prediction(
        authenticity_score=round(authenticity, 1),
        deepfake_score=round(deepfake, 1),
        signals=signals,
        model_name=mdl.name,
        model_version=mdl.version,
    )
