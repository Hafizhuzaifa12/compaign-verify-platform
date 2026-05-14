"""SQLAlchemy ORM models — the storage shape for users and campaigns."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, Text, func, JSON
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class UserRecord(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    organization: Mapped[str | None] = mapped_column(String(120), nullable=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="submitter")
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class CampaignRecord(Base):
    __tablename__ = "campaigns"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    brand: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    media_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(30), nullable=False, default="marketing")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending", index=True)
    authenticity_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    deepfake_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    ai_indicators: Mapped[list | None] = mapped_column(JSON, nullable=True)
    ml_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    rule_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    blockchain_tx: Mapped[str | None] = mapped_column(String(80), nullable=True)
    blockchain_block: Mapped[int | None] = mapped_column(Integer, nullable=True)
    submitted_by: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


def init_db() -> None:
    """Create tables if they don't exist. For demo use only — for production
    migrations use Alembic."""
    from app.db.session import engine

    Base.metadata.create_all(bind=engine)
