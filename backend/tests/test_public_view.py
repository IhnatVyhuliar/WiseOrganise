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
    # JSONB reorders keys by length (ludzie before catering); canonical order has
    # catering (index 2) before ludzie (index 5); the click order is ludzie first too.
    _select(client, event_id, [("ludzie", 3), ("catering", 2)])
    guide = client.post(f"/api/v1/events/{event_id}/eguide").json()
    assert [u["areaId"] for u in guide["ustalenia"]] == ["catering", "ludzie"]
    first = guide["ustalenia"][0]
    assert set(first) == {"areaId", "areaName", "level", "levelLabel", "justification", "costEffect"}
    assert first["level"] == 2


def test_build_ustalenia_ignores_dict_order():
    from app.services.ustalenia_service import build_ustalenia

    reverse = {"ludzie": 3, "catering": 2, "dojazd": 1}
    assert [u["area_id"] for u in build_ustalenia({"selected_options": reverse})] == ["dojazd", "catering", "ludzie"]


def test_slugless_legacy_row_gets_a_slug(client):
    import json
    from app.repositories import event_repo

    event_id = _create(client)["id"]
    with event_repo.connection() as conn:
        conn.execute("UPDATE events SET slug = NULL, payload = payload - 'slug' WHERE id = %s", (event_id,))
    body = client.get(f"/api/v1/events/{event_id}").json()
    assert len(body["slug"]) == 8
    assert client.get(f"/api/v1/public/events/{body['slug']}").status_code == 200


def test_public_view_carries_only_the_whitelisted_keys(client):
    created = _create(client)
    _select(client, created["id"], [("dojazd", 2)])
    body = client.get(f"/api/v1/public/events/{created['slug']}").json()
    assert set(body) == {"title", "eventType", "eventDate", "location", "attendees",
                         "ustalenia", "organizerChecklist", "teamChecklists", "impactSummary"}
    assert [u["areaId"] for u in body["ustalenia"]] == ["dojazd"]
    assert body["teamChecklists"]
    for role in body["teamChecklists"]:
        assert set(role) == {"role", "tasks", "completedTasks"}
    assert body["organizerChecklist"]
    for item in body["organizerChecklist"]:
        assert set(item) == {"id", "area", "areaId", "label", "milestone", "isDone"}


def test_unknown_slug_is_a_polish_404(client):
    r = client.get("/api/v1/public/events/zzzzzzzz")
    assert r.status_code == 404 and r.json()["detail"] == NOT_FOUND


def test_a_slug_of_the_wrong_shape_is_also_404(client):
    for bad in (str(uuid4()), "abc", "a" * 40):
        r = client.get(f"/api/v1/public/events/{bad}")
        assert r.status_code == 404 and r.json()["detail"] == NOT_FOUND
