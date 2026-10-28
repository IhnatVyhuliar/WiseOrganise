"""HTTP handlers for all four event creator steps."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from ....api.deps import get_event_or_404
from ....repositories.event_repo import delete_event, list_events
from ....schemas import (
    ChecklistResponse,
    ChecklistUpdatePayload,
    CategoryRecommendationsResponse,
    EGuideResponse,
    EmissionsSummary,
    EventCreate,
    EventResponse,
    EventUpdate,
    VendorRecommendation,
    AreaOptionsResponse, OptionSelectionPayload, OptionSelectionResponse, CriteriaResponse,
    ChecklistDoneUpdate, NeededAreasUpdate,
    AreaSuggestionResponse,
)
from ....services.eguide_service import compile_eguide, get_eguide
from ....services.suggestion_service import suggest_areas
from ....services.event_service import (
    analyze_event,
    checklist_response,
    create_event,
    public_event,
    update_event,
)
from ....services.options_service import get_options, select_needed_areas, select_options
from ....services.checklist_builder import set_done
from ....services.impact_service import build_impact
from ....services.criteria_service import get_criteria
from ....services.recommendation_service import (
    recommend_vendors,
    recommendations_response,
    select_recommendation,
    update_checklist,
)


router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[EventResponse])
def list_event_endpoint() -> list[EventResponse]:
    """List all draft and completed events in memory."""

    return [public_event(event) for event in list_events()]


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event_endpoint(payload: EventCreate) -> EventResponse:
    """Create a new draft event."""

    return create_event(payload)




@router.get("/{event_id}/options", response_model=AreaOptionsResponse)
def get_options_endpoint(event_id: str) -> AreaOptionsResponse:
    """Return the seven lifecycle areas and three levels per area."""
    return get_options(get_event_or_404(event_id))


@router.patch("/{event_id}/options", response_model=OptionSelectionResponse)
def select_options_endpoint(event_id: str, payload: OptionSelectionPayload) -> OptionSelectionResponse:
    """Persist the organizer's level choices for lifecycle areas."""
    return select_options(get_event_or_404(event_id), payload)


@router.get("/criteria", response_model=CriteriaResponse)
def criteria_endpoint() -> CriteriaResponse:
    """Return neutral supplier criteria and anti-greenwashing questions."""
    return get_criteria()

@router.get("/{event_id}", response_model=EventResponse)
def get_event_endpoint(event_id: str) -> EventResponse:
    """Retrieve one event."""

    return public_event(get_event_or_404(event_id))


@router.patch("/{event_id}", response_model=EventResponse)
def update_event_endpoint(event_id: str, payload: EventUpdate) -> EventResponse:
    """Update editable event details."""

    try:
        return update_event(get_event_or_404(event_id), payload.model_dump(exclude_unset=True))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event_endpoint(event_id: str) -> None:
    """Delete an event from the process-local repository."""

    get_event_or_404(event_id)
    delete_event(event_id)


@router.post("/{event_id}/analyze", response_model=ChecklistResponse)
def analyze_event_endpoint(event_id: str) -> ChecklistResponse:
    """Generate the static checklist for an event."""

    return analyze_event(get_event_or_404(event_id))


@router.get("/{event_id}/checklist", response_model=ChecklistResponse)
def get_checklist_endpoint(event_id: str) -> ChecklistResponse:
    """Return legacy checklist questions and current weights."""

    try:
        return checklist_response(get_event_or_404(event_id))
    except LookupError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.patch("/{event_id}/checklist", response_model=ChecklistResponse)
def update_checklist_endpoint(event_id: str, payload: ChecklistUpdatePayload) -> ChecklistResponse:
    """Save checklist answers and scoring weights."""

    event = get_event_or_404(event_id)
    try:
        update_checklist(event, payload)
        return checklist_response(event)
    except LookupError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except KeyError as exc:
        raise HTTPException(status_code=422, detail=f"Unknown checklist item: {exc.args[0]}") from exc


@router.post("/{event_id}/recommend", response_model=CategoryRecommendationsResponse)
def recommend_event_endpoint(event_id: str) -> CategoryRecommendationsResponse:
    """Generate neutral supplier-category evaluation cards."""

    try:
        return recommend_vendors(get_event_or_404(event_id))
    except LookupError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get("/{event_id}/recommendations", response_model=CategoryRecommendationsResponse)
def get_recommendations_endpoint(event_id: str) -> CategoryRecommendationsResponse:
    """Return neutral supplier-category evaluation cards."""

    try:
        return recommendations_response(get_event_or_404(event_id))
    except LookupError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.post("/{event_id}/recommendations/{rec_id}/select", response_model=VendorRecommendation)
def select_recommendation_endpoint(event_id: str, rec_id: str) -> VendorRecommendation:
    """Toggle a neutral supplier-category card for compatibility."""

    try:
        return select_recommendation(get_event_or_404(event_id), rec_id)
    except LookupError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Recommendation not found") from exc


@router.post("/{event_id}/eguide", response_model=EGuideResponse)
def generate_eguide_endpoint(event_id: str) -> EGuideResponse:
    """Compile the final structured eco-guide."""

    try:
        return compile_eguide(get_event_or_404(event_id))
    except LookupError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.post("/{event_id}/suggest-areas", response_model=AreaSuggestionResponse)
def suggest_areas_endpoint(event_id: str) -> AreaSuggestionResponse:
    """Propose lifecycle areas from the organizer's own description.

    Always 200: an unavailable model is reported in the body so the creator can
    explain itself instead of leaving the organizer with a dead button.
    """

    return suggest_areas(get_event_or_404(event_id))


@router.patch("/{event_id}/needed-areas", response_model=EventResponse)
def select_needed_areas_endpoint(event_id: str, payload: NeededAreasUpdate) -> EventResponse:
    """Record which lifecycle areas this event actually needs."""

    return select_needed_areas(get_event_or_404(event_id), payload)


@router.patch("/{event_id}/eguide/checklist", response_model=EGuideResponse)
def set_checklist_done_endpoint(event_id: str, payload: ChecklistDoneUpdate) -> EGuideResponse:
    """Persist a single checkbox toggle from the guide view."""

    try:
        return EGuideResponse.model_validate(set_done(get_event_or_404(event_id), payload))
    except LookupError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Checklist item not found") from exc


@router.get("/{event_id}/impact", response_model=EmissionsSummary)
def impact_endpoint(event_id: str) -> EmissionsSummary:
    """Return the deterministic before/after impact estimate."""

    return EmissionsSummary(**build_impact(get_event_or_404(event_id)))


@router.get("/{event_id}/eguide", response_model=EGuideResponse)
def get_eguide_endpoint(event_id: str) -> EGuideResponse:
    """Return a previously generated eco-guide."""

    try:
        return get_eguide(get_event_or_404(event_id))
    except LookupError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
