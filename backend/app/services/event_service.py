"""Business logic for event creation and checklist generation."""

from __future__ import annotations

from copy import deepcopy
from typing import Any

from ..mocks.checklist_mocks import checklist_fixtures
from ..repositories.event_repo import create_event_record, ensure_slug, save_event
from ..schemas import ChecklistItem, ChecklistResponse, ChecklistUpdatePayload, EventCreate, EventResponse, EventStatus
from ..core.config import settings
from ..integrations.gemini_client import generate_structured
from .ai_context import build_analyze_prompt
from .eguide_service import invalidate_eguide


# Editing these invalidates the legacy conditional checklist.
_CHECKLIST_FIELDS = ("raw_description", "needs_venue_help", "event_date", "location", "pilot", "attendees")

# Editing these makes an already compiled guide wrong. A title or description
# edit does not, so it must not destroy the organizer's level choices.
_GUIDE_FIELDS = ("needed_areas", "attendees", "pilot", "event_date", "location")


def public_event(event: dict[str, Any]) -> EventResponse:
    """Serialize an internal event record to its public response model."""

    ensure_slug(event)
    fields = set(EventResponse.model_fields)
    data = {key: value for key, value in event.items() if key in fields}
    # share_url is derived from the slug, never stored on the record.
    data["share_url"] = f"{settings.public_base_url.rstrip('/')}/w/{event['slug']}"
    return EventResponse.model_validate(data)


def create_event(payload: EventCreate) -> EventResponse:
    """Create a draft event in the memory repository."""

    record = create_event_record(payload.model_dump())
    record.setdefault("selected_options", {})
    return public_event(record)


def update_event(event: dict[str, Any], changes: dict[str, Any]) -> EventResponse:
    """Apply editable event fields and preserve a valid time interval."""

    candidate = {**event, **changes}
    if candidate.get("start_at") and candidate.get("end_at") and candidate["end_at"] <= candidate["start_at"]:
        raise ValueError("end_at must be later than start_at")
    event.update(changes)
    invalidates_checklist = any(key in changes for key in _CHECKLIST_FIELDS)
    invalidates_guide = any(key in changes for key in _GUIDE_FIELDS)
    if invalidates_checklist:
        event["checklist"] = None
    if invalidates_guide:
        event["recommendations"] = {}
        event["selected_options"] = {}
        invalidate_eguide(event)
    if invalidates_checklist or invalidates_guide:
        event["status"] = EventStatus.CHECKLIST_PENDING if event.get("checklist") is not None else EventStatus.DRAFT
    return public_event(save_event(event))


def analyze_event(event: dict[str, Any]) -> ChecklistResponse:
    """Generate static conditional checklist items and advance workflow state."""

    if settings.gemini_enabled:
        generated = generate_structured(
            task="analyze_event",
            prompt=build_analyze_prompt(event),
            schema=ChecklistResponse,
            system_instruction="Generate checklist questions in Polish. Keep weights at the supplied deterministic defaults.",
            prompt_version="v1",
        )
        event["checklist"] = [item.model_dump() for item in generated.items]
        # Weights are application policy, never model output.
        event["weights"] = {"w_eco": 0.4, "w_trust": 0.35, "w_cost": 0.25}
    else:
        event["checklist"] = []
        for fixture in checklist_fixtures(event["needs_venue_help"]):
            item = deepcopy(fixture)
            item["user_response"] = None
            item["is_completed"] = False
            event["checklist"].append(item)
    event["recommendations"] = {}
    invalidate_eguide(event)
    event["status"] = EventStatus.CHECKLIST_PENDING
    save_event(event)
    return checklist_response(event)


def checklist_response(event: dict[str, Any]) -> ChecklistResponse:
    """Build a typed checklist response from event state."""

    if event.get("checklist") is None:
        raise LookupError("Analyze the event before accessing its checklist")
    return ChecklistResponse(
        event_id=event["id"],
        items=[ChecklistItem.model_validate(item) for item in event["checklist"]],
        **event["weights"],
    )


def update_checklist(event: dict[str, Any], payload: ChecklistUpdatePayload) -> None:
    """Apply legacy checklist answers while invalidating derived content."""
    if event.get("checklist") is None:
        raise LookupError("Analyze the event before updating its checklist")
    items_by_id = {item["id"]: item for item in event["checklist"]}
    for update in payload.items:
        item = items_by_id.get(update.id)
        if item is None:
            raise KeyError(update.id)
        if update.accept_suggestion:
            item["user_response"] = item["suggested_response"]
        elif "user_response" in update.model_fields_set:
            item["user_response"] = update.user_response
        if update.priority is not None:
            item["priority"] = update.priority
        item["is_completed"] = item["user_response"] is not None
    weights = payload.resolved_weights()
    if weights is not None:
        event["weights"] = weights.model_dump()
    event["recommendations"] = {}
    invalidate_eguide(event)
    save_event(event)
