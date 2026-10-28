"""The base e-guide always exists; Gemini runs in the background with a visible status."""

from __future__ import annotations

import threading
import time

import pytest

from app.schemas import EGuideResponse
from app.workers import ai_jobs


def _create(client) -> str:
    return client.post("/api/v1/events", json={"title": "T"}).json()["id"]


def _wait_for_status(client, event_id: str, wanted: str, timeout: float = 2.0) -> dict:
    deadline = time.monotonic() + timeout
    while True:
        guide = client.get(f"/api/v1/events/{event_id}/eguide").json()
        if guide["aiStatus"] == wanted or time.monotonic() > deadline:
            return guide
        time.sleep(0.02)


@pytest.fixture()
def gemini_on(monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(type(settings), "gemini_enabled", property(lambda self: True))


def _model_guide(event_id: str, text: str) -> EGuideResponse:
    """A model answer with deliberately wrong numbers and its own text."""
    from app.services.eguide_service import base_eguide
    from app.services.impact_service import build_impact

    guide = base_eguide({"id": event_id, "title": "T"})
    bad = build_impact({"id": event_id, "title": "T"})
    bad["saved_pln"] = 999999.0
    guide.impact_summary = type(guide.impact_summary).model_validate(bad)
    guide.emissions_summary = guide.impact_summary
    guide.ustalenia = []
    guide.organizer_checklist[0].label = text
    return guide


def test_getting_a_guide_that_was_never_generated_returns_200(client):
    event_id = _create(client)
    assert client.get(f"/api/v1/events/{event_id}/eguide").status_code == 200


def test_toggling_a_checkbox_without_generating_first_returns_200(client):
    event_id = _create(client)
    item_id = client.get(f"/api/v1/events/{event_id}/eguide").json()["organizerChecklist"][0]["id"]
    r = client.patch(f"/api/v1/events/{event_id}/eguide/checklist", json={"itemId": item_id, "isDone": True})
    assert r.status_code == 200
    assert [i for i in r.json()["organizerChecklist"] if i["id"] == item_id][0]["isDone"] is True


def test_toggling_a_checkbox_on_a_fresh_event_creates_the_guide(client):
    event_id = _create(client)
    r = client.patch(f"/api/v1/events/{event_id}/eguide/checklist", json={"itemId": "o1", "isDone": True})
    assert r.status_code == 200
    assert [i for i in r.json()["organizerChecklist"] if i["id"] == "o1"][0]["isDone"] is True


def test_editing_needed_areas_rebuilds_the_guide_on_the_next_read(client):
    event_id = _create(client)
    before = client.get(f"/api/v1/events/{event_id}/eguide").json()
    assert client.patch(f"/api/v1/events/{event_id}/needed-areas", json={"neededAreas": ["dojazd"]}).status_code == 200
    after = client.get(f"/api/v1/events/{event_id}/eguide").json()
    assert {i["areaId"] for i in after["organizerChecklist"]} == {"dojazd"}
    assert len(after["organizerChecklist"]) < len(before["organizerChecklist"])


def test_ai_status_is_disabled_without_gemini(client):
    event_id = _create(client)
    assert client.get(f"/api/v1/events/{event_id}/eguide").json()["aiStatus"] == "wyłączone"
    assert client.post(f"/api/v1/events/{event_id}/eguide").json()["aiStatus"] == "wyłączone"


def test_no_team_role_carries_a_contact(client):
    event_id = _create(client)
    guide = client.get(f"/api/v1/events/{event_id}/eguide").json()
    assert guide["teamChecklists"]
    assert all("contact" not in r for r in guide["teamChecklists"])


def test_generate_returns_the_base_guide_immediately_when_ai_is_enabled(monkeypatch, client, gemini_on):
    event_id = _create(client)
    release = threading.Event()
    monkeypatch.setattr(ai_jobs, "generate_structured", lambda **kw: (release.wait(2), _model_guide(event_id, "AI text"))[1])
    try:
        r = client.post(f"/api/v1/events/{event_id}/eguide")
        assert r.status_code == 200
        assert r.json()["aiStatus"] == "w toku"
        assert r.json()["organizerChecklist"][0]["label"] != "AI text"
        assert client.get(f"/api/v1/events/{event_id}/eguide").json()["aiStatus"] == "w toku"
    finally:
        release.set()
    _wait_for_status(client, event_id, "gotowe")


def test_job_success_overwrites_text_but_never_numbers(monkeypatch, client, gemini_on):
    event_id = _create(client)
    client.patch(f"/api/v1/events/{event_id}/options", json={"selections": [{"areaId": "catering", "level": 2}]})
    base = client.get(f"/api/v1/events/{event_id}/eguide").json()
    monkeypatch.setattr(ai_jobs, "generate_structured", lambda **kw: _model_guide(event_id, "AI text"))
    client.post(f"/api/v1/events/{event_id}/eguide")
    guide = _wait_for_status(client, event_id, "gotowe")
    assert guide["aiStatus"] == "gotowe"
    assert guide["organizerChecklist"][0]["label"] == "AI text"
    assert guide["impactSummary"] == base["impactSummary"]
    assert guide["emissionsSummary"] == base["emissionsSummary"]
    assert [u["areaId"] for u in guide["ustalenia"]] == ["catering"]


def test_job_failure_keeps_the_base_guide_and_reports_nieudane(monkeypatch, client, gemini_on):
    event_id = _create(client)
    base = client.get(f"/api/v1/events/{event_id}/eguide").json()

    def boom(**kw):
        raise RuntimeError("model drifted")

    monkeypatch.setattr(ai_jobs, "generate_structured", boom)
    client.post(f"/api/v1/events/{event_id}/eguide")
    guide = _wait_for_status(client, event_id, "nieudane")
    assert guide["aiStatus"] == "nieudane"
    assert {**guide, "aiStatus": None} == {**base, "aiStatus": None}


def _capture_jobs(monkeypatch) -> list[tuple[str, str]]:
    """Record submitted jobs instead of running them, so a test runs each one itself."""
    submitted: list[tuple[str, str]] = []
    monkeypatch.setattr("app.services.eguide_service.submit_eguide_job", lambda event_id, run_id: submitted.append((event_id, run_id)))
    return submitted


def _labels(client, event_id: str) -> list[str]:
    return [i["label"] for i in client.get(f"/api/v1/events/{event_id}/eguide").json()["organizerChecklist"]]


def test_job_discards_its_result_when_the_guide_was_rebuilt_meanwhile(monkeypatch, client, gemini_on):
    event_id = _create(client)
    submitted = _capture_jobs(monkeypatch)
    client.post(f"/api/v1/events/{event_id}/eguide")

    def edit_during_the_call(**kw):
        client.patch(f"/api/v1/events/{event_id}/needed-areas", json={"neededAreas": ["dojazd"]})
        return _model_guide(event_id, "stale AI text")

    monkeypatch.setattr(ai_jobs, "generate_structured", edit_during_the_call)
    ai_jobs.run_eguide_job(*submitted[0])
    assert "stale AI text" not in _labels(client, event_id)
    assert client.get(f"/api/v1/events/{event_id}/eguide").json()["aiStatus"] == "wyłączone"


def test_a_stale_job_cannot_overwrite_the_guide_of_a_newer_generate(monkeypatch, client, gemini_on):
    event_id = _create(client)
    submitted = _capture_jobs(monkeypatch)
    client.post(f"/api/v1/events/{event_id}/eguide")  # job A
    in_a, release_a = threading.Event(), threading.Event()
    holder: dict[str, threading.Thread] = {}

    def model(**kw):
        if threading.current_thread() is holder["a"]:
            in_a.set()
            assert release_a.wait(2)
            return _model_guide(event_id, "A text (old event)")
        return _model_guide(event_id, "B text")

    monkeypatch.setattr(ai_jobs, "generate_structured", model)
    holder["a"] = threading.Thread(target=ai_jobs.run_eguide_job, args=submitted[0])
    holder["a"].start()
    assert in_a.wait(2)
    client.patch(f"/api/v1/events/{event_id}/needed-areas", json={"neededAreas": ["dojazd"]})
    client.post(f"/api/v1/events/{event_id}/eguide")  # job B
    assert submitted[1][1] != submitted[0][1]
    ai_jobs.run_eguide_job(*submitted[1])
    release_a.set()
    holder["a"].join(2)  # A finishes last
    assert not holder["a"].is_alive()
    guide = client.get(f"/api/v1/events/{event_id}/eguide").json()
    assert guide["aiStatus"] == "gotowe"
    assert guide["organizerChecklist"][0]["label"] == "B text"


def test_a_closed_pool_in_the_job_is_a_failure_not_a_crash(monkeypatch, client, gemini_on):
    event_id = _create(client)
    client.post(f"/api/v1/events/{event_id}/eguide")

    def closed(_id):
        raise RuntimeError("the pool is closed")

    monkeypatch.setattr(ai_jobs, "get_event", closed)
    ai_jobs.run_eguide_job(event_id, "any-run")  # must not raise


def test_the_public_view_is_read_only_and_never_calls_the_model(monkeypatch, client, gemini_on):
    from app.repositories import event_repo

    event_id = _create(client)
    slug = client.get(f"/api/v1/events/{event_id}").json()["slug"]

    def forbidden(**kw):
        raise AssertionError("the public view must not call the model")

    monkeypatch.setattr(ai_jobs, "generate_structured", forbidden)
    monkeypatch.setattr("app.services.eguide_service.save_event", forbidden)
    before = event_repo.get_event(event_id)
    r = client.get(f"/api/v1/public/events/{slug}")
    assert r.status_code == 200, r.text
    after = event_repo.get_event(event_id)
    assert after["eguide"] == before["eguide"] and after["status"] == before["status"]


def test_the_public_view_prefers_the_stored_guide(client):
    from app.repositories import event_repo

    event_id = _create(client)
    slug = client.get(f"/api/v1/events/{event_id}").json()["slug"]
    client.post(f"/api/v1/events/{event_id}/eguide")
    event = event_repo.get_event(event_id)
    event["eguide"]["organizer_checklist"][0]["label"] = "STORED GUIDE TEXT"
    event_repo.save_event(event)
    body = client.get(f"/api/v1/public/events/{slug}").json()
    assert body["organizerChecklist"][0]["label"] == "STORED GUIDE TEXT"
