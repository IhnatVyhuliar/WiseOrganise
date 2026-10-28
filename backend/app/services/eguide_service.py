"""Guide orchestration: picks the AI or the deterministic path, nothing else.

Content selection lives in checklist_builder, numbers in impact_service and
model context in ai_context. Keep this module free of either.
"""
from __future__ import annotations
import logging
from copy import deepcopy
from typing import Any
from ..mocks.knowledge_mocks import CONTRACT_CLAUSES, GREENWASHING_RISKS
from ..repositories.event_repo import save_event
from ..schemas import EGuideResponse, EmissionsSummary, OrganizerChecklistItem, TeamRoleChecklist, TimelineTask, Ustalenie, EventStatus
from ..core.config import settings
from ..integrations.gemini_client import generate_structured
from .ai_context import build_eguide_prompt
from .checklist_builder import build_organizer_checklist, build_team_checklists
from .impact_service import build_impact
from .ustalenia_service import build_ustalenia

logger = logging.getLogger(__name__)


def compile_eguide(event: dict[str, Any]) -> EGuideResponse:
    """Compile organizer and team checklists without recommending companies."""
    impact = EmissionsSummary(**build_impact(event))
    ustalenia = build_ustalenia(event)
    if settings.gemini_enabled:
        try:
            generated = generate_structured(
                task="generate_eguide",
                prompt=build_eguide_prompt(event),
                schema=EGuideResponse,
                system_instruction="Compile the guide in Polish and preserve the deterministic impact_summary supplied by Python.",
                prompt_version="v1",
            )
        except Exception:
            # A model that drifts from the knowledge base must never reach the
            # organizer. Fall through to the deterministic guide instead.
            logger.warning("Gemini guide generation rejected, using the deterministic guide", exc_info=True)
        else:
            generated.impact_summary = impact
            generated.emissions_summary = impact
            generated.ustalenia = [Ustalenie.model_validate(item) for item in ustalenia]
            event["eguide"] = generated.model_dump()
            event["status"] = EventStatus.GUIDE_READY
            save_event(event)
            return generated

    organizer = build_organizer_checklist(event)
    guide = EGuideResponse(
        event_id=event["id"],
        organizer_checklist=[OrganizerChecklistItem.model_validate(item) for item in organizer],
        team_checklists=[TeamRoleChecklist.model_validate(item) for item in build_team_checklists(event)],
        impact_summary=impact,
        emissions_summary=impact,
        greenwashing_risk_matrix=deepcopy(GREENWASHING_RISKS),
        timeline_tasks=[TimelineTask(milestone=item["milestone"], task=item["label"]) for item in organizer],
        contract_clauses_and_questions=deepcopy(CONTRACT_CLAUSES),
        ustalenia=[Ustalenie.model_validate(item) for item in ustalenia],
    )
    event["eguide"] = guide.model_dump()
    event["status"] = EventStatus.GUIDE_READY
    save_event(event)
    return guide


def get_eguide(event: dict[str, Any]) -> EGuideResponse:
    """Return a previously generated guide."""
    if event.get("eguide") is None:
        raise LookupError("Generate the e-guide first")
    return EGuideResponse.model_validate(event["eguide"])
