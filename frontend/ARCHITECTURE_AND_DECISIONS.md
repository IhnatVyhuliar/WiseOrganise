# WiseOrganise frontend architecture and decisions

## Scope and source priority

This is a React + TypeScript + Vite refactor of `frontend/WiseOrganise — aplikacja.html`. The bundle was unpacked with `scripts/unpack_bundle.py`; its six HTML boards are preserved under `frontend/unpacked/` as an inspection artefact. The mentor summary is the authoritative product source. The supplied mentor summary PDF is the authoritative source; `summary.pdf` is retained as a compatibility copy. All Polish strings rendered by the product remain Polish; source code, names, and this document are English.

## Project structure

- `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`: Vite application shell and build configuration.
- `src/main.tsx`, `src/App.tsx`: React bootstrap and view-level navigation state.
- `src/types/index.ts`: `EventArea`, `OptionLevel`, `VendorCriterion`, checklist, team, and UŁ pilot interfaces.
- `src/data/knowledgeBase.ts`: the fixed 6R hierarchy, seven lifecycle areas and their three levels, provider verification criteria, organizer/team checklists, and parameterized UŁ pilot defaults.
- `src/components/layout/Layout.tsx`: `Header`, `PageShell`, and `Stepper`.
- `src/components/creator/CreatorPage.tsx`: event basics, lifecycle area navigation, expandable three-level cards, educational explanations, cost effects, provider questions, and selection state.
- `src/components/criteria/CriteriaPage.tsx`: neutral vendor criteria, verification questions, and greenwashing warning signals. It contains no company list or ranking.
- `src/components/checklists/GuidePage.tsx`: master organizer checklist and role-based team checklists with local completion state.
- `src/components/impact/ImpactPage.tsx`: editable before/after comparison for transport and waste measures.
- `src/pages/StartPage.tsx`: product entry point and editable UŁ pilot controls.
- `src/pages/RulesPage.tsx`: 6R hierarchy and boundary rules.
- `src/styles/global.css`: extracted visual system using the bundle's Bricolage Grotesque, Atkinson Hyperlegible, and light neutral/green theme.
- `src/assets/*.woff2`: fonts decoded from the bundle manifest.
- `scripts/unpack_bundle.py`: repeatable decoder for the original gzip/base64 manifest and template.

The original six boards map to `StartPage`, `CreatorPage`, `RulesPage`, `CriteriaPage`, `GuidePage`, and `ImpactPage`. The original embedded state logic for area and level selection became typed React state in `CreatorPage`.

## Priority override log (mentor PDF over HTML)

The PDF is authoritative whenever the saved HTML and summary differ. Page references below refer to the nine-page mentor PDF.

### DEC-01: Criteria instead of company promotion

- **Original HTML:** The baseline was a supplier/criteria board and its earlier direction allowed vendor-oriented content.
- **Mentor requirement:** Pages 1, 3, 5–8 require “Bez promowania firm”: give criteria, questions, and greenwashing signals; defer a company database/ranking.
- **Action:** `CriteriaPage` renders seven neutral criteria and area questions. No company names, “Top 3,” score, or ranking can be selected.
- **Code:** `src/components/criteria/CriteriaPage.tsx` (`CriteriaPage`, line 3), `vendorCriteria` in `src/data/knowledgeBase.ts` (line 48).

### DEC-02: Full participant lifecycle

- **Original HTML:** The boards were separated into start, areas, rules, suppliers, guide, and impact, but lifecycle emphasis was not enforced as a single journey.
- **Mentor requirement:** Pages 1, 3–4, 6–7 require impact from leaving home through return, with `Dojazd`, `Zakwaterowanie`, `Wydarzenie`, and `Po wydarzeniu`.
- **Action:** The creator has seven lifecycle areas: `Dojazd`, `Zakwaterowanie`, `Catering`, `Materiały`, `Gadżety`, `Ludzie / obsługa`, and `Po wydarzeniu`; the intro and after-event module explicitly cover return and leftovers.
- **Code:** `eventAreas` in `src/data/knowledgeBase.ts` (line 13), `CreatorPage` in `src/components/creator/CreatorPage.tsx` (line 6), and `ImpactPage` in `src/components/impact/ImpactPage.tsx` (line 3).

### DEC-03: Three graduated levels for every area

- **Original HTML:** The areas board already showed level cards, but the product requirement needed all seven areas and consistent expansion.
- **Mentor requirement:** Page 4–5 require three levels (`minimum`, `lepiej`, `najlepiej`) per area, with “Dlaczego to ważne?” and cost optimization.
- **Action:** Every `EventArea` has exactly three typed `OptionLevel` entries. Cards expand/collapse independently and show cost effects; choices persist in creator state and feed the guide path.
- **Code:** `OptionLevel` in `src/types/index.ts` (line 6), `eventAreas` in `src/data/knowledgeBase.ts` (line 13), and expandable card logic in `CreatorPage` (`src/components/creator/CreatorPage.tsx`, line 6).

### DEC-04: Strict 6R ordering and reusable-first boundary

- **Original HTML:** Rules were a separate visual board and could be read as generic recycling guidance.
- **Mentor requirement:** Pages 2–5 set the mandatory order `Przemyśl → Rezygnuj → Ograniczaj → Używaj ponownie → Naprawiaj → Recykling`; reusable tableware outranks biodegradable disposable tableware.
- **Action:** `sixRHierarchy` is the sole ordered source. Catering level 2/3 explicitly uses reusable dishes and the note warns that biodegradable disposables are lower in the hierarchy and only valid with real composting.
- **Code:** `sixRHierarchy` and catering note/levels in `src/data/knowledgeBase.ts` (lines 3 and 28); `RulesPage` in `src/pages/RulesPage.tsx` (line 3).

### DEC-05: Locality and seasonality as universal filters

- **Original HTML:** Area cards contained sustainability tags but did not consistently enforce locality/seasonality.
- **Mentor requirement:** Pages 1–3, 5, and 9: “im dalej od nas, tym gorzej,” local resources, no exotic products, and seasonality.
- **Action:** Catering levels include local orchard/bakery examples, `Lokalność ≤ 20 km`, seasonality tags, and criteria that ask for origin and kilometres. Rules page makes these boundary rules visible.
- **Code:** catering data and `Pochodzenie i odległość`/`Sezonowość` criteria in `knowledgeBase.ts`; `RulesPage.tsx`.

### DEC-06: UŁ pilot defaults and transport priority

- **Original HTML:** The start board had an illustrative UŁ journey but no explicit parameter controls.
- **Mentor requirement:** Pages 1–2, 6–8: UŁ Łódź pilot, approximately 20 km analysis, rail/electric buses, and start time matched to train arrivals.
- **Action:** `defaultPilot` seeds UŁ/Łódź, 20 km, 09:30, rail and electric-bus priorities. Start page makes radius and time editable so the open radius question can be resolved without code changes.
- **Code:** `PilotConfig` and `defaultPilot` in `src/types/index.ts` (lines 13 and 14) and `src/data/knowledgeBase.ts` (line 96); controls in `StartPage` (`src/pages/StartPage.tsx`, line 5).

### DEC-07: Dual checklists

- **Original HTML:** The guide board showed an organizer checklist and team cards, but the refactor makes both first-class typed data and interactive.
- **Mentor requirement:** Pages 1, 6–8 require the master organizer checklist plus role-based task checklists for individual team members.
- **Action:** Organizer items are checkable with progress; four role cards expose their own task checkboxes and contact placeholders.
- **Code:** `organizerChecklist` and `teamRoles` in `src/data/knowledgeBase.ts` (lines 57 and 67); `GuidePage` in `src/components/checklists/GuidePage.tsx` (line 4).

### DEC-08: Cost optimization tied to choices

- **Original HTML:** Cost chips existed in level cards but were not summarized.
- **Mentor requirement:** Pages 2, 6–7 call out lower costs for no printing, no gadgets, and exact meal portions.
- **Action:** Each level carries a typed `CostEffect`; the creator summarizes selections that lower cost and displays the effect next to the “why” explanation.
- **Code:** `CostEffect`/`OptionLevel` in `src/types/index.ts` (lines 6?7); cost data and summary in `CreatorPage` (`src/components/creator/CreatorPage.tsx`, line 6).

### DEC-09: Grounded, educational guidance

- **Original HTML:** The baseline guide presented static advice but did not make the boundary between fixed knowledge and generated text explicit.
- **Mentor requirement:** Pages 1?2 and 6?7 say principles, areas, options, and criteria must be a fixed team-maintained base; Gemini may only assemble a personalized guide and must not invent facts. Each decision needs a short educational explanation.
- **Action:** The knowledge base is imported directly by the creator, criteria, rules, and guide. Every option carries `why`; the guide copy states that AI assembles choices without adding facts.
- **Code:** `src/data/knowledgeBase.ts`, `CreatorPage.tsx` (level `why` rendering), and `GuidePage.tsx` (intro copy).

## Open questions from PDF page 9 and current handling

1. **“Prawdziwe firmy” vs “nie promujemy firm”:** current product shows only criteria and neutral supplier categories; no vendor directory. `CriteriaPage` can later accept a non-ranked category list without changing selection logic.
2. **“W poradniku od razu numery”:** current guide interprets this as numbered checklist progress plus editable `[IMIĘ I NAZWISKO · TELEFON / E-MAIL]` placeholders, not invented contacts. Team contacts are isolated in `teamRoles`.
3. **“Nie patrzymy, kiedy konferencja się odbywa”:** lifecycle measurement is not limited to event hours, while `PilotConfig.eventStart` remains explicit for train alignment.
4. **Biodegradable forks vs disposable cutlery:** current policy follows the PDF's strict hierarchy: reusable is above biodegradable, and biodegradable is only acceptable when actually composted. This is visible in catering data and the rules callout.
5. **20 km radius scope:** current default applies it to the UŁ pilot's local analysis and is exposed as a single slider. It can later be split into participant and supplier radii in `PilotConfig`.
6. **Before/after data source:** current impact view uses editable fields representing travel survey, waste weighing, and supplier invoices; provenance labels can be extended without changing the chart.
7. **Gratyfikacje funding and verification:** current level 3 describes discount/game/electric shuttle but marks cost as “Wymaga budżetu”; implementation remains a parameterized future policy decision.
8. **Event scale:** current checklists are role-based and size-neutral. A future `eventSize` field can select small/large templates in `knowledgeBase.ts`.
9. **Which 6R list:** current tool adopts the exact six-item order printed on PDF page 3 and keeps it in one source constant.
10. **After the pilot:** current pilot controls default to Łódź but are editable, so another city/university can be configured without rewriting area content.

## Validation

Run `npm install` and `npm run build` from `frontend/`. The source has no runtime dependency on the original HTML bundle; the original remains available for visual comparison and the decoder provides a reproducible inspection path.
