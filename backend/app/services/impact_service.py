"""Deterministic before/after impact estimation. No AI, no invented numbers."""
from __future__ import annotations
from copy import deepcopy
from typing import Any
from ..mocks.knowledge_mocks import ECO_SUMMARY, EVENT_AREAS
from ..schemas import EcoMotivator
from .checklist_builder import needed_area_ids

# Ambition weight of each level. Only the relative size matters: the weights are
# normalised against the best achievable total and never used as kilograms.
_AMBITION_BY_LEVEL = {1: 1.0, 2: 2.5, 3: 4.0}
_BEST_LEVEL_WEIGHT = max(_AMBITION_BY_LEVEL.values())

# Equivalence factors for the motivator, kept from the original guide copy.
# Both convert the SAME saving in kg CO2e, so the three motivator numbers
# always describe one quantity on one scale.
_KG_CO2E_PER_SQUIRREL = 10.0
_KG_CO2E_PER_TREE = 35.0

# PDF page 9, question 6: where the before/after numbers would really come from.
_PROVENANCE = [
    "Ankieta dojazdu uczestników",
    "Ważenie odpadów według frakcji",
    "Faktury i dane od dostawców",
]


def build_impact(event: dict[str, Any]) -> dict[str, Any]:
    """Estimate the event footprint from the organizer's selected levels.

    The baseline and the fully optimized footprint both come from ECO_SUMMARY.
    Selections move the estimate between those two ends as a share of the
    baseline, so the optimized range differs visibly from the baseline.
    """
    attendees = event.get("attendees", 120)
    selected = event.get("selected_options", {})
    saving_choices = 0
    ambition = 0.0
    # Only the areas this event actually needs are in scope. Scoring an event
    # against areas the organizer ruled out would cap its ambition at the share
    # of areas it declared, however good its choices are.
    in_scope = set(needed_area_ids(event))
    areas = [area for area in EVENT_AREAS if area["id"] in in_scope]
    for area in areas:
        level = selected.get(area["id"])
        item = next((option for option in area["levels"] if option["level"] == level), None)
        if item:
            if item["cost"] == "Obniża koszt":
                saving_choices += 1
            ambition += _AMBITION_BY_LEVEL.get(level, 0.0)
    area_count = len(areas) or 1
    best_total = area_count * _BEST_LEVEL_WEIGHT
    # 0.0 when nothing is selected, 1.0 when every area sits at "najlepiej".
    ambition_ratio = min(1.0, ambition / best_total) if best_total else 0.0
    cost_ratio = saving_choices / area_count

    scale = attendees / 100
    summary = deepcopy(ECO_SUMMARY)
    baseline_min = summary["kg_co2e_min"] * scale
    baseline_max = summary["kg_co2e_max"] * scale
    # Share of the baseline removed when every area sits at "najlepiej".
    best_cut_min = 1 - summary["optimized_kg_co2e_min"] / summary["kg_co2e_min"]
    best_cut_max = 1 - summary["optimized_kg_co2e_max"] / summary["kg_co2e_max"]
    optimized_min = max(0.0, baseline_min * (1 - best_cut_min * ambition_ratio))
    optimized_max = max(0.0, baseline_max * (1 - best_cut_max * ambition_ratio))

    summary["kg_co2e_min"] = round(baseline_min, 1)
    summary["kg_co2e_max"] = round(baseline_max, 1)
    summary["optimized_kg_co2e_min"] = round(optimized_min, 1)
    summary["optimized_kg_co2e_max"] = round(optimized_max, 1)
    # The money saving follows both how ambitious the levels are and how many of
    # the chosen levels are marked in the knowledge base as lowering cost.
    summary["saved_pln"] = round(ECO_SUMMARY["saved_pln"] * scale * (ambition_ratio + cost_ratio) / 2, 2)
    summary["provenance"] = list(_PROVENANCE)

    # One saving on one scale: the mid-range difference between before and after.
    saved_kg = max(0.0, round(((baseline_min - optimized_min) + (baseline_max - optimized_max)) / 2, 1))
    squirrels = max(0, round(saved_kg / _KG_CO2E_PER_SQUIRREL))
    trees = max(0, round(saved_kg / _KG_CO2E_PER_TREE))
    if saved_kg > 0:
        message = (
            f"Twoje wybory ograniczają szacowany ślad o około {saved_kg} kg CO2e. "
            f"To odpowiednik {squirrels} wiewiórek i {trees} drzew w naszej skali porównawczej."
        )
    else:
        message = (
            "Wybierz poziomy w obszarach kreatora, aby zobaczyć szacowaną różnicę "
            "między wpływem przed i po optymalizacji."
        )
    summary["eco_motivator"] = EcoMotivator(
        squirrels_saved=squirrels,
        trees_saved=trees,
        co2e_saved_kg=saved_kg,
        message=message,
    )
    return summary
