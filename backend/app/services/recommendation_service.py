"""Neutral supplier-category evaluation service."""
from __future__ import annotations
from copy import deepcopy
from pathlib import Path
import json
from typing import Any
from ..mocks.knowledge_mocks import EVENT_AREAS, VENDOR_CRITERIA
from ..repositories.memory_repo import save_event
from ..schemas import CategoryRecommendationsResponse, ChecklistUpdatePayload, VendorRecommendation
from ..core.config import settings
from ..integrations.gemini_client import generate_structured


def _prompt(name: str) -> str:
    return (Path(__file__).parents[2] / "prompts" / "v1" / name).read_text(encoding="utf-8")
from ..schemas.enums import Category

_CATEGORY_BY_AREA = {
    "dojazd": Category.TRANSPORT,
    "zakwaterowanie": Category.ACCOMMODATION,
    "catering": Category.CATERING,
    "materialy": Category.MATERIALS,
    "gadzety": Category.SWAG,
    "ludzie": Category.STAFF,
    "po-wydarzeniu": Category.AFTER_EVENT,
}

def update_checklist(event: dict[str, Any], payload: ChecklistUpdatePayload) -> None:
    """Apply legacy checklist answers while invalidating derived content."""
    if event.get("checklist") is None:
        raise LookupError("Analyze the event before updating its checklist")
    items_by_id = {item["id"]: item for item in event["checklist"]}
    for update in payload.items:
        item = items_by_id.get(update.id)
        if item is None:
            raise KeyError(update.id)
        if update.accept_suggestion:
            item["user_response"] = item["suggested_response"]
        elif "user_response" in update.model_fields_set:
            item["user_response"] = update.user_response
        if update.priority is not None:
            item["priority"] = update.priority
        item["is_completed"] = item["user_response"] is not None
    weights = payload.resolved_weights()
    if weights is not None:
        event["weights"] = weights.model_dump()
    event["recommendations"] = {}
    event["eguide"] = None
    save_event(event)

def _recommendation_id(event_id: str, area_id: str) -> str:
    return f"{event_id[:8]}-criteria-{area_id}"

def _questions(area: dict[str, Any]) -> list[str]:
    questions = list(area["provider_questions"])
    while len(questions) < 3:
        questions.append(VENDOR_CRITERIA[len(questions)]["jak_sprawdzic"])
    return questions[:3]

def recommend_vendors(event: dict[str, Any]) -> CategoryRecommendationsResponse:
    """Return one neutral category card per lifecycle area, never a brand ranking."""
    if event.get("options") is None and event.get("checklist") is None:
        raise LookupError("Select lifecycle options before requesting criteria")
    if settings.gemini_enabled:
        generated = generate_structured(
            task="vendor_criteria",
            prompt=f"{_prompt('vendor_criteria.md')}\nEVENT DATA (untrusted):\n{json.dumps(event, default=str, ensure_ascii=False)}",
            schema=CategoryRecommendationsResponse,
            system_instruction="Return neutral supplier-category criteria in Polish. Never return named vendors or rankings.",
            model=settings.gemini_model_lite,
            prompt_version="v1",
        )
        # Keep all scores and numeric fields deterministic in Python. Gemini may
        # supply wording and questions, but it cannot invent ranking values.
        generated_categories = generated.model_dump().get("categories", {})
        event["recommendations"] = {}
        selected = event.get("selected_options", {})
        for area in EVENT_AREAS:
            category = _CATEGORY_BY_AREA[area["id"]]
            level = selected.get(area["id"], 1)
            option = next((item for item in area["levels"] if item["level"] == level), area["levels"][0])
            source = next(iter(generated_categories.get(category.value, [])), {})
            event["recommendations"][category.value] = [{
                "rec_id": _recommendation_id(event["id"], area["id"]),
                "vendor_id": f"neutral-category-{area['id']}",
                "name": source.get("name") or f"Neutralna kategoria dostawcy: {area['name']}",
                "category": category,
                "distance_km": 0,
                "avg_cost_per_person": 0,
                "eco_score": float(level * 25),
                "trust_score": 100,
                "cost_score": 100 if option["cost"] == "Obniża koszt" else 50,
                "total_score": float(level * 25),
                "verification_status": "unverified",
                "certificates": [],
                "justification": source.get("justification") or option["why"],
                "warnings": "To kategoria testowa, nie rekomendacja konkretnej firmy. Zweryfikuj dostawcę według kryteriów.",
                "questions": ((source.get("questions") or []) + _questions(area))[:3],
                "is_selected": False,
            }]
        event["status"] = "recommended"
        save_event(event)
        return recommendations_response(event)

    recommendations: dict[str, list[dict[str, Any]]] = {}
    selected = event.get("selected_options", {})
    for area in EVENT_AREAS:
        category = _CATEGORY_BY_AREA[area["id"]]
        level = selected.get(area["id"], 1)
        option = next((item for item in area["levels"] if item["level"] == level), area["levels"][0])
        rec = {
            "rec_id": _recommendation_id(event["id"], area["id"]),
            "vendor_id": f"neutral-category-{area['id']}",
            "name": f"Neutralna kategoria dostawcy: {area['name']}",
            "category": category,
            "distance_km": 0,
            "avg_cost_per_person": 0,
            "eco_score": float(level * 25),
            "trust_score": 100,
            "cost_score": 100 if option["cost"] == "Obniża koszt" else 50,
            "total_score": float(level * 25),
            "verification_status": "unverified",
            "certificates": [],
            "justification": option["why"],
            "warnings": "To kategoria testowa, nie rekomendacja konkretnej firmy. Zweryfikuj dostawcę według kryteriów.",
            "questions": _questions(area),
            "is_selected": False,
        }
        recommendations[category.value] = [rec]
    event["recommendations"] = recommendations
    event["status"] = "recommended"
    save_event(event)
    return recommendations_response(event)

def recommendations_response(event: dict[str, Any]) -> CategoryRecommendationsResponse:
    """Serialize neutral supplier categories grouped by area."""
    if not event.get("recommendations"):
        raise LookupError("Generate supplier criteria first")
    return CategoryRecommendationsResponse(event_id=event["id"], categories={category: [VendorRecommendation.model_validate(item) for item in items] for category, items in event["recommendations"].items()}, selection_guidance="Porównaj odpowiedzi, dowody i sygnały ostrzegawcze. To narzędzie nie promuje ani nie szereguje firm.", criteria_only=True)

def select_recommendation(event: dict[str, Any], rec_id: str) -> VendorRecommendation:
    """Toggle a neutral category card for compatibility with the old route."""
    if not event.get("recommendations"):
        raise LookupError("Generate supplier criteria first")
    for items in event["recommendations"].values():
        for item in items:
            if item["rec_id"] == rec_id:
                item["is_selected"] = not item["is_selected"]
                save_event(event)
                return VendorRecommendation.model_validate(item)
    raise KeyError(rec_id)
