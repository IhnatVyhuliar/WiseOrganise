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
    from app.repositories import event_repo
    from app.services.eguide_service import base_eguide
    from app.services.impact_service import build_impact

    # Built from the stored event, like a well-behaved model answer: it carries
    # exactly the checklist items and roles the prompt supplied.
    event = event_repo.get_event(event_id) or {"id": event_id, "title": "T"}
    guide = base_eguide(event)
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
    calls: list[int] = []

    def model(**kw):
        # The model call now runs on its own bounded thread, so job A is the first call.
        calls.append(1)
        if len(calls) == 1:
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
    release_a.set()
    holder["a"].join(2)  # A finishes while B's guide is still "w toku": only the nonce can reject it
    assert not holder["a"].is_alive()
    assert "A text (old event)" not in _labels(client, event_id)
    ai_jobs.run_eguide_job(*submitted[1])
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


def test_the_run_nonce_is_not_part_of_the_api_contract(client):
    assert "aiRunId" not in client.get("/openapi.json").text
    assert "ai_run_id" not in client.get("/openapi.json").text


def test_the_nonce_lives_on_the_event_record(monkeypatch, client, gemini_on):
    from app.repositories import event_repo

    event_id = _create(client)
    submitted = _capture_jobs(monkeypatch)
    body = client.post(f"/api/v1/events/{event_id}/eguide").json()
    assert "aiRunId" not in body
    assert event_repo.get_event(event_id)["eguide_run_id"] == submitted[0][1]


def test_a_guide_stored_before_the_selections_is_rebuilt_after_them(client):
    """A read stores the guide; picking levels must not leave that stale copy behind."""
    event_id = _create(client)
    assert client.get(f"/api/v1/events/{event_id}/eguide").json()["ustalenia"] == []
    client.patch(f"/api/v1/events/{event_id}/options", json={"selections": [{"areaId": "catering", "level": 2}]})
    guide = client.get(f"/api/v1/events/{event_id}/eguide").json()
    assert [(u["areaId"], u["level"]) for u in guide["ustalenia"]] == [("catering", 2)]
    slug = client.get(f"/api/v1/events/{event_id}").json()["slug"]
    public = client.get(f"/api/v1/public/events/{slug}").json()
    assert [(u["areaId"], u["level"]) for u in public["ustalenia"]] == [("catering", 2)]


def test_selecting_options_also_clears_the_generation_nonce(monkeypatch, client, gemini_on):
    from app.repositories import event_repo

    event_id = _create(client)
    _capture_jobs(monkeypatch)
    client.post(f"/api/v1/events/{event_id}/eguide")
    assert event_repo.get_event(event_id)["eguide_run_id"]
    client.patch(f"/api/v1/events/{event_id}/options", json={"selections": [{"areaId": "catering", "level": 2}]})
    stored = event_repo.get_event(event_id)
    assert stored["eguide"] is None and stored["eguide_run_id"] is None


def test_a_vendor_name_invented_by_the_model_never_reaches_the_stored_guide(monkeypatch, client, gemini_on):
    event_id = _create(client)
    base = client.get(f"/api/v1/events/{event_id}/eguide").json()

    def model(**kw):
        guide = _model_guide(event_id, "AI text")
        guide.greenwashing_risk_matrix[0].vendor_name = "Sodexo"
        guide.greenwashing_risk_matrix[0].claim = "Sodexo jest eko."
        guide.contract_clauses_and_questions[0].text = "Umowa z Sodexo."
        return guide

    monkeypatch.setattr(ai_jobs, "generate_structured", model)
    client.post(f"/api/v1/events/{event_id}/eguide")
    guide = _wait_for_status(client, event_id, "gotowe")
    assert "Sodexo" not in client.get(f"/api/v1/events/{event_id}/eguide").text
    assert guide["greenwashingRiskMatrix"] == base["greenwashingRiskMatrix"]
    assert guide["contractClausesAndQuestions"] == base["contractClausesAndQuestions"]
    assert guide["organizerChecklist"][0]["label"] == "AI text"  # text is still the model's


def test_a_model_that_drops_a_checklist_item_keeps_the_base_guide(monkeypatch, client, gemini_on):
    event_id = _create(client)
    base = client.get(f"/api/v1/events/{event_id}/eguide").json()

    def model(**kw):
        guide = _model_guide(event_id, "AI text")
        guide.organizer_checklist.pop()
        return guide

    monkeypatch.setattr(ai_jobs, "generate_structured", model)
    client.post(f"/api/v1/events/{event_id}/eguide")
    guide = _wait_for_status(client, event_id, "nieudane")
    assert guide["aiStatus"] == "nieudane"
    assert {**guide, "aiStatus": None} == {**base, "aiStatus": None}


def test_a_model_that_renames_a_team_role_keeps_the_base_guide(monkeypatch, client, gemini_on):
    event_id = _create(client)
    base = client.get(f"/api/v1/events/{event_id}/eguide").json()

    def model(**kw):
        guide = _model_guide(event_id, "AI text")
        guide.team_checklists[0].role = "Nowa rola"
        return guide

    monkeypatch.setattr(ai_jobs, "generate_structured", model)
    client.post(f"/api/v1/events/{event_id}/eguide")
    guide = _wait_for_status(client, event_id, "nieudane")
    assert {**guide, "aiStatus": None} == {**base, "aiStatus": None}


def test_an_edit_made_while_the_model_works_is_not_reverted_by_the_job(monkeypatch, client, gemini_on):
    event_id = _create(client)
    submitted = _capture_jobs(monkeypatch)
    client.post(f"/api/v1/events/{event_id}/eguide")

    monkeypatch.setattr(ai_jobs, "generate_structured", lambda **kw: _model_guide(event_id, "AI text"))
    real_build_impact = ai_jobs.build_impact

    def concurrent_edit(event):
        # Runs after the job re-read the record and before it writes: a second
        # writer saves the whole record while the job holds its own copy.
        assert client.patch(f"/api/v1/events/{event_id}", json={"title": "Nowy tytul"}).status_code == 200
        return real_build_impact(event)

    monkeypatch.setattr(ai_jobs, "build_impact", concurrent_edit)
    ai_jobs.run_eguide_job(*submitted[0])
    assert client.get(f"/api/v1/events/{event_id}").json()["title"] == "Nowy tytul"
    assert client.get(f"/api/v1/events/{event_id}/eguide").json()["aiStatus"] == "gotowe"


def test_a_guide_left_in_progress_by_a_restart_is_swept_to_nieudane(client):
    from fastapi.testclient import TestClient

    from app.main import app
    from app.repositories import event_repo

    event_id = _create(client)
    event = event_repo.get_event(event_id)
    event["eguide"] = ai_jobs.EGuideResponse.model_validate(
        {**client.get(f"/api/v1/events/{event_id}/eguide").json(), "aiStatus": "w toku"}
    ).model_dump()
    event["eguide_run_id"] = "orphan"
    event_repo.save_event(event)
    try:
        with TestClient(app):  # the startup path: init_schema() plus the sweep
            pass
    finally:
        event_repo.reset_pool()  # the lifespan closed the pool on the way out
        event_repo.init_schema()
    stored = event_repo.get_event(event_id)
    assert stored["eguide"]["ai_status"] == "nieudane"
    assert stored["eguide_run_id"] is None
