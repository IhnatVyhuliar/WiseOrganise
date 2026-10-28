"""Background Gemini pass over the deterministic e-guide.

The base guide is already stored and served when a job starts. The job only
ever replaces text; every number and the ustalenia are re-applied from Python.
"""
from __future__ import annotations
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import Any
from ..integrations.gemini_client import generate_structured
from ..repositories.event_repo import get_event, save_event
from ..schemas import AiStatus, EGuideResponse, EmissionsSummary, Ustalenie
from ..services.ai_context import build_eguide_prompt
from ..services.impact_service import build_impact
from ..services.ustalenia_service import build_ustalenia

logger = logging.getLogger(__name__)

_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="eguide-ai")


def submit_eguide_job(event_id: str, run_id: str) -> None:
    """Schedule the Gemini pass for an event; returns immediately.

    ``run_id`` is the nonce stored on the guide: only the job holding the
    guide's current nonce may overwrite it.
    """
    _executor.submit(run_eguide_job, event_id, run_id)


def _carry_done_flags(generated: EGuideResponse, stored: dict[str, Any]) -> None:
    """Keep the ticks the organizer made while the model was working."""
    done = {item["id"]: bool(item.get("is_done")) for item in stored.get("organizer_checklist", []) if item.get("id")}
    completed = {role["role"]: list(role.get("completed_tasks") or []) for role in stored.get("team_checklists", []) if role.get("role")}
    for item in generated.organizer_checklist:
        item.is_done = done.get(item.id, False)
    for role in generated.team_checklists:
        role.completed_tasks = [task for task in completed.get(role.role, []) if task in role.tasks]


def _owns_guide(event: dict[str, Any] | None, run_id: str) -> bool:
    """True when the stored guide is still the one this job was started for."""
    if not event or event.get("eguide_run_id") != run_id:
        return False
    guide = event.get("eguide")
    return bool(guide) and guide.get("ai_status") == AiStatus.IN_PROGRESS.value


def _mark_failed(event_id: str, run_id: str) -> None:
    """Record a failure; never raises, because a closed pool must not kill the worker silently."""
    try:
        event = get_event(event_id)
        if not _owns_guide(event, run_id):
            return
        event["eguide"]["ai_status"] = AiStatus.FAILED.value
        event["eguide_run_id"] = None
        save_event(event)
    except Exception:
        logger.warning("Could not record the failed AI pass for event %s", event_id, exc_info=True)


def run_eguide_job(event_id: str, run_id: str) -> None:
    """Compose the guide text with Gemini; on any failure keep the base guide."""
    try:
        event = get_event(event_id)
        if not _owns_guide(event, run_id):
            return
        generated = generate_structured(
            task="generate_eguide",
            prompt=build_eguide_prompt(event),
            schema=EGuideResponse,
            system_instruction="Compile the guide in Polish and preserve the deterministic impact_summary supplied by Python.",
            prompt_version="v1",
        )
        # The model call is slow: re-read, because the organizer may have edited
        # the event (which drops the guide) or ticked boxes in the meantime.
        event = get_event(event_id)
        if not _owns_guide(event, run_id):
            return
        impact = EmissionsSummary(**build_impact(event))
        generated.event_id = event_id
        generated.impact_summary = impact
        generated.emissions_summary = impact
        generated.ustalenia = [Ustalenie.model_validate(item) for item in build_ustalenia(event)]
        generated.ai_status = AiStatus.READY
        _carry_done_flags(generated, event["eguide"])
        event["eguide"] = generated.model_dump()
        event["eguide_run_id"] = None
        save_event(event)
    except Exception:
        # A model that drifts from the knowledge base must never reach the organizer.
        logger.warning("Gemini guide generation failed for event %s, keeping the base guide", event_id, exc_info=True)
        _mark_failed(event_id, run_id)
