"""Deterministic before/after impact estimation. No AI, no invented numbers."""
from __future__ import annotations
from copy import deepcopy
from typing import Any
from ..mocks.knowledge_mocks import ECO_SUMMARY, EVENT_AREAS
from ..schemas import EcoMotivator

_CO2_REDUCTION_BY_LEVEL = {1: 1.0, 2: 2.5, 3: 4.0}


def build_impact(event: dict[str, Any]) -> dict[str, Any]:
    """Estimate the event footprint from the organizer's selected levels."""
    attendees = event.get("attendees", 120)
    selected = event.get("selected_options", {})
    saving_choices = 0
    co2_reduction = 0.0
    for area in EVENT_AREAS:
        level = selected.get(area["id"])
        item = next((option for option in area["levels"] if option["level"] == level), None)
        if item:
            if item["cost"] == "Obniża koszt":
                saving_choices += 1
            co2_reduction += _CO2_REDUCTION_BY_LEVEL.get(level, 0)
    scale = attendees / 100
    summary = deepcopy(ECO_SUMMARY)
    summary["kg_co2e_min"] = round(summary["kg_co2e_min"] * scale, 1)
    summary["kg_co2e_max"] = round(summary["kg_co2e_max"] * scale, 1)
    summary["optimized_kg_co2e_min"] = round(max(0, summary["kg_co2e_min"] - co2_reduction * scale), 1)
    summary["optimized_kg_co2e_max"] = round(max(0, summary["kg_co2e_max"] - co2_reduction * scale), 1)
    summary["saved_pln"] = round(summary["saved_pln"] * scale + saving_choices * 45, 2)
    squirrels = max(0, round(co2_reduction * attendees / 10))
    trees = max(0, round(co2_reduction * attendees / 35))
    saved_kg = round(co2_reduction * scale, 1)
    summary["eco_motivator"] = EcoMotivator(squirrels_saved=squirrels, trees_saved=trees, co2e_saved_kg=saved_kg, message=f"Twoje wybory oszczędzają około {saved_kg} kg CO2e, {squirrels} wiewiórek i {trees} drzew.")
    return summary
