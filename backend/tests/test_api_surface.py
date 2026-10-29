"""The public API must not expose supplier scoring or the legacy /recommend routes."""

from __future__ import annotations

SCORE_FIELDS = (
    "ecoScore", "trustScore", "costScore", "totalScore",
    "eco_score", "trust_score", "cost_score", "total_score",
)


def test_openapi_has_no_scoring_fields(static_client):
    text = static_client.get("/openapi.json").text
    assert not [field for field in SCORE_FIELDS if field in text]


def test_recommend_routes_are_gone(static_client):
    paths = static_client.get("/openapi.json").json()["paths"]
    assert not [path for path in paths if "recommend" in path]


def test_criteria_route_still_resolves(client):
    # Declared above GET /{event_id}; below it, "criteria" would be read as an event id.
    assert client.get("/api/v1/events/criteria").status_code == 200


def test_checklist_patch_still_works(client):
    event_id = client.post("/api/v1/events", json={"title": "T"}).json()["id"]
    assert client.post(f"/api/v1/events/{event_id}/analyze").status_code == 200
    response = client.patch(f"/api/v1/events/{event_id}/checklist", json={"items": []})
    assert response.status_code == 200
    assert response.json()["eventId"] == event_id
    # An unanalysed event answers 409. An unknown item also answers 409 today: KeyError is a
    # LookupError, so the endpoint's LookupError handler wins over its KeyError one.
    fresh = client.post("/api/v1/events", json={"title": "U"}).json()["id"]
    assert client.patch(f"/api/v1/events/{fresh}/checklist", json={"items": []}).status_code == 409
    bad = client.patch(f"/api/v1/events/{event_id}/checklist", json={"items": [{"id": "nope"}]})
    assert bad.status_code == 409
