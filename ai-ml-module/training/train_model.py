"""Demo training script.

Reads `dataset.csv`, fits a tiny logistic regression on token statistics,
and persists the learned weights as JSON so the inference service can
load them without PyTorch.

Run:
    python train_model.py
"""

from __future__ import annotations

import csv
import json
import math
from pathlib import Path
from statistics import mean

from app.core.tokenizer import tokenizer  # type: ignore[import-not-found]

DATA_PATH = Path(__file__).resolve().parent / "dataset.csv"
OUT_PATH = Path(__file__).resolve().parent / "model.bin"


def _feature_row(text: str, has_media: bool) -> dict[str, float]:
    tokens = tokenizer.tokenize(text)
    return {
        "length_norm": math.log1p(len(tokens)),
        "red_flag_penalty": float(tokenizer.count_red_flags(text)),
        "vocab_coverage_bonus": tokenizer.vocab_coverage(tokens) - 0.5,
        "media_bonus": 1.0 if has_media else 0.0,
    }


def train() -> dict[str, float]:
    with DATA_PATH.open(newline="", encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))

    features = [
        _feature_row(f"{r['title']}. {r['description']}", r["has_media"] == "1")
        for r in rows
    ]
    targets = [float(r["authenticity_score"]) for r in rows]

    # Closed-form approximation: for each feature, weight ~ correlation × scale.
    weights: dict[str, float] = {}
    for key in features[0]:
        xs = [f[key] for f in features]
        x_mean = mean(xs)
        y_mean = mean(targets)
        num = sum((x - x_mean) * (y - y_mean) for x, y in zip(xs, targets))
        den = sum((x - x_mean) ** 2 for x in xs) or 1.0
        weights[key] = round(num / den, 4)

    weights["bias"] = round(mean(targets), 2)
    return weights


def main() -> None:
    weights = train()
    payload = {
        "name": "verit-authenticity",
        "version": "0.1.0",
        "weights": weights,
    }
    OUT_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote model artifact → {OUT_PATH}")
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
