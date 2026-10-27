"""Assembly of the organizer and team checklists from the fixed knowledge base.

Owner of the "checklist follows the organizer's decisions" logic. The guide
service only orchestrates; the selection rules live here.
"""
from __future__ import annotations
from copy import deepcopy
from typing import Any
from ..mocks.knowledge_mocks import EVENT_AREAS, ORGANIZER_CHECKLIST, TEAM_ROLES
from ..repositories.memory_repo import save_event
from ..schemas import ChecklistDoneUpdate

ALL_AREA_IDS: list[str] = [area["id"] for area in EVENT_AREAS]

#: Chronological order of the lifecycle milestones used to sort the checklist.
MILESTONE_ORDER: list[str] = ["T-60", "T-30", "T-7", "T-0", "T+7"]

#: Keys of a knowledge-base entry that are internal to the selection rules and
#: must not reach the API schemas, which forbid unknown fields.
_ORGANIZER_INTERNAL_KEYS = ("min_level",)
_TEAM_INTERNAL_KEYS = ("task_areas",)


def needed_area_ids(event: dict[str, Any]) -> list[str]:
    """Lifecycle areas the organizer declared they need.

    A missing or empty value means the organizer has not narrowed anything
    down yet, so every area still applies.
    """
    declared = event.get("needed_areas") or []
    selected = [getattr(area, "value", area) for area in declared]
    kept = [area_id for area_id in ALL_AREA_IDS if area_id in selected]
    return kept or list(ALL_AREA_IDS)


def _chosen_level(event: dict[str, Any], area_id: str | None) -> int:
    """Level the organizer picked for an area; 1 when nothing is picked yet."""
    if area_id is None:
        return 1
    selected = event.get("selected_options") or {}
    level = selected.get(area_id)
    return level if isinstance(level, int) and level > 0 else 1


def _stored_organizer_flags(event: dict[str, Any]) -> dict[str, bool]:
    guide = event.get("eguide") or {}
    return {
        item["id"]: bool(item.get("is_done"))
        for item in guide.get("organizer_checklist", [])
        if item.get("id")
    }


def _stored_team_flags(event: dict[str, Any]) -> dict[str, list[str]]:
    guide = event.get("eguide") or {}
    return {
        role["role"]: list(role.get("completed_tasks") or [])
        for role in guide.get("team_checklists", [])
        if role.get("role")
    }


def _milestone_rank(item: dict[str, Any]) -> int:
    milestone = item.get("milestone")
    return MILESTONE_ORDER.index(milestone) if milestone in MILESTONE_ORDER else len(MILESTONE_ORDER)


def build_organizer_checklist(event: dict[str, Any]) -> list[dict[str, Any]]:
    """Return the organizer checklist items that apply to this event.

    An item applies when its area is one the organizer needs and when the level
    chosen for that area reaches the item's ``min_level``.
    """
    needed = needed_area_ids(event)
    done = _stored_organizer_flags(event)
    selected: list[dict[str, Any]] = []
    for source in ORGANIZER_CHECKLIST:
        area_id = source.get("area_id")
        if area_id not in needed:
            continue
        if source.get("min_level", 1) > _chosen_level(event, area_id):
            continue
        item = {key: value for key, value in deepcopy(source).items() if key not in _ORGANIZER_INTERNAL_KEYS}
        item["is_done"] = done.get(item["id"], False)
        selected.append(item)
    selected.sort(key=_milestone_rank)
    return selected


def build_team_checklists(event: dict[str, Any]) -> list[dict[str, Any]]:
    """Return the per-role checklists that apply to this event.

    Tasks belonging to areas the organizer does not need are dropped, and a
    role left without any task disappears from the guide.
    """
    needed = needed_area_ids(event)
    completed = _stored_team_flags(event)
    roles: list[dict[str, Any]] = []
    for source in TEAM_ROLES:
        tasks = list(source.get("tasks", []))
        task_areas = list(source.get("task_areas", []))
        kept = [
            task
            for index, task in enumerate(tasks)
            if index >= len(task_areas) or task_areas[index] in needed
        ]
        if not kept:
            continue
        role = {key: value for key, value in deepcopy(source).items() if key not in _TEAM_INTERNAL_KEYS}
        role["tasks"] = kept
        role["completed_tasks"] = [task for task in completed.get(role["role"], []) if task in kept]
        roles.append(role)
    return roles


def set_done(event: dict[str, Any], update: ChecklistDoneUpdate) -> dict[str, Any]:
    """Persist a single checkbox toggle coming from the guide view."""
    guide = event.get("eguide")
    if guide is None:
        raise LookupError("Generate the e-guide first")
    if update.role is None:
        for item in guide.get("organizer_checklist", []):
            if item.get("id") == update.item_id:
                item["is_done"] = update.is_done
                break
        else:
            raise KeyError(update.item_id)
    else:
        for role in guide.get("team_checklists", []):
            if role.get("role") != update.role:
                continue
            completed = [task for task in role.get("completed_tasks", []) if task != update.task]
            if update.is_done and update.task is not None:
                completed.append(update.task)
            role["completed_tasks"] = completed
            break
        else:
            raise KeyError(update.role)
    event["eguide"] = guide
    save_event(event)
    return guide
