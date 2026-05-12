"""Shared pytest fixtures."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.services.auth_service import AuthService
from app.services.campaign_service import CampaignService
import app.services.auth_service as auth_mod
import app.services.campaign_service as cmp_mod
from main import app


@pytest.fixture(autouse=True)
def _reset_state():
    """Isolate in-memory state between tests."""
    auth_mod.auth_service = AuthService()
    cmp_mod.campaign_service = CampaignService()
    yield


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)
