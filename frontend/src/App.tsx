import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { PageShell, type View } from './components/layout/Layout';
import { StartPage } from './pages/StartPage';
import { CreatorPage } from './components/creator/CreatorPage';
import { RulesPage } from './pages/RulesPage';
import { CriteriaPage } from './components/criteria/CriteriaPage';
import { GuidePage } from './components/checklists/GuidePage';
import { ImpactPage } from './components/impact/ImpactPage';
import { api, normalizeReference, type ChecklistDonePayload, type EventRecord, type ReferenceData } from './lib/api';
import type { AreaId, ImpactSummary } from './types';
import { eventAreas as fallbackAreas, areaCriteria as fallbackAreaCriteria, vendorCriteria as fallbackCriteria, sixRHierarchy as fallbackRules, organizerChecklist as fallbackChecklist, teamRoles as fallbackRoles, defaultPilot } from './data/knowledgeBase';
import { contractClauses as fallbackClauses, greenwashingRisks as fallbackRisks, ecoSummary as fallbackEcoSummary } from './data/knowledgeExtras';
import './styles/global.css';

function App() {
  const [view, setView] = useState<View>('start');
  const [reference, setReference] = useState<ReferenceData>({ six_r: fallbackRules, areas: fallbackAreas, criteria: fallbackCriteria, area_questions: fallbackAreas.map((area) => ({ areaId: area.id, areaName: area.name, providerQuestions: area.providerQuestions })), area_criteria: fallbackAreaCriteria, organizer_checklist: fallbackChecklist, team_roles: fallbackRoles, contract_clauses: fallbackClauses, greenwashing_risks: fallbackRisks, eco_summary: fallbackEcoSummary, default_pilot: defaultPilot, source_ids: [] });
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [eguide, setEguide] = useState<any>(null);
  const [neededAreas, setNeededAreas] = useState<AreaId[] | null>(null);
  const [impact, setImpact] = useState<ImpactSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  /** Surface a failed call instead of letting the rejection vanish. */
  const guard = async (run: () => Promise<void>, fallback: string) => { setError(''); try { await run(); } catch (err) { setError(err instanceof Error ? err.message : fallback); } };
  useEffect(() => { (async () => { try { setReference(normalizeReference(await api.reference())); } catch (err) { setError(err instanceof Error ? err.message : 'Nie udało się pobrać bazy wiedzy.'); } finally { setLoading(false); } })(); }, []);
  const ensureEvent = async (payload: Record<string, unknown> = {}) => { if (event) return event; const created = await api.createEvent({ title: 'Wydarzenie na UŁ', eventType: 'Konferencja', rawDescription: 'Zrównoważone wydarzenie w pilotażu UŁ.', attendees: 120, location: reference.default_pilot.city, eventDate: '2026-11-20', participantOrigins: 'Łódź i okolice', pilot: reference.default_pilot, ...payload }); setEvent(created); return created; };
  const saveEvent = async (payload: Record<string, unknown>) => { const current = await ensureEvent(payload); const next = await api.updateEvent(current.id, payload); setEvent(next); return next; };
  const onNeededAreas = (areas: AreaId[]) => guard(async () => { const current = await ensureEvent(); const next = await api.setNeededAreas(current.id, areas); setEvent(next); setNeededAreas(next.neededAreas ?? areas); }, 'Nie udało się zapisać wybranych obszarów.');
  const onToggleDone = (payload: ChecklistDonePayload) => guard(async () => { const current = await ensureEvent(); setEguide(await api.setChecklistDone(current.id, payload)); }, 'Nie udało się zapisać zaznaczenia.');
  // One path for both entry points. ensureEvent comes first so the guide button
  // also works when the organizer opened the guide from the header navigation
  // without ever walking through the creator.
  const runGuide = (navigate = false) => guard(async () => {
    setBusy(true);
    try {
      const current = await ensureEvent();
      setEguide(await api.generateEguide(current.id));
      setImpact(await api.impact(current.id));
      if (navigate) setView('guide');
    } finally { setBusy(false); }
  }, 'Nie udało się wygenerować poradnika.');
  let page: ReactNode;
  if (loading) page = <main className="page"><div className="loading-state">Ładuję bazę wiedzy.</div></main>;
  else if (view === 'start') page = <StartPage onNavigate={setView} pilot={reference.default_pilot} onStart={async (payload) => { await ensureEvent(payload); setView('creator'); }} />;
  else if (view === 'creator') page = <CreatorPage onNavigate={setView} areas={reference.areas} event={event} ensureEvent={ensureEvent} saveEvent={saveEvent} neededAreas={neededAreas} onNeededAreas={onNeededAreas} onGuide={() => runGuide(true)} />;
  else if (view === 'rules') page = <RulesPage rules={reference.six_r} />;
  else if (view === 'criteria') page = <CriteriaPage criteria={reference.criteria} areaQuestions={reference.area_questions} contractClauses={reference.contract_clauses} greenwashingRisks={reference.greenwashing_risks} />;
  else if (view === 'guide') page = <GuidePage checklist={reference.organizer_checklist} roles={reference.team_roles} eguide={eguide} eventId={event?.id} onNavigate={setView} onToggleDone={onToggleDone} onGenerate={() => runGuide()} busy={busy} hasGuide={!!eguide} />;
  else page = <ImpactPage eguide={eguide} impact={impact} ecoSummary={reference.eco_summary} />;
  return <PageShell view={view} onNavigate={setView}>{error && <div className="api-error" role="alert">{error}</div>}{page}</PageShell>;
}
export default App;
