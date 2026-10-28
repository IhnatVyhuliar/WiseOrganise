"""Area suggestions: a narrow prompt, a stable result, one model call per distinct description."""

from __future__ import annotations

import pytest

from app.repositories import event_repo
from app.schemas import AreaSuggestion, AreaSuggestionResponse
from app.services import suggestion_service
from app.services.ai_context import build_area_suggestion_prompt, event_facts, facts_hash
from app.services.eguide_service import compile_eguide

DESCRIPTION = "Dwudniowa konferencja z cateringiem dla 120 osob, goscie z calej Polski."


def _create(client, description: str = DESCRIPTION) -> str:
    return client.post("/api/v1/events", json={"title": "T", "rawDescription": description}).json()["id"]


@pytest.fixture()
def gemini_on(monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(type(settings), "gemini_enabled", property(lambda self: True))


class _Calls:
    n = 0


def _fake_model(monkeypatch, order=("catering", "dojazd")) -> _Calls:
    calls = _Calls()

    def fake(**kwargs):
        calls.n += 1
        return AreaSuggestionResponse(
            available=True, message="x", suggestions=[AreaSuggestion(area_id=a, reason="Powod.") for a in order]
        )

    monkeypatch.setattr(suggestion_service, "generate_structured", fake)
    return calls


def test_event_facts_has_exactly_seven_keys(client):
    event = event_repo.get_event(_create(client))
    assert set(event_facts(event)) == {
        "title", "raw_description", "event_date", "attendees", "location", "participant_origins", "starting_mode",
    }
    assert isinstance(event_facts(event)["event_date"], str)


def test_the_prompt_carries_only_the_seven_fields(client):
    event = event_repo.get_event(_create(client))
    event["suggestion_cache"] = {"hash": "h", "response": {}}
    prompt = build_area_suggestion_prompt(event)
    for forbidden in ("created_at", "updated_at", "eguide", "selected_options", "suggestion_cache", event["id"]):
        assert forbidden not in prompt


def test_two_calls_build_a_byte_identical_prompt(client):
    event_id = _create(client)
    first = build_area_suggestion_prompt(event_repo.get_event(event_id))
    event = event_repo.get_event(event_id)
    compile_eguide(event)  # stores a guide and bumps updated_at
    event["suggestion_cache"] = {"hash": "h", "response": {}}
    event_repo.save_event(event)
    assert build_area_suggestion_prompt(event_repo.get_event(event_id)) == first


def test_the_cache_does_not_change_the_hash(client):
    event = event_repo.get_event(_create(client))
    before = facts_hash(event_facts(event))
    event["suggestion_cache"] = {"hash": before, "response": {}}
    assert facts_hash(event_facts(event)) == before


def test_the_second_call_is_served_from_cache(monkeypatch, client, gemini_on):
    calls = _fake_model(monkeypatch)
    event_id = _create(client)
    first = client.post(f"/api/v1/events/{event_id}/suggest-areas").json()
    second = client.post(f"/api/v1/events/{event_id}/suggest-areas").json()
    assert calls.n == 1
    assert first == second
    assert event_repo.get_event(event_id)["suggestion_cache"]["hash"]


def test_changing_the_description_invalidates_the_cache(monkeypatch, client, gemini_on):
    calls = _fake_model(monkeypatch)
    event_id = _create(client)
    client.post(f"/api/v1/events/{event_id}/suggest-areas")
    client.patch(f"/api/v1/events/{event_id}", json={"rawDescription": "Zupelnie inny opis wydarzenia."})
    client.post(f"/api/v1/events/{event_id}/suggest-areas")
    assert calls.n == 2


def test_suggestions_come_back_in_canonical_area_order(monkeypatch, client, gemini_on):
    _fake_model(monkeypatch, order=("catering", "dojazd"))
    body = client.post(f"/api/v1/events/{_create(client)}/suggest-areas").json()
    assert [s["areaId"] for s in body["suggestions"]] == ["dojazd", "catering"]


def test_each_unavailable_path_keeps_its_polish_message(monkeypatch, client, gemini_on):
    from app.core.config import settings

    # empty description
    r = client.post(f"/api/v1/events/{_create(client, ' ')}/suggest-areas")
    assert r.status_code == 200 and r.json()["message"] == suggestion_service._NO_DESCRIPTION
    # model call raises
    def boom(**kwargs):
        raise RuntimeError("down")
    monkeypatch.setattr(suggestion_service, "generate_structured", boom)
    event_id = _create(client)
    r = client.post(f"/api/v1/events/{event_id}/suggest-areas")
    assert r.status_code == 200 and r.json()["message"] == suggestion_service._FAILED
    assert "suggestion_cache" not in event_repo.get_event(event_id)
    # everything filtered out
    monkeypatch.setattr(
        suggestion_service, "generate_structured",
        lambda **kw: AreaSuggestionResponse(available=True, message="x", suggestions=[]),
    )
    r = client.post(f"/api/v1/events/{_create(client)}/suggest-areas")
    assert r.json()["available"] is False and r.json()["message"] == suggestion_service._FAILED
    # gemini disabled
    monkeypatch.setattr(type(settings), "gemini_enabled", property(lambda self: False))
    r = client.post(f"/api/v1/events/{_create(client)}/suggest-areas")
    assert r.json()["message"] == suggestion_service._NO_MODEL


def test_a_write_during_the_model_call_survives_the_cache_write(monkeypatch, client, gemini_on):
    event_id = _create(client)

    def fake(**kwargs):
        concurrent = event_repo.get_event(event_id)
        concurrent["eguide_run_id"] = "sentinel"
        event_repo.save_event(concurrent)
        return AreaSuggestionResponse(
            available=True, message="x", suggestions=[AreaSuggestion(area_id="dojazd", reason="Powod.")]
        )

    monkeypatch.setattr(suggestion_service, "generate_structured", fake)
    assert client.post(f"/api/v1/events/{event_id}/suggest-areas").json()["available"] is True
    stored = event_repo.get_event(event_id)
    assert stored["eguide_run_id"] == "sentinel"
    assert stored["suggestion_cache"]["hash"]


def test_a_corrupt_cache_is_ignored_and_repaired(monkeypatch, client, gemini_on):
    calls = _fake_model(monkeypatch)
    event_id = _create(client)
    event = event_repo.get_event(event_id)
    event["suggestion_cache"] = {"hash": facts_hash(event_facts(event)), "response": {"bogus": 1}}
    event_repo.save_event(event)
    r = client.post(f"/api/v1/events/{event_id}/suggest-areas")
    assert r.status_code == 200 and r.json()["available"] is True and calls.n == 1
    client.post(f"/api/v1/events/{event_id}/suggest-areas")
    assert calls.n == 1  # repaired: the second call is a hit


def test_a_failing_cache_write_still_returns_the_answer(monkeypatch, client, gemini_on):
    _fake_model(monkeypatch)
    event_id = _create(client)

    def broken(event):
        raise RuntimeError("db down")

    monkeypatch.setattr(suggestion_service, "save_event", broken)
    r = client.post(f"/api/v1/events/{event_id}/suggest-areas")
    assert r.status_code == 200 and r.json()["available"] is True


def test_a_cache_hit_is_served_even_when_gemini_is_disabled(monkeypatch, client, gemini_on):
    from app.core.config import settings

    _fake_model(monkeypatch)
    event_id = _create(client)
    client.post(f"/api/v1/events/{event_id}/suggest-areas")
    monkeypatch.setattr(type(settings), "gemini_enabled", property(lambda self: False))
    body = client.post(f"/api/v1/events/{event_id}/suggest-areas").json()
    assert body["available"] is True and len(body["suggestions"]) == 2
