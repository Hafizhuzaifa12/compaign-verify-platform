"""Security primitive tests."""

from __future__ import annotations

import pytest

from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_password_round_trip() -> None:
    h = hash_password("correct horse battery staple")
    assert h != "correct horse battery staple"
    assert verify_password("correct horse battery staple", h)
    assert not verify_password("wrong", h)


def test_jwt_round_trip_carries_claims() -> None:
    token = create_access_token("usr_abc", extra_claims={"role": "admin"})
    payload = decode_access_token(token)
    assert payload["sub"] == "usr_abc"
    assert payload["role"] == "admin"
    assert "exp" in payload


def test_jwt_rejects_garbage() -> None:
    with pytest.raises(ValueError):
        decode_access_token("not-a-token")
