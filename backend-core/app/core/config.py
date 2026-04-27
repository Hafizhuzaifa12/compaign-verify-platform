from pathlib import Path

from pydantic import BaseModel


def _load_env_file() -> dict[str, str]:
    env_path = Path(__file__).resolve().parents[2] / ".env"
    values: dict[str, str] = {}

    if not env_path.exists():
        return values

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        normalized = value.strip().strip('"').strip("'")
        values[key.strip()] = normalized

    return values


class Settings(BaseModel):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_minutes: int = 60 * 24 * 7
    otp_expire_minutes: int = 10
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    from_email: str = ""
    ai_predict_url: str = "http://127.0.0.1:8001/predict"


def get_settings() -> Settings:
    env = _load_env_file()
    return Settings(
        database_url=env.get(
            "DATABASE_URL",
            "postgresql://postgres:yourpassword@localhost:5432/yourdbname",
        ),
        secret_key=env.get("SECRET_KEY", "replace-with-real-secret-key"),
        algorithm=env.get("ALGORITHM", "HS256"),
        access_token_expire_minutes=int(env.get("ACCESS_TOKEN_EXPIRE_MINUTES", "30")),
        refresh_token_expire_minutes=int(
            env.get("REFRESH_TOKEN_EXPIRE_MINUTES", str(60 * 24 * 7))
        ),
        otp_expire_minutes=int(env.get("OTP_EXPIRE_MINUTES", "10")),
        smtp_server=env.get("SMTP_SERVER", "smtp.gmail.com"),
        smtp_port=int(env.get("SMTP_PORT", "587")),
        smtp_username=env.get("SMTP_USERNAME", ""),
        smtp_password=env.get("SMTP_PASSWORD", ""),
        from_email=env.get("FROM_EMAIL", ""),
        ai_predict_url=env.get("AI_PREDICT_URL", "http://127.0.0.1:8001/predict"),
    )


settings = get_settings()
