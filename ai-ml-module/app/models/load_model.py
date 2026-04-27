import joblib
import os
from app.core.config import settings

def load_trained_artifacts():
    if not os.path.exists(settings.MODEL_PATH):
        return None, None
    try:
        model = joblib.load(settings.MODEL_PATH)
        vectorizer = joblib.load(settings.VECTORIZER_PATH)
        return model, vectorizer
    except:
        return None, None

model, vectorizer = load_trained_artifacts()
