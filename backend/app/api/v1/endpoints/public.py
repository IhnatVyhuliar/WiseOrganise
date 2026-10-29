"""Read-only public view of a shared event, addressed by its short slug."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ....repositories.event_repo import get_event_by_slug
from ....schemas import PublicEventView
from ....services.public_view_service import build_public_view

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/events/{slug}", response_model=PublicEventView)
def get_public_event_endpoint(slug: str) -> PublicEventView:
    """Return the whitelisted public projection; any unknown or malformed slug is a 404."""

    event = get_event_by_slug(slug)
    if event is None:
        raise HTTPException(status_code=404, detail="Nie znaleziono wydarzenia o tym adresie.")
    return build_public_view(event)
