import logging
from dataclasses import dataclass, field
from app.models.load_model import get_model
from app.core.tokenizer import clean_text_for_vectorizer, extract_raw_signals
from app.core.features import compute_rule_score
from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class PredictionResult:
    label: str
    confidence: float
    final_score: float
    ml_phishing_score: float
    rule_score: float
    indicators: list = field(default_factory=list)
    is_fallback: bool = False


def _get_ml_phishing_score(model, vectorizer, text: str):
    """Run ML inference and return the phishing-class probability."""
    try:
        cleaned = clean_text_for_vectorizer(text)
        if not cleaned.strip():
            logger.warning("Cleaned text is empty — skipping ML prediction")
            return None
        vectorized = vectorizer.transform([cleaned])
        probabilities = model.predict_proba(vectorized)[0]
        classes = list(model.classes_)
        if "Phishing" in classes:
            phishing_idx = classes.index("Phishing")
        else:
            phishing_idx = 0
            logger.warning("'Phishing' class not in model classes: %s", classes)
        return float(probabilities[phishing_idx])
    except Exception as e:
        logger.error("ML prediction failed: %s", e)
        return None


def _merge_scores(ml_score, rule_score):
    """Blend ML and rule scores using configured weights."""
    if ml_score is None:
        return rule_score

    if max(ml_score, rule_score) >= settings.HIGH_CONFIDENCE_OVERRIDE:
        return max(ml_score, rule_score)

    return settings.ML_WEIGHT * ml_score + settings.RULE_WEIGHT * rule_score


def _score_to_label(score: float) -> str:
    if score >= settings.CONFIDENCE_THRESHOLD:
        return "High Risk"
    if score >= settings.SUSPICIOUS_THRESHOLD:
        return "Suspicious"
    return "Safe"


def get_prediction(text: str) -> PredictionResult:
    """Run the full hybrid prediction pipeline on raw text."""
    signals = extract_raw_signals(text)
    rule_score, indicators = compute_rule_score(signals)

    model, vectorizer = get_model()
    ml_phishing_score = None
    is_fallback = True

    if model is not None and vectorizer is not None:
        ml_phishing_score = _get_ml_phishing_score(model, vectorizer, text)
        if ml_phishing_score is not None:
            is_fallback = False

    final_score = _merge_scores(ml_phishing_score, rule_score)
    label = _score_to_label(final_score)

    return PredictionResult(
        label=label,
        confidence=round(final_score, 4),
        final_score=round(final_score, 4),
        ml_phishing_score=round(ml_phishing_score, 4) if ml_phishing_score is not None else None,
        rule_score=round(rule_score, 4),
        indicators=indicators,
        is_fallback=is_fallback,
    )
