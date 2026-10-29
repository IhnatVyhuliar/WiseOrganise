"""Background Gemini pass over the deterministic e-guide.

The base guide is already stored and served when a job starts. The job only
ever replaces text; every number and the ustalenia are re-applied from Python.
"""
from __future__ import annotations
import json
import logging
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeout
from typing import Any, Iterable
from ..core.config import settings
from ..integrations.gemini_client import generate_structured
from ..mocks.knowledge_mocks import CONTRACT_CLAUSES, GREENWASHING_RISKS
from ..repositories.event_repo import connection, get_event, merge_event_fields
from ..schemas import AiStatus, ContractClause, EGuideResponse, EmissionsSummary, RiskFlag, Ustalenie
from ..services.ai_context import build_eguide_prompt
from ..services.impact_service import build_impact
from ..services.ustalenia_service import build_ustalenia

logger = logging.getLogger(__name__)

_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="eguide-ai")

# Slack on top of the SDK's own HTTP timeout before the job gives up waiting.
_WAIT_GRACE_SECONDS = 5.0


def _call_model_bounded(**kwargs: Any) -> EGuideResponse:
    """Run the model call on its own thread and wait for it at most timeout + grace.

    Python cannot kill a thread, so a hung call is only orphaned here: the SDK's
    HTTP timeout is the real abort. This wait only guarantees that the job ends
    and its *status* never stays "w toku". Raises ``FutureTimeout`` on expiry.
    """
    pool = ThreadPoolExecutor(max_workers=1, thread_name_prefix="eguide-ai-call")
    try:
        return pool.submit(generate_structured, **kwargs).result(
            timeout=settings.gemini_timeout_seconds + _WAIT_GRACE_SECONDS
        )
    finally:
        pool.shutdown(wait=False)


def submit_eguide_job(event_id: str, run_id: str) -> None:
    """Schedule the Gemini pass for an event; returns immediately.

    ``run_id`` is the nonce stored on the guide: only the job holding the
    guide's current nonce may overwrite it.
    """
    _executor.submit(run_eguide_job, event_id, run_id)


_SWEEP_SQL = """
UPDATE events
   SET payload = jsonb_set(payload, '{eguide,ai_status}', %s::jsonb)
                 || '{"eguide_run_id": null}'::jsonb,
       updated_at = now()
 WHERE payload->'eguide'->>'ai_status' = %s
"""


def sweep_stale_ai_runs() -> int:
    """Fail every guide left "w toku" by a process that died mid-job; return the row count.

    Nothing re-submits a background pass across a restart, so a guide stored
    with that status would report it forever and the UI spinner would never
    stop. One statement at startup turns those into "nieudane", which the
    organizer can resolve by generating the guide again.
    """

    with connection() as conn:
        return conn.execute(
            _SWEEP_SQL, (json.dumps(AiStatus.FAILED.value), AiStatus.IN_PROGRESS.value)
        ).rowcount


def _carry_done_flags(generated: EGuideResponse, stored: dict[str, Any]) -> None:
    """Keep the ticks the organizer made while the model was working."""
    done = {item["id"]: bool(item.get("is_done")) for item in stored.get("organizer_checklist", []) if item.get("id")}
    completed = {role["role"]: list(role.get("completed_tasks") or []) for role in stored.get("team_checklists", []) if role.get("role")}
    for item in generated.organizer_checklist:
        item.is_done = done.get(item.id, False)
    for role in generated.team_checklists:
        role.completed_tasks = [task for task in completed.get(role.role, []) if task in role.tasks]


def _assert_covers_knowledge_base(generated: EGuideResponse, stored: dict[str, Any], allowed_ids: Iterable[str]) -> None:
    """Reject a generated guide that does not carry exactly the supplied items.

    ``check_coverage`` only rejects *invented* ids, so a model that silently
    DROPS a checklist item or renames a team role would pass it and take the
    organizer's ticks with it. Equality is the safe test here: anything else
    raises, and the caller keeps the base guide and reports "nieudane".
    """

    expected_items = set(allowed_ids)
    generated_items = {item.id for item in generated.organizer_checklist}
    if generated_items != expected_items:
        raise ValueError(
            "Model changed the organizer checklist: missing "
            f"{sorted(expected_items - generated_items)}, extra {sorted(generated_items - expected_items)}"
        )
    expected_roles = {role["role"] for role in stored.get("team_checklists", []) if role.get("role")}
    generated_roles = {role.role for role in generated.team_checklists}
    if generated_roles != expected_roles:
        raise ValueError(
            "Model changed the team roles: missing "
            f"{sorted(expected_roles - generated_roles)}, extra {sorted(generated_roles - expected_roles)}"
        )


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
        guide = event["eguide"]
        guide["ai_status"] = AiStatus.FAILED.value
        merge_event_fields(event_id, {"eguide": guide, "eguide_run_id": None}, expect_run_id=run_id)
    except Exception:
        logger.warning("Could not record the failed AI pass for event %s", event_id, exc_info=True)


def run_eguide_job(event_id: str, run_id: str) -> None:
    """Compose the guide text with Gemini; on any failure keep the base guide."""
    try:
        event = get_event(event_id)
        if not _owns_guide(event, run_id):
            return
        prompt = build_eguide_prompt(event)
        generated = _call_model_bounded(
            task="generate_eguide",
            prompt=prompt,
            schema=EGuideResponse,
            system_instruction="Compile the guide in Polish and preserve the deterministic impact_summary supplied by Python.",
            prompt_version="v1",
        )
        # The model call is slow: re-read, because the organizer may have edited
        # the event (which drops the guide) or ticked boxes in the meantime.
        event = get_event(event_id)
        if not _owns_guide(event, run_id):
            return
        _assert_covers_knowledge_base(generated, event["eguide"], prompt.allowed_ids)
        impact = EmissionsSummary(**build_impact(event))
        generated.event_id = event_id
        generated.impact_summary = impact
        generated.emissions_summary = impact
        generated.ustalenia = [Ustalenie.model_validate(item) for item in build_ustalenia(event)]
        # Team-maintained content the model may not touch: a free-text vendor_name
        # is schema-valid, so a company name could otherwise be served forever.
        generated.greenwashing_risk_matrix = [RiskFlag.model_validate(item) for item in GREENWASHING_RISKS]
        generated.contract_clauses_and_questions = [ContractClause.model_validate(item) for item in CONTRACT_CLAUSES]
        generated.ai_status = AiStatus.READY
        _carry_done_flags(generated, event["eguide"])
        # Field-scoped and nonce-guarded: a PATCH made while the model was working stays.
        merge_event_fields(
            event_id,
            {"eguide": generated.model_dump(), "eguide_run_id": None},
            expect_run_id=run_id,
        )
    except FutureTimeout:
        logger.warning("Gemini guide generation timed out for event %s, keeping the base guide", event_id)
        _mark_failed(event_id, run_id)
    except Exception:
        # A model that drifts from the knowledge base must never reach the organizer.
        logger.warning("Gemini guide generation failed for event %s, keeping the base guide", event_id, exc_info=True)
        _mark_failed(event_id, run_id)
