# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

WiseOrganise is a prototype tool that guides an event organizer toward sustainable choices. It is piloted on a University of Łódź (UŁ) event. In this project **the domain content is the product** — the Polish knowledge base matters more than the code that serves it.

## Product source of truth

Three layers, in strict priority order. When they disagree, the higher layer wins.

1. `Podsumowanie-spotkania-platforma-zrównoważonych-wydarzeń.pdf` (9 pages, Oct 20 2026) — the mentor meeting summary. Authoritative for every product decision.
2. `backend/BACKEND_ALIGNMENT_DECISIONS.md` and `frontend/ARCHITECTURE_AND_DECISIONS.md` — decision logs (DEC-01…DEC-09) that translate the PDF into code contracts, with file and line references.
3. The code itself — `backend/app/mocks/knowledge_mocks.py` and `frontend/src/data/knowledgeBase.ts`.

Record any change to domain content or contracts in the matching `*_DECISIONS.md`.

### Hard product constraints

These are the rules a well-meaning change is most likely to break. Do not violate them without an explicit instruction from the user.

- **No company promotion.** No vendor names, no ranking, no "Top 3", no supplier scoring anywhere in the product. The tool gives neutral criteria, questions to ask a supplier, and greenwashing warning signals so the organizer judges for themselves. A company database / vendor ranking is explicitly **deferred** in the PDF's priority table.
- **AI must not invent facts.** Gemini only *assembles* a guide from the fixed, team-maintained knowledge base. All numbers (CO2e, PLN, squirrels, trees) are computed in Python — see `build_impact()` in `backend/app/services/impact_service.py`. This is enforced by `_SAFETY_INSTRUCTION` in `backend/app/integrations/gemini_client.py` and by the prompts in `backend/prompts/v1/`, which also treat event descriptions as untrusted data rather than instructions.
- **One fixed 6R order:** Przemyśl → Rezygnuj → Ograniczaj → Używaj ponownie → Naprawiaj → Recykling. Exactly one definition per side: `SIX_R` (backend) and `sixRHierarchy` (frontend).
- **Reusable outranks biodegradable disposables.** Biodegradable single-use items are never the "najlepiej" (level 3) option, and are only acceptable with real composting.
- **Exactly 11 areas × exactly 3 levels**, no exceptions: `dojazd`, `zakwaterowanie`, `catering`, `materialy`, `gadzety`, `ludzie`, `po-wydarzeniu`, `miejsce-i-sala`, `energia-i-woda`, `komunikacja`, `dostepnosc` (see `AreaId` in `backend/app/schemas/enums.py`). The PDF fixes the count at seven; the four extra areas are a deliberate override made on the product owner's instruction and recorded as DEC-11 in both decision logs. Levels are `minimum` / `lepiej` / `najlepiej`, each with a short educational "why" and a cost effect.
- **Two layers of supplier criteria.** `VENDOR_CRITERIA` / `vendorCriteria` is the universal seven and must stay as it is — it is the full overview on the criteria page. `AREA_CRITERIA` / `areaCriteria` is the narrower layer written per area, with a `dowod` ("what evidence to ask for") field the universal list does not have. Add detail there, not by rewriting the seven.
- **Nothing the organizer needs is collapsed by default.** Levels, their "why", their cost effect, and the per-area supplier knowledge all render open (DEC-11 in the frontend log). Do not reintroduce an accordion around them.
- **AI area suggestion is Gemini-only.** `POST /events/{id}/suggest-areas` needs `GEMINI_API_KEY` **and** `USE_MOCK_AI=false`. It always answers 200: without a model it returns `available: false` and a Polish sentence the UI shows, never a silent no-op or a 500.
- **Whole participant lifecycle**, from leaving home, through the event, to the return trip and what is left behind — not just event hours.
- **Locality and seasonality are universal filters** ("im dalej od nas, tym gorzej"); employment on an employment contract (umowa o pracę) is a social criterion.
- **Language split:** every user-facing string is Polish; code, identifiers, comments, and documentation are English.
- The PDF's page 9 lists 10 open questions/contradictions. They already have adopted answers — see "Handling PDF page 9 open questions" and "Open questions from PDF page 9" in the two decision logs. Do not re-decide them unilaterally.

## Commands

There is **no test suite, no linter, and no formatter** in this repo. Do not guess at `pytest`, `eslint`, or similar — they are not configured.

```bash
# Full stack (backend + frontend behind Caddy) on http://localhost:4540
cp .env.example .env
docker compose up --build

# Backend only
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload       # Swagger UI at /docs

# Frontend only (Vite dev server on :5173, already in the CORS allowlist)
cd frontend && npm install && npm run dev
npm run build                               # tsc -b && vite build

# Closest thing to a backend check
python -m compileall backend/app
```

Caddy (`Caddyfile`) routes `/api/*`, `/docs*`, and `/openapi.json` to the backend and everything else to the frontend, so the frontend's default `API_BASE_URL` of `/api/v1` works without CORS in the Docker setup.

Behind the LAN edge proxy, 4540 has to speak TLS with the pinned
`lan-backend.internal` pair, because the edge runs `proxy_pass https://` with
`proxy_ssl_verify on`. That is an opt-in overlay, so local development stays on
plain HTTP:

```bash
# copy fullchain.pem + privkey.pem from the NAS into ./certs (gitignored)
docker compose -f docker-compose.yml -f docker-compose.lan.yml up -d
```

`Caddyfile.lan` keeps the catch-all `:4540` address on purpose — it already
matches the `Host` the edge sends, and naming the public host there would break
localhost and IP access. With the overlay active, plain HTTP on 4540 answers
400; that is why it is not the default.

`frontend/scripts/unpack_bundle.py` is a repeatable decoder for the original HTML bundle (`frontend/WiseOrganise — aplikacja.html`). `frontend/unpacked/` and `Legacy/` are inspection artefacts, not production code.

## Architecture

### Backend — `backend/app/` (FastAPI, Pydantic v2)

Layering is endpoints → services → repository/mocks.

- `api/v1/router.py` mounts everything under `/api/v1` and itself serves `GET /reference-data`, a single call returning the whole knowledge base. The frontend bootstraps from it on startup.
- `schemas/__init__.py` defines `APIModel`, the base every schema must inherit: `alias_generator=to_camel` plus `populate_by_name`, so the API emits camelCase and accepts either form; also `extra="forbid"` and `use_enum_values=True`. A schema that skips `APIModel` silently breaks the frontend contract.
- `repositories/memory_repo.py` — `EVENTS_DB` is a process-local dict. There is no database; a restart wipes all state. Route mutations through `save_event()`.
- `mocks/knowledge_mocks.py` — the **single** backend source of Polish domain content (`SIX_R`, `EVENT_AREAS`, `VENDOR_CRITERIA`, `AREA_QUESTIONS`, `ORGANIZER_CHECKLIST`, `TEAM_ROLES`, `CONTRACT_CLAUSES`, `GREENWASHING_RISKS`, `ECO_SUMMARY`). Content changes belong here, not in services.
- `core/config.py` — `settings.gemini_enabled` is the gate: live Gemini only when `GEMINI_API_KEY` is set **and** `USE_MOCK_AI=false`. The default is `USE_MOCK_AI=true`, so the whole product runs deterministically with no API key. Services must keep both paths working (see `compile_eguide` in `services/eguide_service.py`).
- `integrations/gemini_client.py` — `generate_structured()` lazily imports the SDK (so mock mode works without `google-genai` installed), forces a Pydantic `response_schema`, prefixes `_SAFETY_INSTRUCTION`, and appends a record to `ai_runs`.
- `api/deps.py` — use `get_event_or_404` instead of hand-rolling 404s.
- The `/recommend`, `/recommendations`, and `/recommendations/{id}/select` routes survive only as a compatibility shim projecting **neutral categories**, never vendors. Full endpoint table: `backend/BACKEND_ALIGNMENT_DECISIONS.md`.
- Root-level `main.py`, `schemas.py`, and `mock_data.py` are compatibility re-exports from `backend/app/`. Do not add logic there.

### Frontend — `frontend/src/` (React 19, TypeScript, Vite)

- No router. `App.tsx` owns all state: a `view` string (`start` / `creator` / `rules` / `criteria` / `guide` / `impact`) switched via `setView`, plus `reference`, `event`, and `eguide`.
- `lib/api.ts` is the only HTTP layer (`API_BASE_URL` = `VITE_API_BASE_URL` or `/api/v1`). `normalizeReference()` reconciles snake_case and camelCase coming off the API — new reference fields must be threaded through it.
- `data/knowledgeBase.ts` is a **fallback copy** of the same content as `knowledge_mocks.py`, used when `/reference-data` fails. Domain content changes must be applied on both sides or the fallback starts lying.
- The six views correspond to the six boards of the original HTML bundle; the mapping and per-decision rationale are in `frontend/ARCHITECTURE_AND_DECISIONS.md`.
- Styling is hand-written semantic CSS in `styles/global.css` (classes like `site-header`, `app-shell`), with fonts in `src/assets/*.woff2` (Bricolage Grotesque, Atkinson Hyperlegible) — both extracted from that bundle. Tailwind and PostCSS are installed and configured (`tailwind.config.js`), but no `@tailwind` directive or utility class is actually used; follow the existing CSS rather than reaching for utilities.

### Encoding note

Several files carry a UTF-8 BOM and/or write Polish characters as Unicode escapes (`knowledge_mocks.py`, `App.tsx`, `api/v1/endpoints/events.py`, `memory_repo.py`, and most `frontend/*.config.*`). Match each file's existing convention when editing Python/TSX sources.

**Exception — never give `frontend/package.json` a BOM.** Vite's PostCSS config loader runs `JSON.parse` on it, and a BOM fails the production build with a misleading `Failed to load PostCSS config ... is not valid JSON` error pointing at `global.css`. This already happened once.

### Build gotcha

`npm run dev` does not type-check — Vite only strips types. Type errors surface for the first time in `npm run build` (`tsc -b && vite build`), i.e. inside `docker compose build`. Run `npm run build` in `frontend/` before assuming a frontend change is good.
