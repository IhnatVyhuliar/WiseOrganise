"""Shared fixtures: a TestClient against a real PostgreSQL database."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from app.repositories import event_repo


@pytest.fixture(autouse=True)
def _deterministic_ai(monkeypatch):
    """Force mock AI, whatever the ambient environment holds.

    Settings read GEMINI_API_KEY and USE_MOCK_AI from the environment, so a
    developer shell or a container carrying a real key silently flipped
    ``gemini_enabled`` on and made tests either fail or spend live API calls.
    Tests that exercise the Gemini path opt in by patching this back off.
    """

    monkeypatch.setattr(settings, "use_mock_ai", True)


@pytest.fixture(scope="session")
def _database():
    """Open the pool and create the schema.

    Not autouse and never a skip: the static product-constraint guards
    (test_api_surface, test_no_pilot_references) must keep running where no
    database exists, and an unreachable database must fail the run rather than
    turn the whole suite green with skips.
    """

    try:
        event_repo.init_schema()
    except Exception as exc:  # noqa: BLE001 - any connection failure fails the run
        raise RuntimeError(f"PostgreSQL is not reachable at {settings.database_url}: {exc}") from exc
    yield
    event_repo.reset_pool()


@pytest.fixture()
def client(_database):
    """Provide a client against an empty events table."""

    with event_repo.connection() as conn:
        conn.execute("TRUNCATE events")
    # No ``with`` block: the lifespan does not run, init_schema() above opened the pool.
    return TestClient(app)


@pytest.fixture()
def static_client():
    """A client for checks that only read the schema, so they also run without a database."""

    return TestClient(app)
