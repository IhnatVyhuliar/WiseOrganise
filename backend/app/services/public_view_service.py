"""Whitelisted, read-only projection of an event for public sharing."""
from __future__ import annotations
from typing import Any
from ..schemas.public import PublicEventHeader, PublicEventView
from ..schemas import EGuideResponse
from .eguide_service import base_eguide


def _build_guide(event: dict[str, Any]) -> EGuideResponse:
    """The stored guide when there is one, else the base guide in memory: no save, no model call."""
    if event.get("eguide"):
        return EGuideResponse.model_validate(event["eguide"])
    return base_eguide(event)


def build_public_view(event: dict[str, Any]) -> PublicEventView:
    """Expose only header, ustalenia, checklists and impact; nothing else leaks."""
    guide = _build_guide(event)
    header = PublicEventHeader.model_validate({key: event[key] for key in PublicEventHeader.model_fields})
    return PublicEventView(
        **header.model_dump(),
        ustalenia=guide.ustalenia,
        organizer_checklist=guide.organizer_checklist,
        team_checklists=guide.team_checklists,
        impact_summary=guide.impact_summary,
    )
