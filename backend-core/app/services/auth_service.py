"""DB-backed auth service.

Persists users in Postgres (or any SQLAlchemy-supported DB via DATABASE_URL).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select

from app.core.security import hash_password, verify_password
from app.db.base import UserRecord
from app.db.session import session_scope
from app.models.user import User, UserCreate, UserInDB


class AuthService:
    # ----- queries -----

    def get_user_by_id(self, user_id: str) -> User | None:
        with session_scope() as db:
            rec = db.get(UserRecord, user_id)
            return self._to_public(rec) if rec else None

    def get_user_by_email(self, email: str) -> UserInDB | None:
        with session_scope() as db:
            rec = db.execute(
                select(UserRecord).where(UserRecord.email == email.lower())
            ).scalar_one_or_none()
            return self._to_indb(rec) if rec else None

    # ----- commands -----

    def register(self, payload: UserCreate) -> User:
        email = payload.email.lower()
        with session_scope() as db:
            existing = db.execute(
                select(UserRecord.id).where(UserRecord.email == email)
            ).scalar_one_or_none()
            if existing:
                raise ValueError("Email is already registered")

            rec = UserRecord(
                id=f"usr_{uuid.uuid4().hex[:12]}",
                email=email,
                full_name=payload.full_name,
                organization=payload.organization,
                role="submitter",
                hashed_password=hash_password(payload.password),
                created_at=datetime.now(timezone.utc),
            )
            db.add(rec)
            db.commit()
            db.refresh(rec)
            return self._to_public(rec)

    def authenticate(self, email: str, password: str) -> User | None:
        record = self.get_user_by_email(email)
        if not record:
            return None
        if not verify_password(password, record.hashed_password):
            return None
        return User(
            id=record.id,
            email=record.email,
            full_name=record.full_name,
            organization=record.organization,
            role=record.role,
            created_at=record.created_at,
        )

    # ----- helpers -----

    @staticmethod
    def _to_public(rec: UserRecord) -> User:
        return User(
            id=rec.id,
            email=rec.email,
            full_name=rec.full_name,
            organization=rec.organization,
            role=rec.role,  # type: ignore[arg-type]
            created_at=rec.created_at,
        )

    @staticmethod
    def _to_indb(rec: UserRecord) -> UserInDB:
        return UserInDB(
            id=rec.id,
            email=rec.email,
            full_name=rec.full_name,
            organization=rec.organization,
            role=rec.role,  # type: ignore[arg-type]
            created_at=rec.created_at,
            hashed_password=rec.hashed_password,
        )


auth_service = AuthService()
