"""Auth endpoints: register & login."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.core.security import create_access_token
from app.models.user import AuthResponse, UserCreate, UserLogin
from app.services.auth_service import auth_service

router = APIRouter()


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(payload: UserCreate) -> AuthResponse:
    try:
        user = auth_service.register(payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(exc)
        ) from exc

    token = create_access_token(subject=user.id, extra_claims={"role": user.role})
    return AuthResponse(access_token=token, user=user)


@router.post("/login", response_model=AuthResponse)
def login(payload: UserLogin) -> AuthResponse:
    user = auth_service.authenticate(payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(subject=user.id, extra_claims={"role": user.role})
    return AuthResponse(access_token=token, user=user)
