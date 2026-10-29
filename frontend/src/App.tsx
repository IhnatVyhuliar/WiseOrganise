import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { PageShell, type View } from './components/layout/Layout';
import { StartPage } from './pages/StartPage';
import { CreatorPage } from './components/creator/CreatorPage';
import { RulesPage } from './pages/RulesPage';
import { CriteriaPage } from './components/criteria/CriteriaPage';
import { GuidePage } from './components/checklists/GuidePage';
import { ImpactPage } from './components/impact/ImpactPage';
import { PublicEventPage } from './components/public/PublicEventPage';
import { api, normalizeReference, type ChecklistDonePayload, type EventRecord, type ReferenceData } from './lib/api';
import type { AreaId, ImpactSummary, PublicEventView } from './types';
import { eventAreas as fallbackAreas, areaCriteria as fallbackAreaCriteria, vendorCriteria as fallbackCriteria, sixRHierarchy as fallbackRules, organizerChecklist as fallbackChecklist, teamRoles as fallbackRoles, defaultPilot } from './data/knowledgeBase';
import { contractClauses as fallbackClauses, greenwashingRisks as fallbackRisks, ecoSummary as fallbackEcoSummary } from './data/knowledgeExtras';
import './styles/global.css';

/** The share link the backend hands out: {PUBLIC_BASE_URL}/w/{slug}. */
const PUBLIC_PATH = /^\/w\/([A-Za-z0-9_-]{1,32})\/?$/;

/** A visitor who followed a dead link gets a written page, not a technical error banner. */
function PublicNotFound({ message }: { message: string }) {
  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">Plan wydarzenia</div>
          <h1>Nie znaleziono tego wydarzenia</h1>
          <p>{message || 'Ten link nie prowadzi do żadnego planu.'} Mógł zostać skrócony przy kopiowaniu albo organizator zmienił adres. Poproś organizatora o aktualny link.</p>
        </div>
      </div>
    </main>
  );
}

function App() {
  // Read once, before the first render, so a visitor never sees the organizer start screen flash.
  const [publicSlug] = useState<string | null>(() => PUBLIC_PATH.exec(window.location.pathname)?.[1] ?? null);
  const [view, setView] = useState<View>(publicSlug ? 'public' : 'start');
  const [reference, setReference] = useState<ReferenceData>({ six_r: fallbackRules, areas: fallbackAreas, criteria: fallbackCriteria, area_questions: fallbackAreas.map((area) => ({ areaId: area.id, areaName: area.name, providerQuestions: area.providerQuestions })), area_criteria: fallbackAreaCriteria, organizer_checklist: fallbackChecklist, team_roles: fallbackRoles, contract_clauses: fallbackClauses, greenwashing_risks: fallbackRisks, eco_summary: fallbackEcoSummary, default_pilot: defaultPilot, source_ids: [] });
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [eguide, setEguide] = useState<any>(null);
  const [neededAreas, setNeededAreas] = useState<AreaId[] | null>(null);
  const [impact, setImpact] = useState<ImpactSummary | null>(null);
  const [publicView, setPublicView] = useState<PublicEventView | null>(null);
  const [publicError, setPublicError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  /** Surface a failed call instead of letting the rejection vanish. */
  const guard = async (run: () => Promise<void>, fallback: string) => { setError(''); try { await run(); } catch (err) { setError(err instanceof Error ? err.message : fallback); } };
  // A visitor on /w/{slug} needs only the public projection. The knowledge base bootstraps
  // the organizer views, which that visitor has no event for, so it is skipped there.
  useEffect(() => { (async () => { try { if (publicSlug) setPublicView(await api.publicEvent(publicSlug)); else setReference(normalizeReference(await api.reference())); } catch { if (publicSlug) setPublicError('Ten link nie prowadzi do żadnego planu.'); else setError('Nie udało się pobrać bazy wiedzy.'); } finally { setLoading(false); } })(); }, [publicSlug]);
  const ensureEvent = async (payload: Record<string, unknown> = {}) => { if (event) return event; const created = await api.createEvent({ title: 'Wydarzenie', eventType: 'Konferencja', rawDescription: 'Zrównoważone wydarzenie.', attendees: 120, location: reference.default_pilot.city, eventDate: '2026-11-20', participantOrigins: 'Miasto wydarzenia i okolice', pilot: reference.default_pilot, ...payload }); setEvent(created); return created; };
  const saveEvent = async (payload: Record<string, unknown>) => { const current = await ensureEvent(payload); const next = await api.updateEvent(current.id, payload); setEvent(next); return next; };
  const onNeededAreas = (areas: AreaId[]) => guard(async () => { const current = await ensureEvent(); const next = await api.setNeededAreas(current.id, areas); setEvent(next); setNeededAreas(next.neededAreas ?? areas); }, 'Nie udało się zapisać wybranych obszarów.');
  const onToggleDone = (payload: ChecklistDonePayload) => guard(async () => { const current = await ensureEvent(); setEguide(await api.setChecklistDone(current.id, payload)); }, 'Nie udało się zapisać zaznaczenia.');
  // One path for both entry points. ensureEvent comes first so the guide button
  // also works when the organizer opened the guide from the header navigation
  // without ever walking through the creator.
  // Only the creator starts a guide now, and it always lands on the guide view.
  const runGuide = () => guard(async () => {
    setBusy(true);
    try {
      const current = await ensureEvent();
      setEguide(await api.generateEguide(current.id));
      setImpact(await api.impact(current.id));
      setView('guide');
    } finally { setBusy(false); }
  }, 'Nie udało się wygenerować poradnika.');
  let page: ReactNode;
  if (loading) page = <main className="page"><div className="loading-state">{publicSlug ? 'Ładuję plan wydarzenia.' : 'Ładuję bazę wiedzy.'}</div></main>;
  else if (view === 'public') page = publicView ? <PublicEventPage view={publicView} /> : <PublicNotFound message={publicError} />;
  else if (view === 'start') page = <StartPage onNavigate={setView} pilot={reference.default_pilot} onStart={async (payload) => { await ensureEvent(payload); setView('creator'); }} />;
  else if (view === 'creator') page = <CreatorPage onNavigate={setView} areas={reference.areas} event={event} ensureEvent={ensureEvent} saveEvent={saveEvent} neededAreas={neededAreas} onNeededAreas={onNeededAreas} onGuide={() => runGuide()} />;
  else if (view === 'rules') page = <RulesPage rules={reference.six_r} />;
  else if (view === 'criteria') page = <CriteriaPage criteria={reference.criteria} areaQuestions={reference.area_questions} contractClauses={reference.contract_clauses} greenwashingRisks={reference.greenwashing_risks} />;
  else if (view === 'guide') page = <GuidePage checklist={reference.organizer_checklist} roles={reference.team_roles} eguide={eguide} eventId={event?.id} shareUrl={event?.shareUrl} onNavigate={setView} onToggleDone={onToggleDone} hasGuide={!!eguide} />;
  else page = <ImpactPage eguide={eguide} impact={impact} ecoSummary={reference.eco_summary} />;
  return <PageShell view={view} onNavigate={setView} chrome={view === 'public' ? 'minimal' : 'full'}>{error && view !== 'public' && <div className="api-error" role="alert">{error}</div>}{page}</PageShell>;
}
export default App;
