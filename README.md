# WiseOrganise

A prototype that guides an event organizer toward sustainable choices, step by step. Piloted on a University of Łódź (UŁ) event.

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

That brings up three containers: the FastAPI backend, the built React SPA behind nginx, and Caddy in front of both, routing `/api/*`, `/docs*` and `/openapi.json` to the backend and everything else to the frontend. **Port 4540 is the only published port**, and it is bound to loopback by default — so there is no CORS to configure and nothing else is exposed.

Swagger UI for the API: http://localhost:4540/docs

## Configuration

Everything lives in a single `.env` at the repo root, copied from `.env.example`. There is exactly one credential in the whole project, and it is optional.

| Variable | Default | What it does | Where to get the value |
|---|---|---|---|
| `GEMINI_API_KEY` | *(empty)* | Google Gemini key. Empty means the app runs fully deterministically. | **Google AI Studio — https://aistudio.google.com/apikey.** Sign in with a Google account and create a key; the free tier is enough for the pilot. |
| `GEMINI_MODEL_MAIN` | `gemini-3.8-flash` | Model used for the main structured generations (guide, analysis, area suggestions). | Your choice; leave as is unless you have a reason. |
| `GEMINI_MODEL_LITE` | `gemini-3.5-flash-lite` | Cheaper model used only by the recommendation shim. | Your choice. |
| `USE_MOCK_AI` | `true` | Master switch for live AI. `true` = no network calls, deterministic output. | Your choice. |
| `EDGE_BIND_ADDR` | `127.0.0.1` | Which host interface Caddy's port 4540 is published on. | Your choice. Set `0.0.0.0` only to reach the stack from another machine during development. |
| `VITE_API_BASE_URL` | `/api/v1` | Base URL the SPA calls. Read by Vite **at build time**. | Only matters when running the Vite dev server against a separately started backend — then set `http://localhost:8000/api/v1`. |

Defaults are defined in `backend/app/core/config.py`, `docker-compose.yml` and `frontend/src/lib/api.ts`; `.env` is gitignored and never committed.

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

There is no test suite, no linter and no formatter in this repo. The closest thing to a backend check is `python -m compileall backend/app`.
