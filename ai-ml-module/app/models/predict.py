import logging
from app.models.load_model import get_model, get_vectorizer
from app.core.tokenizer import clean_input_text
from app.core.features import extract_features, compute_rule_score
from app.core.config import settings

logger = logging.getLogger(__name__)


def get_model_prediction(text: str) -> dict:
    features = extract_features(text)
    rule_score = compute_rule_score(features)

    model = get_model()
    vectorizer = get_vectorizer()

    if model is None or vectorizer is None:
        logger.warning("ML model unavailable, using rule-based scoring only")
        final_score = rule_score
        ml_pred = None
        ml_conf = None
    else:
        cleaned = clean_input_text(text)
        vec = vectorizer.transform([cleaned])
        ml_pred = model.predict(vec)[0]
        proba = model.predict_proba(vec)[0]
        ml_conf = float(max(proba))

        ml_risk = ml_conf if ml_pred == "Phishing" else (1.0 - ml_conf)
        final_score = settings.ML_WEIGHT * ml_risk + settings.RULE_WEIGHT * rule_score

    if final_score >= settings.HIGH_RISK_THRESHOLD:
        label = "High Risk"
    elif final_score <= settings.SAFE_THRESHOLD:
        label = "Safe"
    else:
        label = "Suspicious"

    return {
        "label": label,
        "confidence": round(final_score, 4),
        "ml_prediction": ml_pred,
        "ml_confidence": round(ml_conf, 4) if ml_conf is not None else None,
        "rule_score": round(rule_score, 4),
        "features": features,
    }
