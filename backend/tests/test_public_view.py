"""Slug, share URL, ustalenia and the read-only public event view."""

from __future__ import annotations

from uuid import uuid4

NOT_FOUND = "Nie znaleziono wydarzenia o tym adresie."


def _create(client) -> dict:
    return client.post("/api/v1/events", json={"title": "T"}).json()


def _select(client, event_id: str, selections: list[tuple[str, int]]) -> None:
    payload = {"selections": [{"areaId": area, "level": level} for area, level in selections]}
    assert client.patch(f"/api/v1/events/{event_id}/options", json=payload).status_code == 200


def test_creation_returns_an_eight_char_slug_and_share_url(client):
    body = _create(client)
    assert len(body["slug"]) == 8 and body["slug"].isalnum() and body["slug"].islower()
    assert body["shareUrl"].endswith("/w/" + body["slug"])


def test_slugs_are_unique_across_events(client):
    assert len({_create(client)["slug"] for _ in range(5)}) == 5


def test_ustalenia_follow_canonical_area_order_not_click_order(client):
    event_id = _create(client)["id"]
    # catering (index 2) is selected before dojazd (index 0)
    _select(client, event_id, [("catering", 2), ("dojazd", 3)])
    guide = client.post(f"/api/v1/events/{event_id}/eguide").json()
    assert [u["areaId"] for u in guide["ustalenia"]] == ["dojazd", "catering"]
    first = guide["ustalenia"][0]
    assert set(first) == {"areaId", "areaName", "level", "levelLabel", "justification", "costEffect"}
    assert first["level"] == 3


def test_public_view_carries_only_the_whitelisted_keys(client):
    created = _create(client)
    _select(client, created["id"], [("dojazd", 2)])
    body = client.get(f"/api/v1/public/events/{created['slug']}").json()
    assert set(body) == {"title", "eventType", "eventDate", "location", "attendees",
                         "ustalenia", "organizerChecklist", "teamChecklists", "impactSummary"}
    assert [u["areaId"] for u in body["ustalenia"]] == ["dojazd"]


def test_unknown_slug_is_a_polish_404(client):
    r = client.get("/api/v1/public/events/zzzzzzzz")
    assert r.status_code == 404 and r.json()["detail"] == NOT_FOUND


def test_a_slug_of_the_wrong_shape_is_also_404(client):
    for bad in (str(uuid4()), "abc", "a" * 40):
        r = client.get(f"/api/v1/public/events/{bad}")
        assert r.status_code == 404 and r.json()["detail"] == NOT_FOUND
