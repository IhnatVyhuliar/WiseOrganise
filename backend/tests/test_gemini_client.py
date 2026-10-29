"""Gemini calls are deterministic (temperature 0) and time-bounded."""

from __future__ import annotations

import threading
import time

import pytest
from pydantic import BaseModel

from app.core.config import settings
from app.integrations import gemini_client
from app.workers import ai_jobs


class _Answer(BaseModel):
    text: str


class _FakeSdk:
    """Stands in for google-genai, recording how the client and the call were configured."""

    def __init__(self, types):
        self.types = types
        self.client_kwargs: dict = {}
        self.call_kwargs: dict = {}

    @property
    def last_config(self):
        return self.call_kwargs["config"]

    @property
    def last_http_options(self):
        return self.client_kwargs["http_options"]

    def install(self, monkeypatch):
        sdk = self

        class _Models:
            def generate_content(self, **kwargs):
                sdk.call_kwargs = kwargs
                return type("Response", (), {"text": '{"text": "ok"}'})()

        class _Client:
            def __init__(self, **kwargs):
                sdk.client_kwargs = kwargs
                self.models = _Models()

        genai = type("FakeGenai", (), {"Client": _Client})
        monkeypatch.setattr(gemini_client, "_sdk", lambda: (genai, self.types))
        monkeypatch.setattr(type(settings), "gemini_enabled", property(lambda self: True))


@pytest.fixture()
def fake_sdk(monkeypatch):
    types = pytest.importorskip("google.genai.types")
    sdk = _FakeSdk(types)
    sdk.install(monkeypatch)
    return sdk


def _call():
    return gemini_client.generate_structured(
        task="t", prompt="p", schema=_Answer, system_instruction="Polish only."
    )


def test_every_call_sets_temperature_zero(fake_sdk):
    _call()
    assert fake_sdk.last_config.temperature == 0


def test_the_call_carries_the_configured_timeout(fake_sdk, monkeypatch):
    monkeypatch.setattr(settings, "gemini_timeout_seconds", 12.5)
    _call()
    # google-genai documents HttpOptions.timeout as milliseconds (2.33.0 divides by 1000 for httpx).
    assert fake_sdk.last_http_options.timeout == 12500


def test_the_default_timeout_is_45_seconds():
    assert type(settings).model_fields["gemini_timeout_seconds"].default == 45.0


def test_the_safety_instruction_still_prefixes_the_system_instruction(fake_sdk):
    _call()
    assert fake_sdk.last_config.system_instruction.startswith(gemini_client._SAFETY_INSTRUCTION)
    assert fake_sdk.last_config.system_instruction.endswith("Polish only.")


@pytest.fixture()
def gemini_on(monkeypatch):
    monkeypatch.setattr(type(settings), "gemini_enabled", property(lambda self: True))


def _wait_for_status(client, event_id: str, wanted: str, timeout: float = 5.0) -> dict:
    deadline = time.monotonic() + timeout
    while True:
        guide = client.get(f"/api/v1/events/{event_id}/eguide").json()
        if guide["aiStatus"] == wanted or time.monotonic() > deadline:
            return guide
        time.sleep(0.02)


def test_a_hung_job_ends_as_failed_with_the_base_guide_intact(client, monkeypatch, gemini_on):
    monkeypatch.setattr(settings, "gemini_timeout_seconds", 0.1)
    monkeypatch.setattr(ai_jobs, "_WAIT_GRACE_SECONDS", 0.1)
    release = threading.Event()
    monkeypatch.setattr(ai_jobs, "generate_structured", lambda **kw: release.wait(10))
    event_id = client.post("/api/v1/events", json={"title": "T"}).json()["id"]
    before = client.get(f"/api/v1/events/{event_id}/eguide").json()
    try:
        assert client.post(f"/api/v1/events/{event_id}/eguide").json()["aiStatus"] == "w toku"
        guide = _wait_for_status(client, event_id, "nieudane")
        assert guide["aiStatus"] == "nieudane"
        assert {**guide, "aiStatus": None} == {**before, "aiStatus": None}
    finally:
        release.set()  # the orphaned worker thread cannot be killed, only let go
        for t in threading.enumerate():
            if t.name.startswith("eguide-ai-call"):
                t.join(2)


def test_a_late_answer_from_a_timed_out_job_is_discarded(client, monkeypatch, gemini_on):
    from app.workers.ai_jobs import run_eguide_job

    monkeypatch.setattr(settings, "gemini_timeout_seconds", 0.1)
    monkeypatch.setattr(ai_jobs, "_WAIT_GRACE_SECONDS", 0.1)
    event_id = client.post("/api/v1/events", json={"title": "T"}).json()["id"]
    submitted = []
    monkeypatch.setattr("app.services.eguide_service.submit_eguide_job", lambda e, r: submitted.append((e, r)))
    client.post(f"/api/v1/events/{event_id}/eguide")
    release = threading.Event()
    monkeypatch.setattr(ai_jobs, "generate_structured", lambda **kw: release.wait(10))
    try:
        run_eguide_job(*submitted[0])
    finally:
        release.set()
        for t in threading.enumerate():
            if t.name.startswith("eguide-ai-call"):
                t.join(2)
    assert client.get(f"/api/v1/events/{event_id}/eguide").json()["aiStatus"] == "nieudane"


def test_a_raising_job_ends_as_failed_not_in_progress(client, monkeypatch, gemini_on):
    def boom(**kw):
        raise RuntimeError("socket closed")

    monkeypatch.setattr(ai_jobs, "generate_structured", boom)
    event_id = client.post("/api/v1/events", json={"title": "T"}).json()["id"]
    client.post(f"/api/v1/events/{event_id}/eguide")
    assert _wait_for_status(client, event_id, "nieudane")["aiStatus"] == "nieudane"
