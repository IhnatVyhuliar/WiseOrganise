"""Process-local repository used by the prototype."""

from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4


# External persistence is intentionally deferred for this API stage.
EVENTS_DB: dict[str, dict[str, Any]] = {}


def utc_now() -> datetime:
    """Return a timezone-aware UTC timestamp."""

    return datetime.now(timezone.utc)


def create_event_record(data: dict[str, Any]) -> dict[str, Any]:
    """Create and persist a new draft event."""

    event_id = str(uuid4())
    now = utc_now()
    event = deepcopy(data)
    event.update(
        {
            "id": event_id,
            "status": "draft",
            "created_at": now,
            "updated_at": now,
            "checklist": None,
            "weights": {"w_eco": 0.4, "w_trust": 0.35, "w_cost": 0.25},
            "recommendations": {},
            "eguide": None,
            "selected_options": {},
            "options": None,
        }
    )
    EVENTS_DB[event_id] = event
    return event


def get_event(event_id: str) -> dict[str, Any] | None:
    """Return an event record when its identifier exists."""

    return EVENTS_DB.get(event_id)


def list_events() -> list[dict[str, Any]]:
    """Return all stored event records in creation order."""

    return list(EVENTS_DB.values())


def save_event(event: dict[str, Any]) -> dict[str, Any]:
    """Persist an existing event and refresh its timestamp."""

    event["updated_at"] = utc_now()
    EVENTS_DB[event["id"]] = event
    return event


def delete_event(event_id: str) -> bool:
    """Delete an event and report whether it existed."""

    return EVENTS_DB.pop(event_id, None) is not None
