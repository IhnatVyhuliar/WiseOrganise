"""Guide orchestration: the deterministic base guide, plus the optional background AI pass.

Content selection lives in checklist_builder, numbers in impact_service and
model context in ai_context. Keep this module free of either.
"""
from __future__ import annotations
import logging
from uuid import uuid4
from copy import deepcopy
from typing import Any
from ..mocks.knowledge_mocks import CONTRACT_CLAUSES, GREENWASHING_RISKS
from ..repositories.event_repo import save_event
from ..schemas import AiStatus, EGuideResponse, EmissionsSummary, OrganizerChecklistItem, TeamRoleChecklist, TimelineTask, Ustalenie, EventStatus
from ..core.config import settings
from .checklist_builder import build_organizer_checklist, build_team_checklists
from .impact_service import build_impact
from .ustalenia_service import build_ustalenia
from ..workers.ai_jobs import submit_eguide_job

logger = logging.getLogger(__name__)


def base_eguide(event: dict[str, Any], ai_status: AiStatus = AiStatus.DISABLED) -> EGuideResponse:
    """Build the deterministic guide. Pure: no save, no model call, no status change."""
    impact = EmissionsSummary(**build_impact(event))
    organizer = build_organizer_checklist(event)
    return EGuideResponse(
        event_id=event["id"],
        organizer_checklist=[OrganizerChecklistItem.model_validate(item) for item in organizer],
        team_checklists=[TeamRoleChecklist.model_validate(item) for item in build_team_checklists(event)],
        impact_summary=impact,
        emissions_summary=impact,
        greenwashing_risk_matrix=deepcopy(GREENWASHING_RISKS),
        timeline_tasks=[TimelineTask(milestone=item["milestone"], task=item["label"]) for item in organizer],
        contract_clauses_and_questions=deepcopy(CONTRACT_CLAUSES),
        ustalenia=[Ustalenie.model_validate(item) for item in build_ustalenia(event)],
        ai_status=ai_status,
    )


def compile_eguide(event: dict[str, Any]) -> EGuideResponse:
    """Store and return the base guide now; Gemini refines its text in the background."""
    ai_status = AiStatus.IN_PROGRESS if settings.gemini_enabled else AiStatus.DISABLED
    guide = base_eguide(event, ai_status)
    run_id = uuid4().hex if ai_status is AiStatus.IN_PROGRESS else None
    guide.ai_run_id = run_id
    event["eguide"] = guide.model_dump()
    event["status"] = EventStatus.GUIDE_READY
    save_event(event)
    if ai_status is AiStatus.IN_PROGRESS:
        try:
            submit_eguide_job(event["id"], run_id)
        except Exception:
            logger.warning("Could not schedule the Gemini pass", exc_info=True)
            guide.ai_status = AiStatus.FAILED
            guide.ai_run_id = None
            event["eguide"] = guide.model_dump()
            save_event(event)
    return guide


def get_eguide(event: dict[str, Any]) -> EGuideResponse:
    """Return the stored guide, building and storing the base guide on first read."""
    if event.get("eguide") is None:
        guide = base_eguide(event)
        event["eguide"] = guide.model_dump()
        save_event(event)
        return guide
    return EGuideResponse.model_validate(event["eguide"])
