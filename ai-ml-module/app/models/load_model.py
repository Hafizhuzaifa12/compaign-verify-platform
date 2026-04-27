import joblib
import logging
import threading
import os
from app.core.config import settings

logger = logging.getLogger(__name__)

_model = None
_vectorizer = None
_lock = threading.Lock()
_loaded = False


def _validate_model(model, vectorizer):
    if not hasattr(model, 'predict'):
        raise ValueError("Model missing predict method")
    if not hasattr(model, 'predict_proba'):
        raise ValueError("Model missing predict_proba method")
    if not hasattr(model, 'classes_'):
        raise ValueError("Model missing classes_ attribute")
    if not hasattr(vectorizer, 'transform'):
        raise ValueError("Vectorizer missing transform method")


def load_trained_artifacts():
    global _model, _vectorizer, _loaded
    with _lock:
        if not os.path.exists(settings.MODEL_PATH):
            logger.warning("Model file not found: %s", settings.MODEL_PATH)
            _model, _vectorizer, _loaded = None, None, False
            return None, None

        if not os.path.exists(settings.VECTORIZER_PATH):
            logger.warning("Vectorizer file not found: %s", settings.VECTORIZER_PATH)
            _model, _vectorizer, _loaded = None, None, False
            return None, None

        try:
            model = joblib.load(settings.MODEL_PATH)
            vectorizer = joblib.load(settings.VECTORIZER_PATH)
            _validate_model(model, vectorizer)
            _model = model
            _vectorizer = vectorizer
            _loaded = True
            logger.info("Model loaded | classes=%s", list(model.classes_))
            return model, vectorizer
        except FileNotFoundError as e:
            logger.error("File not found: %s", e)
        except ValueError as e:
            logger.error("Validation failed: %s", e)
        except Exception as e:
            logger.error("Load error: %s: %s", type(e).__name__, e)

        _model, _vectorizer, _loaded = None, None, False
        return None, None


def get_model():
    if not _loaded:
        load_trained_artifacts()
    return _model, _vectorizer


def reload_model():
    global _loaded
    _loaded = False
    return load_trained_artifacts()


def is_model_loaded():
    return _loaded
