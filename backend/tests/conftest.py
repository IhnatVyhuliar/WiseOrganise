"""Shared fixtures: a TestClient against a real PostgreSQL database."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from app.repositories import event_repo


@pytest.fixture(scope="session", autouse=True)
def _database():
    """Open the pool and create the schema, or skip when no database is reachable."""

    try:
        event_repo.init_schema()
    except Exception as exc:  # noqa: BLE001 - any connection failure means "skip"
        pytest.skip(f"PostgreSQL is not reachable at {settings.database_url}: {exc}")
    yield
    event_repo.reset_pool()


@pytest.fixture()
def client(_database):
    """Provide a client against an empty events table."""

    with event_repo.connection() as conn:
        conn.execute("TRUNCATE events")
    # No ``with`` block: the lifespan does not run, init_schema() above opened the pool.
    return TestClient(app)
