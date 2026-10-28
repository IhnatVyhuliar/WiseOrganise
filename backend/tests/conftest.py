"""Shared fixtures: a TestClient against a real PostgreSQL database."""

from __future__ import annotations

from urllib.parse import urlsplit, urlunsplit

import psycopg
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


_TEST_DB_SUFFIX = "_test"


def _test_database_url(url: str) -> str:
    """Return ``url`` pointed at a dedicated test database on the same server.

    The ``client`` fixture truncates ``events`` before every test, so running
    the suite against the application's own database destroys real data. That
    is not hypothetical: the documented entry point
    ``docker compose run --rm backend pytest`` reaches the same ``db`` service
    the running stack uses, and it wiped a live event. Redirecting here makes
    every way of invoking the suite safe, rather than relying on the caller to
    remember an override.
    """

    parts = urlsplit(url)
    name = parts.path.lstrip("/")
    if name.endswith(_TEST_DB_SUFFIX):
        return url
    return urlunsplit(parts._replace(path=f"/{name}{_TEST_DB_SUFFIX}"))


def _ensure_database(url: str) -> None:
    """Create the test database if it does not exist yet."""

    parts = urlsplit(url)
    name = parts.path.lstrip("/")
    admin = urlunsplit(parts._replace(path="/postgres"))
    with psycopg.connect(admin, autocommit=True) as conn:
        exists = conn.execute("SELECT 1 FROM pg_database WHERE datname = %s", (name,)).fetchone()
        if not exists:
            conn.execute(f'CREATE DATABASE "{name}"')


@pytest.fixture(scope="session")
def _database():
    """Open the pool and create the schema, against a dedicated test database.

    Not autouse and never a skip: the static product-constraint guards
    (test_api_surface, test_no_pilot_references) must keep running where no
    database exists, and an unreachable database must fail the run rather than
    turn the whole suite green with skips.
    """

    original = settings.database_url
    test_url = _test_database_url(original)
    try:
        _ensure_database(test_url)
    except Exception as exc:  # noqa: BLE001 - any connection failure fails the run
        raise RuntimeError(f"PostgreSQL is not reachable at {original}: {exc}") from exc

    settings.database_url = test_url
    event_repo.reset_pool()
    try:
        event_repo.init_schema()
    except Exception as exc:  # noqa: BLE001 - any connection failure fails the run
        settings.database_url = original
        raise RuntimeError(f"PostgreSQL is not reachable at {test_url}: {exc}") from exc
    yield
    event_repo.reset_pool()
    settings.database_url = original


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
