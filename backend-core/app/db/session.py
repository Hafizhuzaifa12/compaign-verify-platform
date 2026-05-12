"""SQLAlchemy engine + session factory — PostgreSQL only.

Synchronous SQLAlchemy 2.0. psycopg2 calls are short and the GIL releases on
I/O so they're fine inside FastAPI route handlers. For background work (the
AI orchestrator) we wrap DB calls in `asyncio.to_thread`.
"""

from __future__ import annotations

import logging

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

logger = logging.getLogger(__name__)

_url = settings.DATABASE_URL

if not _url.startswith(("postgresql://", "postgresql+psycopg2://")):
    raise RuntimeError(
        f"DATABASE_URL must be a PostgreSQL URL "
        f"(postgresql://user:password@host:port/dbname). Got: {_url!r}"
    )

engine = create_engine(
    _url,
    pool_pre_ping=True,
    future=True,
)

SessionLocal = sessionmaker(
    bind=engine, autoflush=False, autocommit=False, future=True
)


def get_db() -> Session:
    """FastAPI dependency: yields a session, closes it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def session_scope() -> Session:
    """For non-request code paths (e.g. background tasks). Caller closes."""
    return SessionLocal()
