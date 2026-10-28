"""Whitelisted, read-only projection of an event for public sharing."""
from __future__ import annotations
from typing import Any
from ..schemas.public import PublicEventHeader, PublicEventView
from .eguide_service import compile_eguide as _build_guide  # Task 4 repoints this one line.


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
