# Backend alignment decisions

## Source priority

The mentor conference summary PDF is the conceptual source of truth. The frontend contracts in `frontend/src/types/index.ts` and `frontend/src/data/knowledgeBase.ts` define the JSON-compatible shape. Backend code and Polish fixtures follow both sources.

## API endpoint map

All routes are under `/api/v1` and use the process-local `backend/app/repositories/memory_repo.py` repository.

| Method and path | Request | Response | Implementation |
|---|---|---|---|
| `POST /events` | `EventCreate` | `EventResponse` | `api/v1/endpoints/events.py`, `services/event_service.py` |
| `GET /events` | none | `list[EventResponse]` | `api/v1/endpoints/events.py` |
| `GET /events/{event_id}` | path id | `EventResponse` | `api/v1/endpoints/events.py` |
| `PATCH /events/{event_id}` | `EventUpdate` | `EventResponse` | `schemas/event.py`, `services/event_service.py` |
| `DELETE /events/{event_id}` | path id | `204` | `api/v1/endpoints/events.py` |
| `POST /events/{event_id}/analyze` | none | `ChecklistResponse` | legacy checklist compatibility |
| `GET /events/{event_id}/checklist` | none | `ChecklistResponse` | legacy checklist compatibility |
| `PATCH /events/{event_id}/checklist` | `ChecklistUpdatePayload` | `ChecklistResponse` | legacy checklist compatibility |
| `GET /events/{event_id}/options` | none | `AreaOptionsResponse` | seven lifecycle areas and three levels |
| `PATCH /events/{event_id}/options` | `OptionSelectionPayload` | `OptionSelectionResponse` | `services/options_service.py` |
| `GET /events/criteria` | none | `CriteriaResponse` | `services/criteria_service.py` |
| `POST /events/{event_id}/recommend` | none | `CategoryRecommendationsResponse` | neutral category compatibility projection |
| `GET /events/{event_id}/recommendations` | none | `CategoryRecommendationsResponse` | neutral category compatibility projection |
| `POST /events/{event_id}/recommendations/{rec_id}/select` | none | `VendorRecommendation` | toggles neutral category card only |
| `POST /events/{event_id}/eguide` | none | `EGuideResponse` | dual checklist, impact, clauses |
| `GET /events/{event_id}/eguide` | none | `EGuideResponse` | persisted guide |

## Contract changes driven by frontend and PDF

- `EventCreate` defaults to the University of Lodz pilot, approximately 20 km radius, rail/electric-bus transport, suggested start time, participant origins, budget, and `needs_venue_help` starting mode. See `app/schemas/event.py` and `PilotContext`.
- Pydantic responses serialize snake_case fields as camelCase aliases (`providerQuestions`, `selectedOptions`, `eventDate`, `needsVenueHelp`, etc.) while accepting both forms on input. This lets the frontend consume JSON without transformation.
- `EventArea` and `OptionLevel` mirror the frontend fields: `id`, `name`, `stage`, `lead`, `levels`, `provider_questions`, `note`; each level has `level`, `label`, `description`, `why`, `cost`, `tags`, `use_ai_suggestions`, and `six_r`. See `app/schemas/options.py`.
- `knowledge_mocks.py` contains exactly seven areas and exactly three Polish levels per area. It encodes the strict `Przemyśl -> Rezygnuj -> Ograniczaj -> Używaj ponownie -> Naprawiaj -> Recykling` hierarchy, locality, seasonality, circularity, employment on an employment contract, and reusable tableware above biodegradable disposable ware.
- `CriteriaResponse` provides seven neutral supplier criteria with `jak_sprawdzic`, `sygnal_ostrzegawczy`, and area-specific `pytania_do_dostawcy`. No endpoint promotes a named vendor or returns a Top 3 ranking. The former recommendation routes remain only as neutral category compatibility routes.
- `EGuideResponse` contains `organizer_checklist`, `team_checklists`, `impact_summary`/`emissions_summary`, greenwashing risks, and ready-to-use contract clauses. `services/eguide_service.py` computes CO2e ranges, PLN savings, and squirrels/trees from selected tiers and attendee count.
- `main.py` enables CORS for localhost ports 3000/5173 and loopback ports; development wildcard behavior is retained.

## File-level decision log

- `app/schemas/enums.py`: added lifecycle, area, 6R, and cost enums; repaired Polish values.
- `app/schemas/event.py`: replaced the old required-only event form with UŁ-aware defaults and pilot context.
- `app/schemas/options.py`: added typed area, tier, and selection contracts.
- `app/schemas/criteria.py`: added neutral criteria matrix and supplier questions.
- `app/schemas/eguide.py`: added dual checklists and impact summary while retaining compatibility projections.
- `app/mocks/knowledge_mocks.py`: centralized mentor-approved Polish content.
- `app/services/options_service.py`: returns and stores selections.
- `app/services/criteria_service.py`: serves criteria without brands.
- `app/services/recommendation_service.py`: converted old vendor ranking logic into neutral category cards.
- `app/services/eguide_service.py`: computes personalized impact and checklists.
- `app/api/v1/endpoints/events.py`: added `/options` and `/criteria` routes.
- `app/core/config.py`, `app/main.py`: configured development CORS.

## Handling PDF page 9 open questions

- **Concrete firms vs no promotion:** only neutral categories and criteria are returned; named supplier fixtures are no longer used by recommendation flow.
- **"Numery" in the guide:** the API returns numbered organizer item IDs and editable role contact placeholders, not invented phone numbers.
- **Event time scope:** impact covers before, during, and after; `suggested_start_time` remains explicit for rail alignment.
- **Biodegradable vs reusable:** reusable tableware is encoded above biodegradable disposables; composting is required for the latter.
- **20 km scope:** `PilotContext.radius_km` is a parameter, defaulting to 20 and available for future participant/supplier split.
- **Before/after data:** `ImpactSummary` is based on selected tiers and attendee count; future survey, waste-weight, and invoice fields can be added without changing the response shape.
- **Gratifications:** incentives are explicit pilot data; level 3 marks the budget effect as requiring budget.
- **Event scale:** checklists are role-based and size-neutral; a future event-size field can select templates.
- **6R version:** the six-item PDF order is the only `SIX_R` constant.
- **Post-pilot portability:** pilot city and radius are editable in `PilotContext`.

## Verification

Run `python -m compileall backend/app` and, where dependencies are installed, exercise the FastAPI routes with `TestClient`. The API does not require authentication in development.
