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
