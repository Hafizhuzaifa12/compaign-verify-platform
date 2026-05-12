"""User endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/me", response_model=User)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
