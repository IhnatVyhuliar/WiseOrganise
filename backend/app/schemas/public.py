"""Schemas for the read-only public event view."""

from __future__ import annotations

from datetime import date

from pydantic import Field

from . import APIModel
# Ustalenie is defined beside EGuideResponse (which embeds it) and re-exported here.
from .eguide import ImpactSummary, OrganizerChecklistItem, TeamRoleChecklist, Ustalenie

__all__ = ["PublicEventHeader", "PublicEventView", "Ustalenie"]


class PublicEventHeader(APIModel):
    """The only event fields a public visitor may see."""

    title: str
    event_type: str
    event_date: date
    location: str
    attendees: int


class PublicEventView(PublicEventHeader):
    """Strict whitelist: header, ustalenia, checklists and impact summary."""

    ustalenia: list[Ustalenie] = Field(default_factory=list)
    organizer_checklist: list[OrganizerChecklistItem] = Field(default_factory=list)
    team_checklists: list[TeamRoleChecklist] = Field(default_factory=list)
    impact_summary: ImpactSummary
