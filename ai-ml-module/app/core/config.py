import os

class Settings:
    PROJECT_NAME: str = "AI-Powered Secure Campaign API"
    # Using absolute paths to prevent Docker breakages
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    MODEL_PATH: str = os.path.join(BASE_DIR, "training", "model.pkl")
    VECTORIZER_PATH: str = os.path.join(BASE_DIR, "training", "vectorizer.pkl")

settings = Settings()
