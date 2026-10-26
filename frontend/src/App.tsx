import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { PageShell, type View } from './components/layout/Layout';
import { StartPage } from './pages/StartPage';
import { CreatorPage } from './components/creator/CreatorPage';
import { RulesPage } from './pages/RulesPage';
import { CriteriaPage } from './components/criteria/CriteriaPage';
import { GuidePage } from './components/checklists/GuidePage';
import { ImpactPage } from './components/impact/ImpactPage';
import { api, normalizeReference, type EventRecord, type ReferenceData } from './lib/api';
import { eventAreas as fallbackAreas, vendorCriteria as fallbackCriteria, sixRHierarchy as fallbackRules, organizerChecklist as fallbackChecklist, teamRoles as fallbackRoles, defaultPilot } from './data/knowledgeBase';
import './styles/global.css';

function App() {
  const [view, setView] = useState<View>('start');
  const [reference, setReference] = useState<ReferenceData>({ six_r: fallbackRules, areas: fallbackAreas, criteria: fallbackCriteria, area_questions: [], organizer_checklist: fallbackChecklist, team_roles: fallbackRoles, default_pilot: defaultPilot, source_ids: [] });
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [eguide, setEguide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { (async () => { try { setReference(normalizeReference(await api.reference())); } catch (err) { setError(err instanceof Error ? err.message : 'Nie udaÅ‚o siÄ™ pobraÄ‡ bazy wiedzy.'); } finally { setLoading(false); } })(); }, []);
  const ensureEvent = async (payload: Record<string, unknown> = {}) => { if (event) return event; const created = await api.createEvent({ title: 'Wydarzenie na UÅ', eventType: 'Konferencja', rawDescription: 'ZrÃ³wnowaÅ¼one wydarzenie w pilotaÅ¼u UÅ.', attendees: 120, location: reference.default_pilot.city, eventDate: '2026-11-20', participantOrigins: 'ÅÃ³dÅº i okolice', pilot: reference.default_pilot, ...payload }); setEvent(created); return created; };
  const saveEvent = async (payload: Record<string, unknown>) => { const current = await ensureEvent(payload); const next = await api.updateEvent(current.id, payload); setEvent(next); return next; };
  let page: ReactNode;
  if (loading) page = <main className="page"><div className="loading-state">AI pracuje... ÅadujÄ™ bazÄ™ wiedzy.</div></main>;
  else if (view === 'start') page = <StartPage onNavigate={setView} pilot={reference.default_pilot} onStart={async (payload) => { await ensureEvent(payload); setView('creator'); }} />;
  else if (view === 'creator') page = <CreatorPage onNavigate={setView} areas={reference.areas} event={event} ensureEvent={ensureEvent} saveEvent={saveEvent} onGuide={async () => { const current = await ensureEvent(); await api.recommend(current.id); await api.recommendations(current.id); await api.generateEguide(current.id); setEguide(await api.eguide(current.id)); setView('guide'); }} />;
  else if (view === 'rules') page = <RulesPage rules={reference.six_r} />;
  else if (view === 'criteria') page = <CriteriaPage criteria={reference.criteria} />;
  else if (view === 'guide') page = <GuidePage checklist={reference.organizer_checklist} roles={reference.team_roles} eguide={eguide} eventId={event?.id} onGenerate={async () => { if (event) { await api.generateEguide(event.id); setEguide(await api.eguide(event.id)); } }} />;
  else page = <ImpactPage eguide={eguide} />;
  return <PageShell view={view} onNavigate={setView}>{error && <div className="api-error" role="alert">{error}</div>}{page}</PageShell>;
}
export default App;
