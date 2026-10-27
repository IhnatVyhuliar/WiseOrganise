"""Area suggestion schemas for the description-driven creator step."""

from __future__ import annotations

from pydantic import Field

from . import APIModel

from .enums import AreaId


class AreaSuggestion(APIModel):
    """One lifecycle area the model proposes, with its grounded reason."""

    area_id: AreaId

    reason: str = Field(max_length=500)


class AreaSuggestionResponse(APIModel):
    """Always a 200: either suggestions, or a Polish reason why there are none.

    The organizer must never face a button that silently does nothing, so an
    unavailable model is reported as data rather than as an error status.
    """

    available: bool

    message: str

    suggestions: list[AreaSuggestion] = Field(default_factory=list)
