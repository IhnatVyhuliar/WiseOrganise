"""Assembly of the organizer and team checklists from the fixed knowledge base.

Owner of the "checklist follows the organizer's decisions" logic. The guide
service only orchestrates; the selection rules live here.
"""
from __future__ import annotations
from copy import deepcopy
from typing import Any
from ..mocks.knowledge_mocks import ORGANIZER_CHECKLIST, TEAM_ROLES
from ..repositories.memory_repo import save_event
from ..schemas import ChecklistDoneUpdate


def build_organizer_checklist(event: dict[str, Any]) -> list[dict[str, Any]]:
    """Return the organizer checklist items that apply to this event."""
    return deepcopy(ORGANIZER_CHECKLIST)


def build_team_checklists(event: dict[str, Any]) -> list[dict[str, Any]]:
    """Return the per-role checklists that apply to this event."""
    return deepcopy(TEAM_ROLES)


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
