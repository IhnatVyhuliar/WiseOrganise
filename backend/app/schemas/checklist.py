"""Step two checklist and scoring schemas."""

from __future__ import annotations

from pydantic import Field, model_validator

from . import APIModel, ChecklistValue
from .enums import AnswerType, Category


class ChecklistItem(APIModel):
    """One sustainability question generated for an event."""

    id: str
    category: Category
    question: str
    answer_type: AnswerType
    options: list[str] = Field(default_factory=list)
    why_it_matters: str
    suggested_response: ChecklistValue = None
    user_response: ChecklistValue = None
    priority: int = Field(default=3, ge=1, le=5)
    is_completed: bool = False


class ChecklistItemUpdate(APIModel):
    """User changes for one checklist question."""

    id: str
    user_response: ChecklistValue = None
    priority: int | None = Field(default=None, ge=1, le=5)
    accept_suggestion: bool = False


class Weights(APIModel):
    """Compatibility weights retained for older checklist clients."""

    w_eco: float = Field(ge=0, le=1)
    w_trust: float = Field(ge=0, le=1)
    w_cost: float = Field(ge=0, le=1)

    @model_validator(mode="after")
    def validate_sum(self) -> "Weights":
        """Ensure optional compatibility weights form a probability distribution."""

        if abs(self.w_eco + self.w_trust + self.w_cost - 1) > 1e-6:
            raise ValueError("w_eco, w_trust and w_cost must sum to 1.0")
        return self


class ChecklistUpdatePayload(APIModel):
    """Answers and optional compatibility weights submitted by the user."""

    items: list[ChecklistItemUpdate] = Field(default_factory=list)
    weights: Weights | None = None
    use_ai_suggestions: bool = True
    w_eco: float | None = Field(default=None, ge=0, le=1)
    w_trust: float | None = Field(default=None, ge=0, le=1)
    w_cost: float | None = Field(default=None, ge=0, le=1)

    @model_validator(mode="after")
    def validate_weights(self) -> "ChecklistUpdatePayload":
        """Validate either a complete flat or nested weight payload."""

        supplied = (self.w_eco, self.w_trust, self.w_cost)
        if any(value is not None for value in supplied):
            if not all(value is not None for value in supplied):
                raise ValueError("Provide all three scoring weights together")
            Weights(w_eco=self.w_eco, w_trust=self.w_trust, w_cost=self.w_cost)
        if self.weights is not None and any(value is not None for value in supplied):
            raise ValueError("Provide weights either nested or as flat fields")
        return self

    def resolved_weights(self) -> Weights | None:
        """Return the supplied weights in one consistent representation."""

        if self.weights is not None:
            return self.weights
        if self.w_eco is not None:
            return Weights(w_eco=self.w_eco, w_trust=self.w_trust, w_cost=self.w_cost)
        return None


class ChecklistResponse(Weights):
    """Checklist questions and current compatibility weights."""

    event_id: str
    items: list[ChecklistItem]


ChecklistPatch = ChecklistUpdatePayload
