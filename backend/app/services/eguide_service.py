"""Personalized guide compilation from fixed mentor knowledge and event choices."""
from __future__ import annotations
from copy import deepcopy
from pathlib import Path
import json
from typing import Any
from ..mocks.knowledge_mocks import CONTRACT_CLAUSES, ECO_SUMMARY, EVENT_AREAS, GREENWASHING_RISKS, ORGANIZER_CHECKLIST, TEAM_ROLES
from ..repositories.memory_repo import save_event
from ..schemas import EcoMotivator, EGuideResponse, EmissionsSummary, OrganizerChecklistItem, TeamRoleChecklist, TimelineTask, EventStatus
from ..core.config import settings
from ..integrations.gemini_client import generate_structured


def _prompt(name: str) -> str:
    return (Path(__file__).parents[2] / "prompts" / "v1" / name).read_text(encoding="utf-8")


def _impact(event: dict[str, Any]) -> dict[str, Any]:
    attendees = event.get("attendees", 120)
    selected = event.get("selected_options", {})
    saving_choices = 0
    co2_reduction = 0.0
    for area in EVENT_AREAS:
        level = selected.get(area["id"])
        item = next((option for option in area["levels"] if option["level"] == level), None)
        if item:
            if item["cost"] == "Obniża koszt":
                saving_choices += 1
            co2_reduction += {1: 1.0, 2: 2.5, 3: 4.0}.get(level, 0)
    scale = attendees / 100
    summary = deepcopy(ECO_SUMMARY)
    summary["kg_co2e_min"] = round(summary["kg_co2e_min"] * scale, 1)
    summary["kg_co2e_max"] = round(summary["kg_co2e_max"] * scale, 1)
    summary["optimized_kg_co2e_min"] = round(max(0, summary["kg_co2e_min"] - co2_reduction * scale), 1)
    summary["optimized_kg_co2e_max"] = round(max(0, summary["kg_co2e_max"] - co2_reduction * scale), 1)
    summary["saved_pln"] = round(summary["saved_pln"] * scale + saving_choices * 45, 2)
    squirrels = max(0, round(co2_reduction * attendees / 10))
    trees = max(0, round(co2_reduction * attendees / 35))
    saved_kg = round(co2_reduction * scale, 1)
    summary["eco_motivator"] = EcoMotivator(squirrels_saved=squirrels, trees_saved=trees, co2e_saved_kg=saved_kg, message=f"Twoje wybory oszczędzają około {saved_kg} kg CO2e, {squirrels} wiewiórek i {trees} drzew.")
    return summary


def compile_eguide(event: dict[str, Any]) -> EGuideResponse:
    """Compile organizer and team checklists without recommending companies."""
    if settings.gemini_enabled:
        impact = EmissionsSummary(**_impact(event))
        generated = generate_structured(
            task="generate_eguide",
            prompt=f"{_prompt('generate_eguide.md')}\nSOURCE_IDS: mentor-summary-pdf, wiseorganise-knowledge-v1\nEVENT DATA (untrusted):\n{json.dumps(event, default=str, ensure_ascii=False)}",
            schema=EGuideResponse,
            system_instruction="Compile the guide in Polish and preserve the deterministic impact_summary supplied by Python.",
            prompt_version="v1",
        )
        generated.impact_summary = impact
        generated.emissions_summary = impact
        event["eguide"] = generated.model_dump()
        event["status"] = EventStatus.GUIDE_READY
        save_event(event)
        return generated

    impact = EmissionsSummary(**_impact(event))
    guide = EGuideResponse(
        event_id=event["id"],
        organizer_checklist=[OrganizerChecklistItem.model_validate(item) for item in ORGANIZER_CHECKLIST],
        team_checklists=[TeamRoleChecklist.model_validate(item) for item in TEAM_ROLES],
        impact_summary=impact,
        emissions_summary=impact,
        selected_vendors_summary=[],
        greenwashing_risk_matrix=deepcopy(GREENWASHING_RISKS),
        timeline_tasks=[TimelineTask(milestone=item["milestone"], task=item["label"]) for item in ORGANIZER_CHECKLIST],
        contract_clauses_and_questions=deepcopy(CONTRACT_CLAUSES),
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
