"""Auth endpoint tests."""

from __future__ import annotations

from fastapi.testclient import TestClient


def _register(client: TestClient, email: str = "ada@example.com") -> dict:
    res = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "secret-password",
            "full_name": "Ada Lovelace",
            "organization": "Acme",
        },
    )
    assert res.status_code == 201, res.text
    return res.json()


def test_register_returns_token_and_user(client: TestClient) -> None:
    body = _register(client)
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["email"] == "ada@example.com"
    assert body["user"]["role"] == "submitter"


def test_duplicate_email_rejected(client: TestClient) -> None:
    _register(client)
    res = client.post(
        "/api/v1/auth/register",
        json={
            "email": "ada@example.com",
            "password": "secret-password",
            "full_name": "Ada Lovelace",
        },
    )
    assert res.status_code == 409


def test_login_round_trip(client: TestClient) -> None:
    _register(client)
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "ada@example.com", "password": "secret-password"},
    )
    assert res.status_code == 200
    token = res.json()["access_token"]

    me = client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert me.status_code == 200
    assert me.json()["email"] == "ada@example.com"


def test_login_rejects_bad_password(client: TestClient) -> None:
    _register(client)
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "ada@example.com", "password": "wrong"},
    )
    assert res.status_code == 401


def test_me_requires_token(client: TestClient) -> None:
    res = client.get("/api/v1/users/me")
    assert res.status_code == 401
