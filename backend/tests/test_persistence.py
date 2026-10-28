"""Events must survive a restart and keep their Python shapes after a DB round trip."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app
from app.repositories import event_repo


def test_event_survives_a_restart(client):
    event_id = client.post("/api/v1/events", json={"title": "Test"}).json()["id"]
    event_repo.reset_pool()
    event_repo.init_schema()
    assert TestClient(app).get(f"/api/v1/events/{event_id}").json()["title"] == "Test"


def test_patch_after_a_round_trip_keeps_datetime_comparison_working(client):
    # Stored ISO strings must be revived, or comparing them with a parsed datetime raises.
    event_id = client.post(
        "/api/v1/events",
        json={"title": "T", "startAt": "2026-11-01T09:00:00Z", "endAt": "2026-11-01T17:00:00Z"},
    ).json()["id"]
    assert client.patch(f"/api/v1/events/{event_id}", json={"attendees": 200}).status_code == 200


def test_patch_still_rejects_an_inverted_interval(client):
    event_id = client.post(
        "/api/v1/events",
        json={"title": "T", "startAt": "2026-11-01T09:00:00Z", "endAt": "2026-11-01T17:00:00Z"},
    ).json()["id"]
    response = client.patch(f"/api/v1/events/{event_id}", json={"endAt": "2026-11-01T08:00:00Z"})
    assert response.status_code == 422


def test_delete_event_removes_the_row(client):
    event_id = client.post("/api/v1/events", json={"title": "Test"}).json()["id"]
    assert client.delete(f"/api/v1/events/{event_id}").status_code == 204
    assert client.get(f"/api/v1/events/{event_id}").status_code == 404


def test_list_events_returns_creation_order(client):
    ids = [client.post("/api/v1/events", json={"title": f"E{i}"}).json()["id"] for i in range(3)]
    assert [event["id"] for event in event_repo.list_events()] == ids
