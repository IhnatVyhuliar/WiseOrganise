"""Pydantic v2 schemas exposed by the application."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict

def to_camel(value: str) -> str:
    """Convert snake_case contract names to frontend-friendly camelCase aliases."""
    head, *tail = value.split("_")
    return head + "".join(part[:1].upper() + part[1:] for part in tail)


class APIModel(BaseModel):
    """Base model configured for strict API serialization."""

    model_config = ConfigDict(
        use_enum_values=True,
        extra="forbid",
        populate_by_name=True,
        alias_generator=to_camel,
    )


ChecklistValue = bool | str | float | int | None

from .checklist import (  # noqa: E402
    ChecklistItem,
    ChecklistItemUpdate,
    ChecklistPatch,
    ChecklistResponse,
    ChecklistUpdatePayload,
    Weights,
)
from .eguide import (  # noqa: E402
    ChecklistDoneUpdate,
    ContractClause,
    ImpactSummary,
    OrganizerChecklistItem,
    TeamRoleChecklist,
    EcoMotivator,
    EGuide,
    EGuideResponse,
    EmissionsSummary,
    GreenwashingRisk,
    RiskFlag,
    RiskMatrix,
    SelectedVendorSummary,
    TimelineTask,
)
from .enums import (  # noqa: E402
    AnswerType,
    AreaId, CostEffect, LifecycleStage, SixR,
    Category,
    ChecklistCategory,
    EventStatus,
    FlagColor,
    Milestone,
    VerificationStatus,
)
from .event import EventCreate, EventPatch, EventResponse, EventUpdate, NeededAreasUpdate, PilotContext  # noqa: E402
from .options import AreaOptionsResponse, EventArea, OptionLevel, OptionSelection, OptionSelectionPayload, OptionSelectionResponse  # noqa: E402
from .criteria import AreaVerification, CriteriaResponse, VendorCriterion  # noqa: E402
from .recommendation import (  # noqa: E402
    CategoryRecommendationsResponse,
    RecommendationList,
    RecommendationsResponse,
    VendorRecommendation,
)

__all__ = [
    "APIModel", "ChecklistValue", "EventStatus", "ChecklistCategory", "Category",
    "AnswerType", "AreaId", "CostEffect", "LifecycleStage", "SixR", "VerificationStatus", "FlagColor", "Milestone", "EventCreate",
    "EventUpdate", "EventPatch", "EventResponse", "NeededAreasUpdate", "PilotContext", "ChecklistItem", "ChecklistItemUpdate",
    "ChecklistResponse", "ChecklistUpdatePayload", "ChecklistPatch", "Weights",
    "VendorRecommendation", "CategoryRecommendationsResponse", "RecommendationsResponse",
    "RecommendationList", "EmissionsSummary", "EcoMotivator", "SelectedVendorSummary",
    "GreenwashingRisk", "RiskFlag", "RiskMatrix", "TimelineTask", "ContractClause", "ChecklistDoneUpdate",
    "EGuide", "EGuideResponse", "ImpactSummary", "OrganizerChecklistItem", "TeamRoleChecklist", "EventArea", "OptionLevel", "AreaOptionsResponse", "OptionSelection", "OptionSelectionPayload", "OptionSelectionResponse", "VendorCriterion", "AreaVerification", "CriteriaResponse",
]
