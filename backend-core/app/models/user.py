"""Pydantic models for users."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

UserRole = Literal["admin", "verifier", "submitter"]


class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=120)
    organization: str | None = None


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(UserBase):
    id: str
    role: UserRole = "submitter"
    created_at: datetime


class UserInDB(User):
    hashed_password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: User
