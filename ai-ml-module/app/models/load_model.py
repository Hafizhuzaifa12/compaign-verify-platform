import logging
import os
import joblib
from app.core.config import settings

logger = logging.getLogger(__name__)

_model = None
_vectorizer = None


def _load():
    global _model, _vectorizer
    if not os.path.exists(settings.MODEL_PATH):
        logger.error("Model file missing: %s", settings.MODEL_PATH)
        return
    if not os.path.exists(settings.VECTORIZER_PATH):
        logger.error("Vectorizer file missing: %s", settings.VECTORIZER_PATH)
        return
    try:
        _model = joblib.load(settings.MODEL_PATH)
        _vectorizer = joblib.load(settings.VECTORIZER_PATH)
        logger.info("Model and vectorizer loaded from %s", settings.BASE_DIR)
    except Exception as exc:
        logger.exception("Failed to load artifacts: %s", exc)
        _model = None
        _vectorizer = None


_load()


def get_model():
    return _model


def get_vectorizer():
    return _vectorizer


def reload_model():
    _load()
    return _model is not None and _vectorizer is not None
