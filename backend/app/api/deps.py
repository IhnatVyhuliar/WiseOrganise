"""Shared FastAPI dependencies."""

from fastapi import HTTPException

from ..repositories.memory_repo import get_event


def get_event_or_404(event_id: str) -> dict:
    """Resolve an event identifier or raise a consistent 404 response."""

    event = get_event(event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return event
