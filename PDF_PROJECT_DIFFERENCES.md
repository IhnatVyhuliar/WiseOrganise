# Project review against the PDF

**Reviewed:** `Podsumowanie-spotkania-platforma-zrównoważonych-wydarzeń.pdf` (9 pages, 20 October 2026) and the current backend/frontend source.

## Overall result

The project implements most of the PDF's product direction: a Polish event-planning creator, lifecycle framing, three option levels with explanations and cost effects, the fixed six-step 6R order, locality/seasonality/circularity rules, employment on an employment contract, neutral supplier criteria, greenwashing checks, organizer/team checklists, an impact view, and Gemini grounding with a deterministic fallback.

It is not an exact implementation of the PDF. The differences below are the ones that matter.

## Differences and gaps

| Severity | PDF expectation | What the project does | Evidence |
|---|---|---|---|
| **Intentional scope change** | Pages 3–5 define **seven** lifecycle areas: transport, accommodation, catering, materials, gadgets, people, and after the event. | The product exposes **eleven** areas by adding venue/room, energy/water, communication, and accessibility. The decision logs say this was an explicit product-owner override, so it is deliberate scope rather than an accidental mismatch. | `backend/app/mocks/knowledge_mocks.py:52`, `backend/BACKEND_ALIGNMENT_DECISIONS.md` DEC-11, `frontend/src/data/knowledgeBase.ts:13-67` |
| **Gap** | The UŁ pilot should check local resources and connections within about 20 km, including rail/electric buses and a start time matched to train arrivals (pages 1–2, 7–8). | The UI and API carry static pilot labels/default strings and an editable radius/time, but there is no timetable, route, map, geocoding, supplier-locality, or transport-data integration. Changing the radius does not recalculate anything. | `backend/app/schemas/event.py:15-32`, `frontend/src/pages/StartPage.tsx`, `backend/app/services/impact_service.py:28-78` |
| **Gap** | The PDF asks for a guide/checklist for each person in the team, with contacts (pages 6–7). | The guide has role-based task cards, but every contact is the literal placeholder `[IMIĘ I NAZWISKO · TELEFON / E-MAIL]`; there is no UI or API to assign a person or edit/save a contact. | `backend/app/mocks/knowledge_mocks.py:168`, `frontend/src/components/checklists/GuidePage.tsx` |
| **Gap / latent defect** | Supplier selection should be criteria/questions instead of company recommendations or ranking (pages 5–8). | The main UI follows this rule, but legacy compatibility endpoints still expose `VendorRecommendation` fields (`eco_score`, `trust_score`, `cost_score`, `total_score`) and a selectable recommendation card. The endpoint also iterates all areas through a seven-entry category map, so calling `POST /api/v1/events/{id}/recommend` with the current 11-area base returns a 409 `"miejsce-i-sala"` rather than a neutral criteria response. | `backend/app/services/recommendation_service.py:15-18,57-127`, `backend/app/schemas/recommendation.py:7-30`; reproduced with the API (409) |
| **Gap** | The PDF describes impact before/after as a comparison based on real follow-up data such as a travel survey, waste weights, and supplier invoices (pages 6, 9). | The implementation clearly labels its result as demonstrative and lists those sources, but it only computes a synthetic range from fixed constants and selected levels. There are no fields or endpoints for entering/importing measured survey, waste, or invoice data. | `backend/app/mocks/knowledge_mocks.py:184`, `backend/app/services/impact_service.py:28-88`, `frontend/src/components/impact/ImpactPage.tsx:29,155-156` |
| **Difference in AI availability** | AI is described as generating the personalized guide/checklists (pages 2, 6–7). | By default (`USE_MOCK_AI=true`, no key), the product deliberately uses the deterministic guide; area suggestions explicitly report that Gemini is unavailable. This is a documented fallback, but live AI is not available out of the box. | `backend/app/core/config.py:31-36`, `backend/app/services/suggestion_service.py:31-49`, `backend/app/services/eguide_service.py:21-47` |
| **Minor wording difference** | The PDF states a single pilot scenario, initially focused on UŁ and a roughly 20 km radius. | The start screen allows the radius and start time to be changed and says the tool can be moved to another city/university. This extends the PDF's pilot framing; it is documented as a portability choice. | `frontend/src/pages/StartPage.tsx`, `frontend/ARCHITECTURE_AND_DECISIONS.md` open-question handling |

## Areas that are aligned

- No named company promotion or ranking in the main product UI; supplier guidance is criteria, questions, evidence, and greenwashing warnings.
- Fixed 6R order is present: **Przemyśl → Rezygnuj → Ograniczaj → Używaj ponownie → Naprawiaj → Recykling**.
- Reusable tableware is placed above biodegradable disposable items, with composting required for the latter.
- The content includes locality ("im dalej od nas, tym gorzej"), seasonality, circular economy, and employment on an employment contract.
- Every configured area has exactly three levels, each with a short description, "why", and cost effect.
- The full participant lifecycle is represented, including post-event measurement and lessons for the next edition.
- The creator can narrow the needed areas, persist level choices, generate a guide, and toggle checklist completion.
- User-facing product content is Polish, and Gemini prompts constrain the model to the maintained knowledge base.

## Validation performed

- PDF text extraction: 9 pages read with `pdfplumber`.
- Backend syntax: `python -m compileall -q backend/app` — **pass**.
- API smoke test: `/reference-data`, event creation, area suggestion fallback, needed-area selection, option selection, guide generation, and impact endpoint — **pass**.
- Reference data check: 11 areas, exactly 3 levels per area, 7 universal supplier criteria, and 11 area-specific criteria groups.
- Legacy recommendation smoke test: `POST /api/v1/events/{id}/recommend` — **fails with HTTP 409** on the added `miejsce-i-sala` area, as described above.
- Frontend build was not run because `frontend/node_modules` is absent in the project environment.

## Conclusion

The core PDF direction is implemented and the differences are mostly documented extensions or prototype limitations. The two items that deserve attention before calling the project fully aligned are the broken legacy recommendation route (or its removal) and the lack of real/local transport and measured-impact data.
