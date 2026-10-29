# WiseOrganise frontend architecture and decisions

## Scope and source priority

This is a React + TypeScript + Vite refactor of `frontend/WiseOrganise — aplikacja.html`. The bundle was unpacked with `scripts/unpack_bundle.py`; its six HTML boards are preserved under `frontend/unpacked/` as an inspection artefact. The mentor summary is the authoritative product source. The supplied mentor summary PDF is the authoritative source; `summary.pdf` is retained as a compatibility copy. All Polish strings rendered by the product remain Polish; source code, names, and this document are English.

## Project structure

- `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`: Vite application shell and build configuration.
- `src/main.tsx`, `src/App.tsx`: React bootstrap and view-level navigation state.
- `src/types/index.ts`: `EventArea`, `OptionLevel`, `VendorCriterion`, checklist, team, and UŁ pilot interfaces, plus the API-facing `AreaQuestions`, `ContractClause`, `GreenwashingRisk`, `EcoSummary`, `EcoMotivator`, and `ImpactSummary` contracts.
- `src/lib/api.ts`: the single HTTP client for the FastAPI backend, plus `normalizeReference`, which reconciles the backend's snake_case and camelCase reference keys into one shape.
- `src/data/knowledgeBase.ts`: the fixed 6R hierarchy, eleven lifecycle areas and their three levels, the universal provider verification criteria, the per-area `areaCriteria` layer, organizer/team checklists, and parameterized UŁ pilot defaults.
- `src/data/knowledgeExtras.ts`: offline fallback copies of `CONTRACT_CLAUSES`, `GREENWASHING_RISKS`, and `ECO_SUMMARY`, kept word for word in sync with `backend/app/mocks/knowledge_mocks.py`.
- `src/components/layout/Layout.tsx`: `Header`, `PageShell`, and `Stepper`.
- `src/components/creator/CreatorPage.tsx`: event basics, lifecycle area navigation, expandable three-level cards, educational explanations, cost effects, provider questions, and selection state.
- `src/components/criteria/CriteriaPage.tsx`: neutral vendor criteria, per-area supplier questions, the greenwashing risk matrix, and contract clauses with RFP questions. It contains no company list, score, or ranking.
- `src/components/checklists/GuidePage.tsx`: master organizer checklist and role-based team checklists with local completion state.
- `src/components/impact/ImpactPage.tsx`: the before/after footprint comparison, cost saving, eco motivator, and data provenance, all rendered from the backend's `ImpactSummary`.
- `src/pages/StartPage.tsx`: product entry point and editable UŁ pilot controls.
- `src/pages/RulesPage.tsx`: 6R hierarchy and boundary rules.
- `src/styles/global.css`: extracted visual system using the bundle's Bricolage Grotesque, Atkinson Hyperlegible, and light neutral/green theme. It imports the view-scoped sheets below; Tailwind is installed but intentionally unused, so no utility classes appear in the components.
- `src/styles/impact.css`, `src/styles/knowledge.css`, `src/styles/needs.css`: hand-written semantic styles for the impact view, the knowledge sections of the criteria view, and the needed-areas step, reusing the `panel`/`section-title`/`eyebrow`/`tag`/`notice` vocabulary from `global.css`.
- `src/assets/*.woff2`: fonts decoded from the bundle manifest.
- `scripts/unpack_bundle.py`: repeatable decoder for the original gzip/base64 manifest and template.

The original six boards map to `StartPage`, `CreatorPage`, `RulesPage`, `CriteriaPage`, `GuidePage`, and `ImpactPage`. The original embedded state logic for area and level selection became typed React state in `CreatorPage`.

## Backend integration

The frontend is no longer static. It is the client of a FastAPI backend in `backend/app`, reached through `src/lib/api.ts` at `VITE_API_BASE_URL` (default `/api/v1`, proxied by nginx in the container image).

- **Knowledge comes from `/reference-data`.** On mount `App.tsx` fetches the 6R hierarchy, the seven areas with their levels, the vendor criteria, the per-area supplier questions, the organizer and team checklists, the contract clauses, the greenwashing risks, the eco summary, and the pilot defaults. `normalizeReference` reconciles the snake_case and camelCase spellings the backend may emit, so views see one shape. `src/data/knowledgeBase.ts` and `src/data/knowledgeExtras.ts` remain as the offline fallback used until that request resolves, or if it fails; they are copies of `backend/app/mocks/knowledge_mocks.py`, not a second source of truth.
- **Event lifecycle.** `POST /events` creates the draft, `PATCH /events/{id}` edits it, `PATCH /events/{id}/needed-areas` records which lifecycle areas this event actually needs, and `PATCH /events/{id}/options` persists the chosen level per area.
- **E-guide.** `POST /events/{id}/eguide` compiles the personalized guide and `GET /events/{id}/eguide` re-reads it; `PATCH /events/{id}/eguide/checklist` persists a single checkbox toggle. The guide bundles the organizer and team checklists, the timeline, the greenwashing matrix, the contract clauses, and the impact summary.
- **Impact.** `GET /events/{id}/impact` returns the deterministic `ImpactSummary` computed by `backend/app/services/impact_service.py`. The estimate is derived entirely from `ECO_SUMMARY` and the organizer's chosen levels: the baseline scales with attendance, the chosen levels move the footprint toward the fully optimized range as a share of that baseline, and the eco motivator expresses one saving in three units (wiewiórki, drzewa, kg CO2e). `ImpactPage` renders this and never fabricates numbers of its own.
- **The Gemini gate.** `backend/app/integrations/gemini_client.py` is the only place generated text may enter. The fixed knowledge base — principles, areas, levels, criteria, clauses, risks and emission constants — is never produced by the model; Gemini may only assemble and phrase a guide from material the team maintains, and the frontend always has a usable fallback if the model or the backend is unavailable.
- **Demonstration, not measurement.** Every figure `ImpactPage` shows carries a Polish disclaimer plus `emissionFactorSources` and `provenance`, because the numbers are illustrative constants scaled by attendance, not a measured footprint.

## Priority override log (mentor PDF over HTML)

The PDF is authoritative whenever the saved HTML and summary differ. Page references below refer to the nine-page mentor PDF.

### DEC-01: Criteria instead of company promotion

- **Original HTML:** The baseline was a supplier/criteria board and its earlier direction allowed vendor-oriented content.
- **Mentor requirement:** Pages 1, 3, 5–8 require “Bez promowania firm”: give criteria, questions, and greenwashing signals; defer a company database/ranking.
- **Action:** `CriteriaPage` renders seven neutral criteria and area questions. No company names, “Top 3,” score, or ranking can be selected.
- **Code:** `src/components/criteria/CriteriaPage.tsx` (`CriteriaPage`, line 6), `vendorCriteria` in `src/data/knowledgeBase.ts` (line 48).

### DEC-02: Full participant lifecycle

- **Original HTML:** The boards were separated into start, areas, rules, suppliers, guide, and impact, but lifecycle emphasis was not enforced as a single journey.
- **Mentor requirement:** Pages 1, 3–4, 6–7 require impact from leaving home through return, with `Dojazd`, `Zakwaterowanie`, `Wydarzenie`, and `Po wydarzeniu`.
- **Action:** The creator has seven lifecycle areas: `Dojazd`, `Zakwaterowanie`, `Catering`, `Materiały`, `Gadżety`, `Ludzie / obsługa`, and `Po wydarzeniu`; the intro and after-event module explicitly cover return and leftovers.
- **Code:** `eventAreas` in `src/data/knowledgeBase.ts` (line 11), `CreatorPage` in `src/components/creator/CreatorPage.tsx` (line 7), and `ImpactPage` in `src/components/impact/ImpactPage.tsx` (line 25).

### DEC-03: Three graduated levels for every area

- **Original HTML:** The areas board already showed level cards, but the product requirement needed all seven areas and consistent expansion.
- **Mentor requirement:** Page 4–5 require three levels (`minimum`, `lepiej`, `najlepiej`) per area, with “Dlaczego to ważne?” and cost optimization.
- **Action:** Every `EventArea` has exactly three typed `OptionLevel` entries. Cards expand/collapse independently and show cost effects; choices persist in creator state and feed the guide path.
- **Code:** `OptionLevel` in `src/types/index.ts` (line 7), `eventAreas` in `src/data/knowledgeBase.ts` (line 11), and expandable card logic in `CreatorPage` (`src/components/creator/CreatorPage.tsx`, line 7).

### DEC-04: Strict 6R ordering and reusable-first boundary

- **Original HTML:** Rules were a separate visual board and could be read as generic recycling guidance.
- **Mentor requirement:** Pages 2–5 set the mandatory order `Przemyśl → Rezygnuj → Ograniczaj → Używaj ponownie → Naprawiaj → Recykling`; reusable tableware outranks biodegradable disposable tableware.
- **Action:** `sixRHierarchy` is the sole ordered source. Catering level 2/3 explicitly uses reusable dishes and the note warns that biodegradable disposables are lower in the hierarchy and only valid with real composting.
- **Code:** `sixRHierarchy` and catering note/levels in `src/data/knowledgeBase.ts` (lines 2 and 22); `RulesPage` in `src/pages/RulesPage.tsx` (line 2).

### DEC-05: Locality and seasonality as universal filters

- **Original HTML:** Area cards contained sustainability tags but did not consistently enforce locality/seasonality.
- **Mentor requirement:** Pages 1–3, 5, and 9: “im dalej od nas, tym gorzej,” local resources, no exotic products, and seasonality.
- **Action:** Catering levels include local orchard/bakery examples, `Lokalność ≤ 20 km`, seasonality tags, and criteria that ask for origin and kilometres. Rules page makes these boundary rules visible.
- **Code:** catering data and `Pochodzenie i odległość`/`Sezonowość` criteria in `knowledgeBase.ts`; `RulesPage.tsx`.

### DEC-06: UŁ pilot defaults and transport priority

- **Original HTML:** The start board had an illustrative UŁ journey but no explicit parameter controls.
- **Mentor requirement:** Pages 1–2, 6–8: UŁ Łódź pilot, approximately 20 km analysis, rail/electric buses, and start time matched to train arrivals.
- **Action:** `defaultPilot` seeds UŁ/Łódź, 20 km, 09:30, rail and electric-bus priorities. Start page makes radius and time editable so the open radius question can be resolved without code changes.
- **Code:** `PilotConfig` and `defaultPilot` in `src/types/index.ts` (line 18) and `src/data/knowledgeBase.ts` (line 73); controls in `StartPage` (`src/pages/StartPage.tsx`, line 5).

### DEC-07: Dual checklists

- **Original HTML:** The guide board showed an organizer checklist and team cards, but the refactor makes both first-class typed data and interactive.
- **Mentor requirement:** Pages 1, 6–8 require the master organizer checklist plus role-based task checklists for individual team members.
- **Action:** Organizer items are checkable with progress; four role cards expose their own task checkboxes and contact placeholders.
- **Code:** `organizerChecklist` and `teamRoles` in `src/data/knowledgeBase.ts` (lines 57 and 67); `GuidePage` in `src/components/checklists/GuidePage.tsx` (line 6).

### DEC-08: Cost optimization tied to choices

- **Original HTML:** Cost chips existed in level cards but were not summarized.
- **Mentor requirement:** Pages 2, 6–7 call out lower costs for no printing, no gadgets, and exact meal portions.
- **Action:** Each level carries a typed `CostEffect`; the creator summarizes selections that lower cost and displays the effect next to the “why” explanation.
- **Code:** `CostEffect`/`OptionLevel` in `src/types/index.ts` (lines 3 and 7); cost data and summary in `CreatorPage` (`src/components/creator/CreatorPage.tsx`, line 7).

### DEC-09: Grounded, educational guidance

- **Original HTML:** The baseline guide presented static advice but did not make the boundary between fixed knowledge and generated text explicit.
- **Mentor requirement:** Pages 1–2 and 6–7 say principles, areas, options, and criteria must be a fixed team-maintained base; Gemini may only assemble a personalized guide and must not invent facts. Each decision needs a short educational explanation.
- **Action:** The knowledge base is imported directly by the creator, criteria, rules, and guide. Every option carries `why`; the guide copy states that AI assembles choices without adding facts.
- **Code:** `src/data/knowledgeBase.ts`, `CreatorPage.tsx` (level `why` rendering), and `GuidePage.tsx` (intro copy).

### DEC-10: Eleven areas, and supplier knowledge inside the area

- **Previous state:** seven lifecycle areas; supplier criteria were one global list of seven shown only on the criteria page, and the creator rendered an area's provider questions as a bare list.
- **Decision:** the product owner asked for more areas, more closely fitted to the event. `AreaId` gains `miejsce-i-sala`, `energia-i-woda`, `komunikacja`, and `dostepnosc`. This deliberately overrides the PDF's seven; three levels per area and the fixed 6R order are unchanged.
- **Action:** `vendorCriteria` is untouched and the criteria page still shows it in full. A new `areaCriteria` export mirrors the backend's `AREA_CRITERIA` — detailed criteria written per area, each naming the evidence to ask for — and `AreaKnowledge` renders an area's questions, criteria and greenwashing warnings under its levels.
- **Code:** `src/types/index.ts` (`AreaId`, `AreaCriterion`), `src/data/knowledgeBase.ts` (`areaCriteria` and the attach loop), `src/components/creator/AreaKnowledge.tsx`.

### DEC-11: Nothing the organizer needs is collapsed by default

- **Previous state:** `CreatorPage` kept an `expanded` map seeded `{'dojazd-1': true}`, so the educational "why", the cost effect, the tags and the *Wybierz ten poziom* button were hidden until the card was clicked — and reset to closed on every area change.
- **Decision:** the organizer should not have to click to discover what a level means or what to ask a supplier.
- **Action:** the expansion state is gone; all three levels render open, and the per-area supplier knowledge below them is never collapsed either.
- **Code:** `src/components/creator/CreatorPage.tsx`, `src/components/creator/AreaKnowledge.tsx`, `src/styles/knowledge.css`.

### DEC-12: The description is a creator field, and AI may propose areas from it

- **Previous state:** `rawDescription` existed in the TS contract and on `EventCreate`, but no input collected it; `App.tsx` sent a hardcoded sentence.
- **Decision:** collect it in the basics step and let Gemini propose which areas the event needs. Suggestions pre-tick toggles and show a Polish reason; they never lock the organizer's choice.
- **Action:** `NeedsStep` gained the suggest button. Because the step is Gemini-only and `USE_MOCK_AI=true` is the default, an unavailable model renders the backend's own Polish sentence instead of doing nothing.
- **Code:** `src/components/creator/CreatorPage.tsx` (basics form), `src/components/creator/NeedsStep.tsx`, `api.suggestAreas` in `src/lib/api.ts`.

### DEC-13: The guide button works from anywhere, and failures are visible

- **Previous state:** `onGenerate` was `async () => { if (event) { ... } }`. Reached from the header navigation without visiting the creator, `event` was `null` and the click did nothing — no error, no spinner — and `GuidePage` falls back to the static checklist, so the page looked the same either way. No call in the chain had a `try/catch`, and `.api-error` was referenced in `App.tsx` but defined in no stylesheet.
- **Decision:** one shared path for both entry points, creating the event first; every failure reaches the screen.
- **Action:** `runGuide` calls `ensureEvent` first, sets a `busy` flag, and routes errors into the visible `.api-error` banner, which now has styles. The redundant `GET` after the `POST` is gone. `GuidePage` says plainly when it is still showing the general base. The basics step sends only changed fields, because PATCHing location, date or attendees wipes every level choice.
- **Code:** `src/App.tsx` (`runGuide`, `guard`), `src/components/checklists/GuidePage.tsx`, `src/styles/global.css`, `src/components/creator/CreatorPage.tsx` (`saveBasics`).

### DEC-14: The share link has a client, and `/w/{slug}` is the one parsed route

- **Previous state:** the backend had carried the whole sharing contract since backend DEC-17 — an 8-character `slug`, a `shareUrl` built as `{PUBLIC_BASE_URL}/w/{slug}`, `GET /api/v1/public/events/{slug}` and the `PublicEventView` whitelist, with eight tests. The frontend had no counterpart at all: `src/` contained no occurrence of `slug`, `public` or `/w/`, `EventRecord` dropped both `slug` and `shareUrl` although the API returned them, and nothing read `window.location`. nginx's `try_files … /index.html` answered `/w/{slug}` with the SPA, which always rendered the start view, so a share link returned 200 and showed nothing of the event. The organizer also had no way to obtain the link in the first place.
- **Decision:** add the missing client, and read the one public route by hand rather than adopting a router. DEC-00's "no router, `App.tsx` owns all state" stays the rule for the six organizer views; `/w/{slug}` is the single exception, because it is an entry point rather than a navigation target.
- **Action:** `App.tsx` matches `window.location.pathname` against `/^\/w\/([A-Za-z0-9_-]{1,32})\/?$/` in a `useState` initializer — before the first render, so a visitor never sees the organizer start screen flash — and the bootstrap effect then fetches either the public projection or `/reference-data`, never both. A visitor's session must not touch `ensureEvent`, which creates an event, so `PageShell` gained `chrome='minimal'`: brand and footer, no organizer navigation whose every target would create one. The public checklists render `disabled`, because the public endpoint is read-only and has no mutation to offer; they report the organizer's progress rather than inviting a change to it. The guide view shows the link with a copy button (clipboard, falling back to a selectable read-only field).
- **Reuse rather than copies:** the milestone grouping that `GuidePage` had inline moved to `components/checklists/milestones.ts`, and `ImpactPage`'s `formatKg`/`formatPln` to `lib/format.ts`; both pages import them, so the public page cannot drift from the organizer one.
- **Code:** `src/App.tsx`, `src/components/public/PublicEventPage.tsx`, `src/components/layout/Layout.tsx` (`View`, `PageShell`), `src/components/checklists/GuidePage.tsx` (`ShareLink`), `src/components/checklists/milestones.ts`, `src/lib/format.ts`, `src/lib/api.ts` (`publicEvent`, `slug`, `shareUrl`), `src/types/index.ts` (`Ustalenie`, `PublicEventView`), `src/styles/global.css`.
- **Not done:** no organizer deep link. The event id still lives only in React state, so a reload loses the event in progress, and there is no `/e/{id}`.

### DEC-15: The pilot university leaves the frontend too

- **Previous state:** backend DEC-20 made the backend neutral and `backend/tests/test_no_pilot_references.py` guards it, but that sweep covers `backend/` only. The frontend still named the pilot institution in five places: the event defaults in `App.tsx` (`'Wydarzenie na UŁ'`, `'Zrównoważone wydarzenie w pilotażu UŁ.'`, `'Łódź i okolice'`), the start page's pilot card heading, `CreatorPage`'s default place, `normalizeReference`'s fallback `default_pilot.city`, and three strings in the `knowledgeBase.ts` fallback copy (the `dojazd` lead, the catering level-2 "why", checklist item `o1`) plus `defaultPilot.city`.
- **Why it surfaced now:** DEC-14 gave those defaults a public audience. An organizer who generated a guide without editing the basics shared a link whose page was headed "Wydarzenie na UŁ" — the pilot institution named on a public page, which the CLAUDE.md constraint forbids outright.
- **Decision:** carry the backend's neutral wording over verbatim rather than inventing new Polish, so the fallback cannot drift from `/reference-data`. Strings taken from the live endpoint: `"Miasto wydarzenia"`, `"Miasto wydarzenia i okolice"`, `"Miejsce wydarzenia"`, `"Dojazd uczestników zwykle waży najwięcej. Połącz kolej, autobusy elektryczne i godzinę startu dopasowaną do rozkładu."`, `"Jabłka z lokalnego sadu zastępują produkty wożone z daleka."`, `"Sprawdź połączenia kolejowe i autobusowe do miejsca wydarzenia oraz dopasuj godzinę rozpoczęcia do pociągów."`
- **Action:** the start page's pilot card now renders `{pilot.city}` instead of a hardcoded heading, so it follows the configured pilot rather than restating it. `grep -rn "UŁ\|Uniwersytet\|Łódz\|Łodzi" frontend/src` returns nothing, and a freshly created event renders as "Wydarzenie · Konferencja · Miasto wydarzenia".
- **Code:** `src/App.tsx` (`ensureEvent`), `src/pages/StartPage.tsx`, `src/components/creator/CreatorPage.tsx`, `src/lib/api.ts` (fallback pilot), `src/data/knowledgeBase.ts`.
- **Gap worth closing:** nothing automated guards this on the frontend side; `test_no_pilot_references.py` still sweeps `backend/` only.

## Open questions from PDF page 9 and current handling

1. **“Prawdziwe firmy” vs “nie promujemy firm”:** current product shows only criteria and neutral supplier categories; no vendor directory. `CriteriaPage` can later accept a non-ranked category list without changing selection logic.
2. **“W poradniku od razu numery”:** the guide now carries two kinds of numbers. Contacts stay as editable `[IMIĘ I NAZWISKO · TELEFON / E-MAIL]` placeholders in `teamRoles`, never invented; the quantitative numbers — the before/after kg CO2e range, the PLN saving, and the eco motivator — are computed in Python by `impact_service.build_impact` from `ECO_SUMMARY` and the chosen levels, served by `GET /events/{id}/impact`, and rendered by `ImpactPage` with a Polish disclaimer that they are demonstrative, not measured.
3. **“Nie patrzymy, kiedy konferencja się odbywa”:** lifecycle measurement is not limited to event hours, while `PilotConfig.eventStart` remains explicit for train alignment.
4. **Biodegradable forks vs disposable cutlery:** current policy follows the PDF's strict hierarchy: reusable is above biodegradable, and biodegradable is only acceptable when actually composted. This is visible in catering data and the rules callout.
5. **20 km radius scope:** current default applies it to the UŁ pilot's local analysis and is exposed as a single slider. It can later be split into participant and supplier radii in `PilotConfig`.
6. **Before/after data source:** the impact view no longer asks the organizer to type numbers into a chart. It renders the backend's `ImpactSummary`, which names its sources explicitly: `emissionFactorSources` states that the emission factors are demonstrative, and `provenance` lists the three real-world sources the PDF asks about — the participant travel survey, the weighing of waste by fraction, and supplier invoices. Those labels live in one constant in `impact_service.py` and can be extended without touching `ImpactPage`. Replacing the demonstrative constants with measured data is a backend change only.
7. **Gratyfikacje funding and verification:** current level 3 describes discount/game/electric shuttle but marks cost as “Wymaga budżetu”; implementation remains a parameterized future policy decision.
8. **Event scale:** current checklists are role-based and size-neutral. A future `eventSize` field can select small/large templates in `knowledgeBase.ts`.
9. **Which 6R list:** current tool adopts the exact six-item order printed on PDF page 3 and keeps it in one source constant.
10. **After the pilot:** current pilot controls default to Łódź but are editable, so another city/university can be configured without rewriting area content.

## Validation

Run `npm install` and `npm run build` from `frontend/`; `npm run dev` does not type-check, so build before assuming a change is good. The backend side has no test suite or linter: `python -m compileall backend/app` is the closest available check. With `USE_MOCK_AI=true` (the default) the whole product runs deterministically without a Gemini key, and the frontend falls back to `knowledgeBase.ts` / `knowledgeExtras.ts` if `/reference-data` is unreachable. The source has no runtime dependency on the original HTML bundle; the original remains available for visual comparison and the decoder provides a reproducible inspection path.
