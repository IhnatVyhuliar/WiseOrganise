import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { PageShell, type View } from './components/layout/Layout';
import { StartPage } from './pages/StartPage';
import { CreatorPage } from './components/creator/CreatorPage';
import { RulesPage } from './pages/RulesPage';
import { CriteriaPage } from './components/criteria/CriteriaPage';
import { GuidePage } from './components/checklists/GuidePage';
import type { GuideDecision } from './components/checklists/GuidePage';
import { ImpactPage } from './components/impact/ImpactPage';
import { PublicEventEmptyState, PublicEventPage } from './components/public/PublicEventPage';
import { api, getApiErrorMessage, normalizeReference, type ChecklistDonePayload, type EventRecord, type ReferenceData, type PublicEventResponse } from './lib/api';
import type { AreaId, ImpactSummary } from './types';
import { eventAreas as fallbackAreas, areaCriteria as fallbackAreaCriteria, vendorCriteria as fallbackCriteria, sixRHierarchy as fallbackRules, organizerChecklist as fallbackChecklist, teamRoles as fallbackRoles, defaultPilot } from './data/knowledgeBase';
import { contractClauses as fallbackClauses, greenwashingRisks as fallbackRisks, ecoSummary as fallbackEcoSummary } from './data/knowledgeExtras';
import './styles/global.css';

function readPublicEventSlug(): string | null {
  const match = window.location.pathname.match(/^\/event\/([^/]+)\/?$/);
  if (!match) return null;
  try { return decodeURIComponent(match[1]); } catch { return match[1]; }
}

function App() {
  const publicSlug = readPublicEventSlug();
  const publicMode = Boolean(publicSlug);
  const [publicPayload, setPublicPayload] = useState<PublicEventResponse | null>(null);
  const [publicLoading, setPublicLoading] = useState(publicMode);
  const [publicFailed, setPublicFailed] = useState(false);
  const [view, setView] = useState<View>('start');
  const [reference, setReference] = useState<ReferenceData>({ six_r: fallbackRules, areas: fallbackAreas, criteria: fallbackCriteria, area_questions: fallbackAreas.map((area) => ({ areaId: area.id, areaName: area.name, providerQuestions: area.providerQuestions })), area_criteria: fallbackAreaCriteria, organizer_checklist: fallbackChecklist, team_roles: fallbackRoles, contract_clauses: fallbackClauses, greenwashing_risks: fallbackRisks, eco_summary: fallbackEcoSummary, default_pilot: defaultPilot, source_ids: [] });
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [eguide, setEguide] = useState<any>(null);
  const [neededAreas, setNeededAreas] = useState<AreaId[] | null>(null);
  const [impact, setImpact] = useState<ImpactSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const reportError = (err: unknown, fallback: string) => {
    const message = getApiErrorMessage(err, fallback);
    setError(message === 'Generate the e-guide first' ? 'Najpierw wygeneruj poradnik, aby zaznaczac zadania' : message);
  };
  /** Surface a failed call instead of letting the rejection vanish. */
  const guard = async (run: () => Promise<void>, fallback: string) => { setError(''); try { await run(); } catch (err) { reportError(err, fallback); } };
  useEffect(() => {
    if (publicMode) { setLoading(false); return; }
    (async () => { try { setReference(normalizeReference(await api.reference())); } catch (err) { reportError(err, 'Nie udalo sie pobrac bazy wiedzy.'); } finally { setLoading(false); } })();
  }, [publicMode]);
  useEffect(() => {
    if (!publicSlug) return;
    let cancelled = false;
    void api.publicEvent(publicSlug).then((payload) => { if (!cancelled) setPublicPayload(payload); }).catch(() => { if (!cancelled) setPublicFailed(true); }).finally(() => { if (!cancelled) setPublicLoading(false); });
    return () => { cancelled = true; };
  }, [publicSlug]);
  const ensureEvent = async (payload: Record<string, unknown> = {}) => { if (event) return event; const created = await api.createEvent({ title: 'Wydarzenie', eventType: 'Konferencja', rawDescription: 'Zrównowazone wydarzenie w neutralnym scenariuszu.', attendees: 120, location: reference.default_pilot.city, eventDate: '2026-11-20', participantOrigins: 'okolice miejsca wydarzenia', pilot: reference.default_pilot, ...payload }); setEvent(created); return created; };
  const saveEvent = async (payload: Record<string, unknown>) => { const current = await ensureEvent(payload); const next = await api.updateEvent(current.id, payload); setEvent(next); if (['location', 'eventDate', 'attendees', 'pilot', 'neededAreas', 'event_date', 'needed_areas'].some((field) => field in payload)) { setEguide(null); setImpact(null); } return next; };
  const onNeededAreas = (areas: AreaId[]) => guard(async () => { const current = await ensureEvent(); const next = await api.setNeededAreas(current.id, areas); setEvent(next); setNeededAreas(next.neededAreas ?? areas); setEguide(null); setImpact(null); }, 'Nie udalo sie zapisac wybranych obszarów.');
  const onToggleDone = async (payload: ChecklistDonePayload) => { await guard(async () => { const current = await ensureEvent(); if (!eguide) { let guide; try { guide = await api.eguide(current.id); } catch { guide = await api.generateEguide(current.id); } setEguide(guide); } setEguide(await api.setChecklistDone(current.id, payload)); }, 'Nie udalo sie zapisac zaznaczenia.'); };
  useEffect(() => {
    if (view !== 'guide' || loading || eguide || busy) return;
    let cancelled = false;
    void (async () => {
      try {
        const current = await ensureEvent();
        let guide;
        try { guide = await api.eguide(current.id); } catch { guide = await api.generateEguide(current.id); }
        if (!cancelled) { setEguide(guide); setImpact(await api.impact(current.id)); }
      } catch (err) { if (!cancelled) reportError(err, 'Nie udalo sie pobrac poradnika.'); }
    })();
    return () => { cancelled = true; };
  }, [view, loading, eguide, busy]);
  useEffect(() => {
    if (view !== 'guide' || !event?.id || eguide?.aiStatus !== 'in_progress') return;
    let attempts = 0;
    let stopped = false;
    const timer = globalThis.setInterval(() => {
      if (stopped || attempts >= 12) { globalThis.clearInterval(timer); return; }
      attempts += 1;
      void api.eguide(event.id).then((next) => { if (!stopped) setEguide(next); }).catch(() => undefined);
    }, 3000);
    return () => { stopped = true; globalThis.clearInterval(timer); };
  }, [view, event?.id, eguide?.aiStatus]);
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
  }, 'Nie udalo sie wygenerowac poradnika.');
  let page: ReactNode;
  if (publicMode) {
    page = publicLoading ? <main className="page"><div className="loading-state">Laduje wydarzenie.</div></main> : publicFailed || !publicPayload ? <PublicEventEmptyState /> : <PublicEventPage payload={publicPayload} />;
  } else if (loading) page = <main className="page"><div className="loading-state">Laduje baze wiedzy.</div></main>;
  else if (view === 'start') page = <StartPage onNavigate={setView} pilot={reference.default_pilot} onStart={(payload) => guard(async () => { await ensureEvent(payload); setView('creator'); }, 'Nie udalo sie zapisac danych wydarzenia.')} />;
  else if (view === 'creator') page = <CreatorPage onNavigate={setView} areas={reference.areas} event={event} ensureEvent={ensureEvent} saveEvent={saveEvent} neededAreas={neededAreas} onNeededAreas={onNeededAreas} onGuide={() => runGuide(true)} />;
  else if (view === 'rules') page = <RulesPage rules={reference.six_r} />;
  else if (view === 'criteria') page = <CriteriaPage criteria={reference.criteria} areaQuestions={reference.area_questions} contractClauses={reference.contract_clauses} greenwashingRisks={reference.greenwashing_risks} />;
  else if (view === 'guide') {
    const decisions: GuideDecision[] = Object.entries(event?.selectedOptions || event?.selected_options || {}).map(([areaId, level]) => {
      const area = reference.areas.find((item) => item.id === areaId);
      const option = area?.levels.find((item) => item.level === Number(level));
      return { area: area?.name || areaId, level: Number(level), justification: option?.why || 'Uzasadnienie zapisane w bazie wiedzy.', cost: option?.cost || 'Zalezy od oferty' };
    });
    const slug = event?.slug;
    const shareUrl = event?.shareUrl || event?.share_url || (slug ? `${window.location.origin}/event/${slug}` : `${window.location.origin}/event/${event?.id || ''}`);
    page = <GuidePage checklist={reference.organizer_checklist} roles={reference.team_roles} eguide={eguide} decisions={decisions} shareUrl={shareUrl} onNavigate={setView} onToggleDone={onToggleDone} onGenerate={() => runGuide()} busy={busy} />;
  }
  else page = <ImpactPage eguide={eguide} impact={impact} ecoSummary={reference.eco_summary} />;
  return <PageShell view={view} onNavigate={setView} publicMode={publicMode}>{!publicMode && error && <div className="api-error" role="alert">{error}</div>}{page}</PageShell>;
}
export default App;
