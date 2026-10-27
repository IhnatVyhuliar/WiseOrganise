"""Lifecycle option selection service."""
from __future__ import annotations
from typing import Any
from ..mocks.knowledge_mocks import EVENT_AREAS
from ..repositories.memory_repo import save_event
from ..schemas import AreaOptionsResponse, EventArea, EventResponse, NeededAreasUpdate, OptionSelectionPayload, OptionSelectionResponse
from .event_service import public_event

def options_response(event: dict[str, Any]) -> AreaOptionsResponse:
    return AreaOptionsResponse(event_id=event["id"], areas=[EventArea.model_validate(a) for a in EVENT_AREAS], selected_options=event.get("selected_options", {}))

def get_options(event: dict[str, Any]) -> AreaOptionsResponse:
    return options_response(event)

def select_options(event: dict[str, Any], payload: OptionSelectionPayload) -> OptionSelectionResponse:
    selections = {getattr(item.area_id, "value", item.area_id): item.level for item in payload.selections}
    event["selected_options"] = selections
    event["options"] = {"areas": EVENT_AREAS}
    event["recommendations"] = {}
    event["eguide"] = None
    save_event(event)
    saving = sum(1 for area in EVENT_AREAS if any(o["level"] == selections.get(area["id"]) and o["cost"] == "Obniża koszt" for o in area["levels"]))
    return OptionSelectionResponse(event_id=event["id"], selected_options=selections, cost_saving_choices=saving)

def select_needed_areas(event: dict[str, Any], payload: NeededAreasUpdate) -> EventResponse:
    """Record which lifecycle areas the organizer actually needs."""
    event["needed_areas"] = [getattr(area, "value", area) for area in payload.needed_areas]
    event["eguide"] = None
    save_event(event)
    return public_event(event)
