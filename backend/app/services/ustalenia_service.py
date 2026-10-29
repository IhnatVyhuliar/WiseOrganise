"""Deterministic list of arrangements (ustalenia) chosen per lifecycle area."""
from __future__ import annotations
from typing import Any
from ..mocks.knowledge_mocks import EVENT_AREAS


def build_ustalenia(event: dict[str, Any]) -> list[dict[str, Any]]:
    """Return the chosen level of every selected area in canonical area order.

    The order is the declaration order of EVENT_AREAS, never the click order.
    Texts are copied verbatim from the knowledge base; nothing is generated.
    """
    selected = event.get("selected_options") or {}
    result: list[dict[str, Any]] = []
    for area in EVENT_AREAS:
        level = selected.get(area["id"])
        if level is None:
            continue
        option = next((o for o in area["levels"] if o["level"] == level), None)
        if option is None:
            continue
        result.append(
            {
                "area_id": area["id"],
                "area_name": area["name"],
                "level": option["level"],
                "level_label": option["label"],
                "justification": option["why"],
                "cost_effect": option["cost"],
            }
        )
    return result
