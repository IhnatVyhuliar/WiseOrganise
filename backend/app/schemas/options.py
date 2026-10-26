"""Lifecycle areas and three-level option schemas."""

from __future__ import annotations

from pydantic import Field

from . import APIModel

from .enums import AreaId, CostEffect, LifecycleStage, SixR



class OptionLevel(APIModel):

    level: int = Field(ge=1, le=3)

    label: str

    description: str

    why: str

    cost: CostEffect

    tags: list[str] = Field(default_factory=list)

    use_ai_suggestions: bool = True

    six_r: list[SixR] = Field(default_factory=list)



class EventArea(APIModel):

    id: AreaId

    name: str

    stage: LifecycleStage

    lead: str

    levels: list[OptionLevel] = Field(min_length=3, max_length=3)

    provider_questions: list[str] = Field(default_factory=list, serialization_alias="providerQuestions")

    note: str | None = None



class AreaOptionsResponse(APIModel):

    event_id: str

    areas: list[EventArea]

    selected_options: dict[AreaId, int] = Field(default_factory=dict, serialization_alias="selectedOptions")



class OptionSelection(APIModel):

    area_id: AreaId

    level: int = Field(ge=1, le=3)

    use_ai_suggestions: bool = True



class OptionSelectionPayload(APIModel):

    selections: list[OptionSelection] = Field(default_factory=list)



class OptionSelectionResponse(APIModel):

    event_id: str

    selected_options: dict[AreaId, int]

    cost_saving_choices: int

