import os

class Settings:
    PROJECT_NAME: str = "AI-Powered Secure Campaign API"
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    MODEL_PATH: str = os.path.join(BASE_DIR, "training", "model.pkl")
    VECTORIZER_PATH: str = os.path.join(BASE_DIR, "training", "vectorizer.pkl")

    ML_WEIGHT: float = float(os.getenv("ML_WEIGHT", "0.60"))
    RULE_WEIGHT: float = float(os.getenv("RULE_WEIGHT", "0.40"))

    HIGH_RISK_THRESHOLD: float = float(os.getenv("HIGH_RISK_THRESHOLD", "0.50"))
    SAFE_THRESHOLD: float = float(os.getenv("SAFE_THRESHOLD", "0.25"))

    MAX_INPUT_LENGTH: int = int(os.getenv("MAX_INPUT_LENGTH", "10000"))

settings = Settings()
