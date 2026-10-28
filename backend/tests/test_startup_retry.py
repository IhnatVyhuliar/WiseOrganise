"""The startup path must recover when the database is unreachable at first."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from app.repositories import event_repo

DEAD_URL = "postgresql://nobody:nobody@127.0.0.1:1/none"


@pytest.fixture()
def dead_database(_database, monkeypatch):
    good_url = settings.database_url
    monkeypatch.setattr(settings, "db_connect_delay_seconds", 0.1)
    monkeypatch.setattr(settings, "db_connect_retries", 3)
    monkeypatch.setattr(settings, "database_url", DEAD_URL)
    event_repo.reset_pool()
    yield good_url
    monkeypatch.setattr(settings, "database_url", good_url)
    event_repo.reset_pool()
    event_repo.init_schema()


def test_init_schema_can_be_retried_after_a_failed_attempt(dead_database, monkeypatch):
    with pytest.raises(Exception):
        event_repo.init_schema()
    monkeypatch.setattr(settings, "database_url", dead_database)
    event_repo.reset_pool()
    event_repo.init_schema()
    assert event_repo.list_events() is not None


def test_init_schema_rebuilds_the_pool_so_a_second_attempt_is_not_PoolClosed(dead_database):
    for _ in range(2):
        with pytest.raises(Exception) as info:
            event_repo.init_schema()
        assert "PoolClosed" not in type(info.value).__name__


def test_lifespan_retries_until_the_database_comes_back(dead_database, monkeypatch):
    import app.main as main_module

    sleeps = []

    def fake_sleep(seconds):
        sleeps.append(seconds)
        monkeypatch.setattr(settings, "database_url", dead_database)  # database "recovers"

    monkeypatch.setattr(main_module.time, "sleep", fake_sleep)
    with TestClient(app) as started:
        assert started.get("/api/v1/events").status_code == 200
    assert sleeps, "the first attempt should have failed and slept"
