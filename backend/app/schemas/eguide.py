"""Personalized e-guide, dual checklists and impact schemas."""

from __future__ import annotations

from pydantic import Field, model_validator

from . import APIModel

from .enums import AreaId, Category, FlagColor, Milestone



class EcoMotivator(APIModel):

    squirrels_saved: int = Field(ge=0)

    trees_saved: int = Field(ge=0)

    co2e_saved_kg: float = Field(ge=0)

    message: str

    metric_name: str = "wiewiórki uratowane"



    @model_validator(mode="before")

    @classmethod

    def accept_legacy_message(cls, value: object) -> object:

        if isinstance(value, str):

            return {"squirrels_saved": 0, "trees_saved": 0, "co2e_saved_kg": 0, "message": value}

        return value



class ImpactSummary(APIModel):

    kg_co2e_min: float = Field(ge=0)

    kg_co2e_max: float = Field(ge=0)

    optimized_kg_co2e_min: float = Field(ge=0)

    optimized_kg_co2e_max: float = Field(ge=0)

    saved_pln: float = Field(ge=0)

    emission_factor_sources: list[str] = Field(default_factory=list)

    eco_motivator: EcoMotivator



EmissionsSummary = ImpactSummary



class OrganizerChecklistItem(APIModel):

    id: str

    area: str

    label: str

    milestone: Milestone | None = None

    is_done: bool = False



class TeamRoleChecklist(APIModel):

    role: str

    contact: str

    tasks: list[str]

    completed_tasks: list[str] = Field(default_factory=list)



class RiskFlag(APIModel):

    vendor_name: str = "Neutralna kategoria dostawcy"

    claim: str

    flag: FlagColor

    explanation: str

    follow_up: str



class TimelineTask(APIModel):

    milestone: Milestone

    task: str

    is_done: bool = False



class ContractClause(APIModel):

    kind: str

    text: str



class SelectedVendorSummary(APIModel):

    """Compatibility projection; concrete brands are never promoted by the API."""

    rec_id: str

    vendor_id: str

    name: str

    category: Category

    total_score: float = Field(ge=0, le=100)

    is_selected: bool

    justification: str



class EGuideResponse(APIModel):

    event_id: str

    organizer_checklist: list[OrganizerChecklistItem] = Field(default_factory=list)

    team_checklists: list[TeamRoleChecklist] = Field(default_factory=list)

    impact_summary: ImpactSummary

    emissions_summary: ImpactSummary

    greenwashing_risk_matrix: list[RiskFlag] = Field(default_factory=list)

    timeline_tasks: list[TimelineTask] = Field(default_factory=list)

    contract_clauses_and_questions: list[ContractClause] = Field(default_factory=list)

    selected_vendors_summary: list[SelectedVendorSummary] = Field(default_factory=list)



EGuide = EGuideResponse

GreenwashingRisk = RiskFlag

RiskMatrix = RiskFlag

