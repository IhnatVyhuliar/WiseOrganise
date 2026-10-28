"""Turn the organizer's own description into proposed lifecycle areas.

This step is Gemini-only by product decision, and the default configuration
runs with ``USE_MOCK_AI=true``. So the service never raises and never returns
an error status: it reports in Polish why it has nothing to propose, and the
creator shows that sentence instead of leaving a dead button on screen.
"""
from __future__ import annotations

import logging
from typing import Any

from ..mocks.knowledge_mocks import EVENT_AREAS
from ..schemas import AreaSuggestion, AreaSuggestionResponse
from ..core.config import settings
from ..integrations.gemini_client import generate_structured
from ..repositories.event_repo import get_event, save_event
from .ai_context import build_area_suggestion_prompt, event_facts, facts_hash

logger = logging.getLogger(__name__)

_NO_DESCRIPTION = (
    "Dopisz opis wydarzenia, żeby AI mogło zaproponować obszary. "
    "Napisz, co to za wydarzenie, ile trwa i czego potrzebuje."
)
_NO_MODEL = (
    "Podpowiedzi AI są wyłączone: wymagają klucza Gemini i ustawienia USE_MOCK_AI=false. "
    "Obszary możesz zaznaczyć samodzielnie poniżej."
)
_FAILED = (
    "Nie udało się pobrać podpowiedzi AI. Zaznacz obszary samodzielnie poniżej "
    "albo spróbuj ponownie za chwilę."
)
_OK = "AI zaproponowało obszary na podstawie Twojego opisu. Możesz je dowolnie zmienić."


def suggest_areas(event: dict[str, Any]) -> AreaSuggestionResponse:
    """Propose the areas this event needs. Never raises."""

    description = str(event.get("raw_description") or "").strip()
    if not description:
        return AreaSuggestionResponse(available=False, message=_NO_DESCRIPTION)
    try:
        digest = facts_hash(event_facts(event))
    except Exception:
        digest = None
        logger.warning("Could not fingerprint the event, skipping the suggestion cache", exc_info=True)
    cached = event.get("suggestion_cache")
    if digest is not None and isinstance(cached, dict) and cached.get("hash") == digest:
        try:
            return AreaSuggestionResponse.model_validate(cached["response"])
        except Exception:
            # Only the stored entry is bad: keep the digest so the next good result overwrites it.
            logger.warning("Ignoring an unreadable suggestion cache", exc_info=True)
    if not settings.gemini_enabled:
        return AreaSuggestionResponse(available=False, message=_NO_MODEL)
    try:
        generated = generate_structured(
            task="suggest_areas",
            prompt=build_area_suggestion_prompt(event),
            schema=AreaSuggestionResponse,
            system_instruction="Answer in Polish and propose only areas from the supplied knowledge base.",
            prompt_version="v1",
        )
    except Exception:
        # A model that drifts from the knowledge base, an unreachable API, or a
        # missing SDK must all end the same way: the organizer picks by hand.
        logger.warning("Gemini area suggestion failed, the organizer picks the areas", exc_info=True)
        return AreaSuggestionResponse(available=False, message=_FAILED)

    # The response schema already rejects an id outside AreaId, and that is the
    # real guard here: gemini_client.check_coverage only inspects keys named
    # "id", which this payload does not use. Filtering against EVENT_AREAS as
    # well keeps the promise independent of how the enum evolves.
    known = {area["id"] for area in EVENT_AREAS}
    kept = [
        AreaSuggestion(area_id=item.area_id, reason=item.reason)
        for item in generated.suggestions
        if str(getattr(item.area_id, "value", item.area_id)) in known
    ]
    if not kept:
        return AreaSuggestionResponse(available=False, message=_FAILED)
    order = {area["id"]: position for position, area in enumerate(EVENT_AREAS)}
    kept.sort(key=lambda item: order[str(getattr(item.area_id, "value", item.area_id))])
    response = AreaSuggestionResponse(available=True, message=_OK, suggestions=kept)
    if digest is not None:
        try:
            # The model call can take seconds; re-read so a guide, nonce or edit stored
            # meanwhile is not overwritten by this request's stale copy.
            fresh = get_event(event["id"])
            if fresh is not None:
                fresh["suggestion_cache"] = {"hash": digest, "response": response.model_dump(by_alias=False)}
                save_event(fresh)
        except Exception:
            logger.warning("Could not store the area suggestion cache", exc_info=True)
    return response
