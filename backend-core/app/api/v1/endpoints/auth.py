import re
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.email import send_email
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.db.session import get_db
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])
_password_regex = re.compile(r"^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$")
_phone_re = re.compile(r"^\+?[0-9][0-9\s\-]{5,38}$")
_otp_store: dict[str, dict[str, datetime | str]] = {}


class RegisterRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=200)
    phone: str | None = Field(default=None, max_length=40)
    display_name: str | None = Field(default=None, max_length=80)
    bio: str | None = Field(default=None, max_length=500)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        if v is None or v == "":
            return None
        compact = re.sub(r"[\s\-]", "", v)
        if not _phone_re.match(v) or len(compact) < 7:
            raise ValueError("Invalid phone number")
        return v

    @field_validator("display_name")
    @classmethod
    def validate_display_name(cls, v: str | None) -> str | None:
        if v is None or not str(v).strip():
            return None
        return str(v).strip()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str = Field(min_length=8, max_length=128)


def _validate_password_strength(password: str) -> None:
    if not _password_regex.match(password):
        raise HTTPException(
            status_code=400,
            detail="Password must be strong (8+ chars, 1 number, 1 special char)",
        )


def _create_otp() -> str:
    return str(secrets.randbelow(900000) + 100000)


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> dict[str, str]:
    _validate_password_strength(payload.password)
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    if payload.display_name:
        taken = db.query(User).filter(User.display_name == payload.display_name).first()
        if taken:
            raise HTTPException(status_code=400, detail="Display name already taken")

    hashed_password = bcrypt.hashpw(
        payload.password.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")

    bio_val = (payload.bio or "").strip() or None
    user = User(
        email=payload.email,
        hashed_password=hashed_password,
        is_active=True,
        full_name=payload.full_name.strip(),
        phone=payload.phone,
        display_name=payload.display_name,
        bio=bio_val,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(subject=user.email)
    refresh_token = create_refresh_token(subject=user.email)
    return {
        "message": "User registered successfully",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> dict[str, str]:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    is_valid_password = bcrypt.checkpw(
        payload.password.encode("utf-8"), user.hashed_password.encode("utf-8")
    )
    if not is_valid_password:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(subject=user.email)
    refresh_token = create_refresh_token(subject=user.email)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/refresh")
def refresh(payload: RefreshTokenRequest) -> dict[str, str]:
    try:
        decoded = decode_token(payload.refresh_token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    if decoded.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token type")

    email = decoded.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid refresh token payload")

    access_token = create_access_token(subject=email)
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/forgot-password/request-otp")
def request_password_otp(
    payload: ForgotPasswordRequest, db: Session = Depends(get_db)
) -> dict[str, str]:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    otp = _create_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.otp_expire_minutes)
    _otp_store[payload.email] = {"otp": otp, "expires_at": expires_at}

    try:
        send_email(
            to_email=payload.email,
            subject="Your Password Reset OTP",
            body=f"Your OTP is: {otp}\nIt expires in {settings.otp_expire_minutes} minutes.",
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to send OTP email: {exc}") from exc

    return {"message": "OTP sent to your email"}


@router.post("/forgot-password/reset")
def reset_password(
    payload: ResetPasswordRequest, db: Session = Depends(get_db)
) -> dict[str, str]:
    _validate_password_strength(payload.new_password)

    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    otp_entry = _otp_store.get(payload.email)
    if not otp_entry:
        raise HTTPException(status_code=400, detail="OTP not requested for this email")

    otp_value = otp_entry.get("otp")
    expires_at = otp_entry.get("expires_at")
    if otp_value != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if not isinstance(expires_at, datetime) or datetime.now(timezone.utc) > expires_at:
        _otp_store.pop(payload.email, None)
        raise HTTPException(status_code=400, detail="OTP expired")

    user.hashed_password = bcrypt.hashpw(
        payload.new_password.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")
    db.commit()
    _otp_store.pop(payload.email, None)

    return {"message": "Password reset successfully"}
