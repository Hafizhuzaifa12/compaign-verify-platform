"""Application settings, loaded from environment variables."""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "Verit"
    VERSION: str = "0.1.0"

    API_V1_PREFIX: str = "/api/v1"

    SECRET_KEY: str = Field(
        default="change-me-in-production",
        description="Symmetric secret used to sign JWTs.",
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    AI_SERVICE_URL: str = "http://localhost:8001"
    BLOCKCHAIN_RPC_URL: str = "http://localhost:8545"
    REGISTRY_CONTRACT_ADDRESS: str = ""

    DATABASE_URL: str = Field(
        ...,
        description="PostgreSQL connection string. Required — format: postgresql://user:password@host:port/dbname",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
