"""Criteria and dynamic score compatibility schemas."""
from __future__ import annotations
from pydantic import Field
from . import APIModel
from .enums import Category, VerificationStatus

class VendorRecommendation(APIModel):
    """Compatibility model for neutral supplier categories, never a ranking."""
    rec_id: str
    vendor_id: str
    name: str
    category: Category
    distance_km: float = Field(ge=0)
    avg_cost_per_person: float = Field(ge=0)
    eco_score: float = Field(ge=0, le=100)
    trust_score: float = Field(ge=0, le=100)
    cost_score: float = Field(ge=0, le=100)
    total_score: float = Field(ge=0, le=100)
    verification_status: VerificationStatus
    certificates: list[str] = Field(default_factory=list)
    justification: str
    warnings: str
    questions: list[str] = Field(min_length=3, max_length=3)
    is_selected: bool = False

class CategoryRecommendationsResponse(APIModel):
    event_id: str
    categories: dict[str, list[VendorRecommendation]]
    selection_guidance: str
    criteria_only: bool = True

RecommendationsResponse = CategoryRecommendationsResponse
RecommendationList = CategoryRecommendationsResponse
