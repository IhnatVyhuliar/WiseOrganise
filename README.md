# WiseOrganise

A prototype that guides an event organizer toward sustainable choices, step by step. Events are stored in PostgreSQL and can be shared read-only through a short link.

Live pilot: **https://wiseorganise.reachit.space**

## What this is

Most event organizers want to do the right thing environmentally and get stuck in the same place: the advice they find is vague ("go green", "reduce waste"), and the suppliers they ask back it up with claims nobody can check. WiseOrganise turns that into something concrete. You describe your event — where, when, how many people, where they travel from — and the tool walks you through every part of it that has an environmental cost, offers three realistic levels for each, and ends with a checklist your team can actually work from, plus an estimate of what your choices saved.

One thing it deliberately does **not** do: it never ranks, scores, or recommends companies. There is no vendor database and no "top 3". Instead it gives you neutral criteria, the exact questions to ask a supplier, the evidence to ask them for, and the greenwashing warning signals to listen for — so the judgement stays yours.

All user-facing text in the app is Polish. This README, the code, and the rest of the documentation are English.

## How it works

### The 6R hierarchy

Every suggestion in the tool is anchored to one fixed ladder, in this order — the earlier the step, the more it is worth:

| # | Step | Meaning |
|---|---|---|
| 1 | **Przemyśl** (Rethink) | Is this needed at the event at all? |
| 2 | **Rezygnuj** (Refuse) | Drop what is superfluous: swag, print, single-use cutlery. |
| 3 | **Ograniczaj** (Reduce) | Order as much as is needed — e.g. portions based on registrations. |
| 4 | **Używaj ponownie** (Reuse) | Choose reusable dishes, lanyards, equipment. |
| 5 | **Naprawiaj** (Repair) | Repair equipment and decorations so they serve the next edition. |
| 6 | **Recykling** (Recycle) | Sort only what could not be avoided. |

A rule follows directly from this order, and the tool holds it everywhere: **a reusable item beats a biodegradable disposable one.** Biodegradable single-use items are never the best option, and they are only acceptable where real composting exists to receive them.

### 11 areas × 3 levels

The scope is the whole participant lifecycle — leaving home, the event itself, the trip back, and what is left behind afterwards — not just the hours of the event. It is split into eleven areas:

| Area id | What it covers |
|---|---|
| `dojazd` | How participants travel to and from the event |
| `zakwaterowanie` | Where out-of-town guests stay |
| `catering` | Food, drink, dishes, leftovers |
| `materialy` | Printed and physical materials |
| `gadzety` | Swag and giveaways |
| `miejsce-i-sala` | The venue and the room itself |
| `energia-i-woda` | Energy and water use on site |
| `komunikacja` | Communication and promotion |
| `dostepnosc` | Accessibility for all participants |
| `ludzie` | People and on-site staff |
| `po-wydarzeniu` | What happens after: waste, equipment, reporting |

Each area offers exactly three levels — `minimum`, `lepiej` ("better"), `najlepiej` ("best") — and each level comes with a plain-language reason it matters and an honest note on what it does to the budget, which may be "saves money", "no extra cost", "needs budget", "depends on the offer", or "needs team time". Nothing here is hidden behind a toggle: the levels, the reasons, and the cost effects are all visible at once.

### Criteria instead of a ranking

Supplier knowledge comes in two layers. The universal layer is seven criteria that apply to anyone you buy from: origin and distance, seasonality, packaging and waste, delivery transport, employment on an employment contract (*umowa o pracę*), evidence instead of slogans, and transparency. Each one tells you how to check it and the warning signal that means the answer was marketing. The second layer is narrower, written per area, and adds the specific evidence to ask that kind of supplier for.

Two filters run across everything: **locality** and **seasonality** — the further something comes from us, the worse — and employment conditions are treated as a social criterion on equal footing with the environmental ones.

### Where the numbers come from

The Polish knowledge base is written and maintained by the team, not generated. The AI model (Google Gemini) only *assembles* a guide out of that fixed knowledge base; it is never asked to invent a fact, and the prompts treat the organizer's event description as data rather than as instructions. Every figure — CO₂e, złoty amounts, and the squirrel and tree equivalents shown on the impact screen — is computed in Python in `backend/app/services/impact_service.py`. And the whole product runs with no AI at all, which is the default: see [Quick start](#quick-start).

---

## Quick start

**You do not need an API key or any account.** `USE_MOCK_AI` defaults to `true`, so the entire product — the creator, the guide, the checklists, the impact estimate — runs deterministically out of the box.

**Prerequisites:** Docker Engine with Compose V2. (Only for the non-Docker paths below: Python 3.12, matching `backend/Dockerfile`, and Node 20 or 22+ — the image pins Node 22 and Vite 6 is the real floor.)

```bash
cp .env.example .env
docker compose up --build
# open http://localhost:4540
```

That brings up four containers: PostgreSQL, the FastAPI backend, the built React SPA behind nginx, and Caddy in front of the last two, routing `/api/*`, `/docs*` and `/openapi.json` to the backend and everything else to the frontend. **Port 4540 is the only published port**, and it is bound to loopback by default — so there is no CORS to configure and nothing else is exposed.

Swagger UI for the API: http://localhost:4540/docs

## Configuration

Everything lives in a single `.env` at the repo root, copied from `.env.example`. There is exactly one credential in the whole project, and it is optional.

| Variable | Default | What it does | Where to get the value |
|---|---|---|---|
| `GEMINI_API_KEY` | *(empty)* | Google Gemini key. Empty means the app runs fully deterministically. | **Google AI Studio — https://aistudio.google.com/apikey.** Sign in with a Google account and create a key; the free tier is enough for the pilot. |
| `GEMINI_MODEL_MAIN` | `gemini-3.8-flash` | Model used for the main structured generations (guide, analysis, area suggestions). | Your choice; leave as is unless you have a reason. |
| `GEMINI_MODEL_LITE` | `gemini-3.5-flash-lite` | Reserved. Read into settings but not used by any code path since the recommendation routes were removed. | Your choice. |
| `GEMINI_TIMEOUT_SECONDS` | `45` | Per-call timeout for live Gemini requests, in seconds. | Your choice. |
| `DATABASE_URL` | `postgresql://wiseorganise:wiseorganise@db:5432/wiseorganise` | PostgreSQL connection string the backend uses. | The default points at the compose `db` service; change it only to use another database. |
| `POSTGRES_PASSWORD` | `wiseorganise` | Password the compose `db` service is created with. Keep it consistent with `DATABASE_URL`. | Your choice; set it to something real on any shared host. |
| `PUBLIC_BASE_URL` | `https://wiseorganise.reachit.space` | Origin used to build share links (`{PUBLIC_BASE_URL}/w/{slug}`). | The public address of your deployment. |
| `DB_CONNECT_RETRIES` | `30` | How many times start-up retries reaching the database. | Your choice. |
| `DB_CONNECT_DELAY_SECONDS` | `2` | Pause between those retries, in seconds. | Your choice. |
| `USE_MOCK_AI` | `true` | Master switch for live AI. `true` = no network calls, deterministic output. | Your choice. |
| `EDGE_BIND_ADDR` | `127.0.0.1` | Which host interface Caddy's port 4540 is published on. | Your choice. Set `0.0.0.0` only to reach the stack from another machine during development. |
| `VITE_API_BASE_URL` | `/api/v1` | Base URL the SPA calls. Read by Vite **at build time**. | Only matters when running the Vite dev server against a separately started backend — then set `http://localhost:8000/api/v1`. |

Defaults are defined in `backend/app/core/config.py`, `docker-compose.yml` and `frontend/src/lib/api.ts`; `.env` is gitignored and never committed. `.env.example` does not list `PUBLIC_BASE_URL`, `DB_CONNECT_RETRIES`, `DB_CONNECT_DELAY_SECONDS` or `VITE_API_BASE_URL`; the code defaults apply unless you add them.

**Compose forwarding caveat.** `docker-compose.yml` passes only `GEMINI_API_KEY`, `GEMINI_MODEL_MAIN`, `GEMINI_MODEL_LITE`, `USE_MOCK_AI`, `DATABASE_URL` (backend) and `POSTGRES_PASSWORD` (db) into the containers. `GEMINI_TIMEOUT_SECONDS`, `PUBLIC_BASE_URL`, `DB_CONNECT_RETRIES` and `DB_CONNECT_DELAY_SECONDS` therefore keep their `config.py` defaults under `docker compose` unless you add them to the backend's `environment:` block. They take effect as written when you run the backend directly.

### Turning the AI on

Live Gemini requires **both** conditions — a key *and* mock mode explicitly disabled (`settings.gemini_enabled` in `backend/app/core/config.py`):

```dotenv
GEMINI_API_KEY=your-key-from-ai-studio
USE_MOCK_AI=false
```

What this unlocks: `POST /events/{id}/suggest-areas` — proposing the relevant lifecycle areas from the organizer's free-text event description — is the single feature genuinely unavailable without it. Even then it never fails: the endpoint always answers `200`, returning `available: false` and a Polish sentence that the UI shows the organizer. Everything else in the product works identically with or without a key.

## Running the parts separately

Backend, **from the repo root**:

```bash
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload   # Swagger UI at http://localhost:8000/docs
```

Frontend, **from `frontend/`** — the Vite dev server runs on :5173, which is already in the backend's CORS allowlist:

```bash
cd frontend && npm install && npm run dev
```

Two things to know:

- The uvicorn module path differs by context: `backend.app.main:app` from the repo root, `app.main:app` inside the Docker image (where `backend/` is the working directory).
- **`npm run dev` does not type-check** — Vite only strips types. Type errors appear for the first time in `npm run build` (`tsc -b && vite build`). Run that before assuming a frontend change is good.

The backend has a pytest suite of 56 tests in `backend/tests/`; it needs a reachable PostgreSQL. The intended command is:

```bash
docker compose run --rm backend pytest tests/ -v
```

**This exact command has never been executed:** Docker was unavailable while the suite was written, so the compose and Dockerfile changes were reviewed by reading only, and every run used a locally provisioned PostgreSQL (set `DATABASE_URL` to it and run `pytest tests/` from `backend/`; without a reachable database the whole session skips). There is no linter and no formatter, and the frontend has no tests. `python -m compileall backend/app` is a quick syntax check.

---

## Technical reference

### Architecture

**Backend — `backend/app/` (FastAPI, Pydantic v2).** Layering is endpoints → services → repository/mocks.

- `api/v1/router.py` mounts everything under `/api/v1` and itself serves `GET /reference-data`, the single call the SPA bootstraps from on startup.
- `schemas/__init__.py` defines `APIModel`, the base every schema inherits: it emits camelCase, accepts either form, and forbids extra fields. A schema that skips it silently breaks the frontend contract.
- `mocks/knowledge_mocks.py` is the single backend source of Polish domain content. Content changes belong there, not in services.
- `repositories/event_repo.py` stores events in **PostgreSQL**: one `events` row per event with a unique `slug` and the record as JSONB. Dates are stored as ISO strings and revived on read, and mutations go through `save_event()`. Events survive restarts (data lives in the `pgdata` volume); `docker compose down -v` deletes it.
- `core/config.py` gates live AI behind `settings.gemini_enabled`; services must keep both the mock and the live path working.
- `workers/ai_jobs.py` runs the optional Gemini pass over the e-guide in the background; the deterministic guide is stored and served first.
- `integrations/gemini_client.py` lazily imports the SDK (so mock mode works without `google-genai` installed), forces a Pydantic response schema, calls the model at temperature 0 with a configurable timeout, and prefixes a safety instruction.
- Root-level `main.py`, `schemas.py` and `mock_data.py` are compatibility re-exports from `backend/app/`, not entry points.

**Frontend — `frontend/src/` (React 19, TypeScript, Vite).**

- No router. `App.tsx` owns all state: a `view` string switched between six screens, plus `reference`, `event` and `eguide`.
- `lib/api.ts` is the only HTTP layer; `normalizeReference()` reconciles snake_case and camelCase coming off the API, so new reference fields must be threaded through it.
- `data/knowledgeBase.ts` is a **fallback copy** of the same content as `knowledge_mocks.py`, used when `/reference-data` fails — which is why the app still renders with no backend. **Domain content must be changed on both sides, or the fallback starts lying.**
- Styling is hand-written semantic CSS in `styles/global.css`, with fonts in `src/assets/*.woff2`. Tailwind and PostCSS are installed and configured but no utility class is actually used — follow the existing CSS rather than reaching for utilities.

### The six screens

| `view` | Nav label | What it does |
|---|---|---|
| `start` | Start | Landing page; tune the pilot (analysis radius, start time) and enter the creator |
| `creator` | Kreator | Four-step wizard: Podstawy → Potrzeby → Opcje → Poradnik |
| `rules` | Zasady 6R | The hierarchy and its boundary conditions |
| `criteria` | Kryteria dostawców | Neutral criteria, per-area questions, greenwashing risk matrix, contract clauses |
| `guide` | Poradnik i checklisty | Organizer checklist by milestone, plus per-role team checklists |
| `impact` | Wpływ przed i po | The deterministic before/after estimate |

`rules` and `criteria` are reference screens reachable from the nav at any time; the other four form the linear flow.

### API

Base prefix `/api/v1`. Swagger UI at `/docs`, schema at `/openapi.json` — both proxied by Caddy, so they work on port 4540 too.

| Route | Purpose |
|---|---|
| `GET /reference-data` | The whole knowledge base in one call; the SPA's bootstrap |
| `GET /events`, `POST /events` | List events; create a draft (the response carries `slug` and `shareUrl`) |
| `GET /events/criteria` | Neutral supplier criteria |
| `GET /events/{id}`, `PATCH /events/{id}`, `DELETE /events/{id}` | Read, update (place, date, attendees, description) or delete an event |
| `PATCH /events/{id}/needed-areas` | Record which lifecycle areas the event actually needs |
| `POST /events/{id}/suggest-areas` | Propose areas from the description — Gemini-only, always `200`, cached per description |
| `GET /events/{id}/options`, `PATCH /events/{id}/options` | Read the areas and levels; persist the chosen level per area |
| `POST /events/{id}/eguide` | Store the deterministic guide and return it at once; with Gemini on, `aiStatus` is `w toku` while the text is refined in the background |
| `GET /events/{id}/eguide` | The stored guide (built on the fly if none yet); `aiStatus` is `wyłączone`, `w toku`, `gotowe` or `nieudane`. Never `409` |
| `PATCH /events/{id}/eguide/checklist` | Toggle one checklist item; no longer `409`s when no guide exists yet |
| `GET /events/{id}/impact` | Deterministic before/after emissions estimate |
| `POST /events/{id}/analyze`, `GET /events/{id}/checklist`, `PATCH /events/{id}/checklist` | Legacy conditional checklist |
| `GET /public/events/{slug}` | Read-only public view of a shared event; see [Sharing an event](#sharing-an-event) |

The full endpoint table is in [`backend/BACKEND_ALIGNMENT_DECISIONS.md`](backend/BACKEND_ALIGNMENT_DECISIONS.md). The former `/recommend`, `/recommendations` and `/recommendations/{id}/select` routes have been removed, and no response carries a score field. That is exactly 13 paths in `/openapi.json`.

### Sharing an event

Every event gets a random 8-character slug (lowercase letters and digits) when it is created. The API returns it as `slug`, together with `shareUrl`, which has the shape `{PUBLIC_BASE_URL}/w/{slug}`, for example `https://wiseorganise.reachit.space/w/k3x9q2ab`. The data behind it is served at `GET /api/v1/public/events/{slug}`.

The public view is read-only and a strict whitelist. It **shows**: the title, event type, date, location and attendee count; the arrangements chosen per area (`ustalenia`, with the reason and cost effect of each level); the organizer checklist; the team checklists; and the impact summary. It **does not show** the free-text description, participant origins, budget or other planning inputs, any internal id, or anything that would let a visitor edit. Opening the link never saves anything and never calls Gemini: it shows the stored guide, or a deterministic one built on the fly.

The slug is the only protection: anyone holding a link can view that event, there is no "published" switch, and there is no login. Do not share a link for an event you would not want read.

Note that the React app has no `/w/:slug` route yet, so the link shape is defined by the API but the page behind it is a frontend task.

### The pilot deployment

The pilot is served at `https://wiseorganise.reachit.space`. A NAS edge terminates the public TLS and forwards over the LAN by plain HTTP to a host whose nginx vhost proxies to `http://127.0.0.1:4540` — this stack, on the same box. Three repo-side details are required for that chain to work:

- `docker-compose.yml` publishes Caddy on `${EDGE_BIND_ADDR:-127.0.0.1}:4540`; only the host's own nginx needs that port (see [Configuration](#configuration)).
- `Caddyfile` trusts `private_ranges` as proxies, so the `X-Forwarded-Proto: https` header and the client IP set by the two nginx hops survive instead of being rewritten.
- `backend/Dockerfile` runs uvicorn with `--proxy-headers --forwarded-allow-ips *`, so FastAPI builds redirects as `https://` — without it a trailing-slash `307` is blocked as mixed content.

The rest of the chain is documented in [`CLAUDE.md`](CLAUDE.md).

### Repo map

```
backend/            FastAPI app, knowledge base, Gemini prompts, pytest suite
frontend/           React SPA (Vite), fallback knowledge base, fonts
Caddyfile           Reverse proxy: /api, /docs, /openapi.json -> backend; rest -> frontend
docker-compose.yml  Backend, PostgreSQL, frontend and Caddy; the single published port
Podsumowanie-spotkania-...pdf   Mentor meeting summary — the product source of truth
```

Not production code, kept only for inspection: `Legacy/`, `frontend/unpacked/`, `frontend/WiseOrganise — aplikacja.html` (the original single-file prototype) and `frontend/scripts/unpack_bundle.py` (its decoder).

### Where decisions live

In strict priority order — when they disagree, the higher one wins:

1. The mentor meeting summary PDF — authoritative for every product decision.
2. [`backend/BACKEND_ALIGNMENT_DECISIONS.md`](backend/BACKEND_ALIGNMENT_DECISIONS.md) and [`frontend/ARCHITECTURE_AND_DECISIONS.md`](frontend/ARCHITECTURE_AND_DECISIONS.md) — the decision logs (the backend log runs DEC-01…DEC-22, the frontend log has its own meanings for the same numbers) translating the PDF into code contracts.
3. The code itself.
4. [`CLAUDE.md`](CLAUDE.md) — working conventions for this repo.

Any change to domain content or contracts gets recorded in the matching `*_DECISIONS.md`.

### Gotchas

- Several source files carry a UTF-8 BOM and/or write Polish characters as Unicode escapes — match each file's existing convention when editing.
- **Never give `frontend/package.json` a BOM.** Vite's PostCSS config loader runs `JSON.parse` on it, and a BOM fails the production build with a misleading error pointing at `global.css`.
- `npm run dev` does not type-check; type errors surface only in `npm run build`.
- Events live in PostgreSQL (the `pgdata` volume); `docker compose down -v` wipes them. The suite has only ever been run against a locally provisioned PostgreSQL, not through `docker compose run`.
- Knowledge-base edits must land on both the Python and the TypeScript side.
