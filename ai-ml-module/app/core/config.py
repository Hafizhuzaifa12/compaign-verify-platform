import os


class Settings:
    PROJECT_NAME = "AI-Powered Secure Campaign API"
    VERSION = "2.0.0"

    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    MODEL_PATH = os.environ.get("MODEL_PATH", os.path.join(BASE_DIR, "training", "model.pkl"))
    VECTORIZER_PATH = os.environ.get("VECTORIZER_PATH", os.path.join(BASE_DIR, "training", "vectorizer.pkl"))

    CONFIDENCE_THRESHOLD = float(os.environ.get("CONFIDENCE_THRESHOLD", "0.70"))
    HIGH_CONFIDENCE_OVERRIDE = float(os.environ.get("HIGH_CONFIDENCE_OVERRIDE", "0.80"))
    SUSPICIOUS_THRESHOLD = float(os.environ.get("SUSPICIOUS_THRESHOLD", "0.40"))

    ML_WEIGHT = float(os.environ.get("ML_WEIGHT", "0.45"))
    RULE_WEIGHT = float(os.environ.get("RULE_WEIGHT", "0.55"))

    MAX_BATCH_SIZE = int(os.environ.get("MAX_BATCH_SIZE", "50"))
    MAX_INPUT_LENGTH = int(os.environ.get("MAX_INPUT_LENGTH", "10000"))

    LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")
    API_PORT = int(os.environ.get("API_PORT", "8001"))


settings = Settings()
