"""SQLAlchemy engine + session factory — PostgreSQL.

Synchronous SQLAlchemy 2.0. psycopg2 calls are short and the GIL releases on
I/O so they're fine inside FastAPI route handlers. For background work (the
AI orchestrator) we wrap DB calls in ``asyncio.to_thread``.
"""

from __future__ import annotations

import logging
from contextlib import contextmanager
from typing import Generator

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


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: yields a session, closes it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def session_scope() -> Generator[Session, None, None]:
    """Context manager for non-request code paths (background tasks, seeding).

    Usage::

        with session_scope() as db:
            db.add(record)
            db.commit()
    """
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
