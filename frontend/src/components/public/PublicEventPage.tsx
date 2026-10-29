import { BarChart3, CheckCircle2, ClipboardList, Info, Users } from 'lucide-react';
import type { ImpactSummary, Milestone } from '../../types';
import { ImpactPage } from '../impact/ImpactPage';
import '../../styles/needs.css';

const MILESTONES: { id: Milestone | 'inne'; title: string }[] = [
  { id: 'T-60', title: 'Na 60 dni przed wydarzeniem' },
  { id: 'T-30', title: 'Na 30 dni przed wydarzeniem' },
  { id: 'T-7', title: 'Na tydzień przed wydarzeniem' },
  { id: 'T-0', title: 'W dniu wydarzenia' },
  { id: 'T+7', title: 'Tydzień po wydarzeniu' },
  { id: 'inne', title: 'Bez wyznaczonego terminu' },
];

type PublicEventPageProps = { payload: any };

const value = (source: any, ...keys: string[]) => keys.reduce((current, key) => current ?? source?.[key], undefined);

function readGuide(payload: any): any {
  return value(payload, 'eguide', 'guide') || payload?.event?.eguide || {};
}

function readEvent(payload: any): any {
  return payload?.event || payload;
}

function readImpact(payload: any, guide: any): ImpactSummary | null {
  return value(payload, 'impact', 'impactSummary') || guide?.impact_summary || guide?.impactSummary || null;
}

function decisionsFor(event: any, guide: any, payload: any) {
  const explicit = value(payload, 'decisions', 'ustalenia') || guide?.decisions || guide?.ustalenia;
  if (Array.isArray(explicit)) return explicit;
  const selected = event?.selected_options || event?.selectedOptions || {};
  return Object.entries(selected).map(([area, level]) => ({ area, level }));
}

export function PublicEventPage({ payload }: PublicEventPageProps) {
  const event = readEvent(payload);
  const guide = readGuide(payload);
  const organizer = guide?.organizer_checklist || guide?.organizerChecklist || payload?.organizer_checklist || [];
  const teams = guide?.team_checklists || guide?.teamChecklists || payload?.team_checklists || [];
  const decisions = decisionsFor(event, guide, payload);
  const impact = readImpact(payload, guide);
  const title = event?.title || payload?.title || 'Wydarzenie';
  const eventType = event?.event_type || event?.eventType;
  const date = event?.event_date || event?.eventDate;
  const location = event?.location;

  const groups = MILESTONES.map((milestone) => ({
    ...milestone,
    items: organizer.filter((item: any) => (item.milestone || 'inne') === milestone.id),
  })).filter((group) => group.items.length > 0);

  return <main className="page guide-page public-event-page">
    <div className="page-heading">
      <div>
        <div className="eyebrow">Nagłówek wydarzenia</div>
        <h1>{title}</h1>
        <p>{[eventType, date, location].filter(Boolean).join(' · ') || 'Ustalenia i checklisty wydarzenia'}</p>
      </div>
    </div>

    <section className="guide-decisions" aria-labelledby="public-decisions-title">
      <div className="section-title"><Info size={21} /><div><h2 id="public-decisions-title">Ustalenia</h2><p>Poziomy i decyzje przyjęte dla tego wydarzenia.</p></div></div>
      {decisions.length > 0 ? <div className="decisions-grid">{decisions.map((decision: any, index: number) => <article className="decision-card" key={`${decision.area || decision.name || 'ustalenie'}-${index}`}><div className="eyebrow">Obszar</div><h3>{decision.area || decision.name || 'Ustalenie'}</h3><dl><div><dt>Wybrany poziom</dt><dd>{decision.level ?? decision.selectedLevel ?? '—'}</dd></div>{(decision.justification || decision.why) && <div><dt>Uzasadnienie</dt><dd>{decision.justification || decision.why}</dd></div>}</dl></article>)}</div> : <p className="empty-copy">Nie zapisano jeszcze szczegółowych ustaleń.</p>}
    </section>

    <section className="checklist-section" aria-labelledby="public-organizer-title">
      <div className="section-title"><ClipboardList size={21} /><div><h2 id="public-organizer-title">Checklista organizatora</h2><p>Stałe wskaźniki pokazują stan zadań w chwili udostępnienia.</p></div></div>
      {groups.length > 0 ? groups.map((group) => <div className="milestone-group" key={group.id}><div className="milestone-heading"><div className="eyebrow">{group.title}</div></div><div className="checklist-grid">{group.items.map((item: any) => { const done = Boolean(item.is_done ?? item.isDone); return <div className={done ? 'check-row done public-check-row' : 'check-row public-check-row'} key={item.id || item.label}><span className="public-check-indicator" aria-hidden="true"><CheckCircle2 size={18} /></span><span><small>{item.area}</small>{item.label}</span></div>; })}</div></div>) : <p className="empty-copy">Checklista nie jest jeszcze dostępna.</p>}
    </section>

    <section className="team-section" aria-labelledby="public-team-title">
      <div className="section-title"><Users size={21} /><div><h2 id="public-team-title">Checklisty zespołu</h2><p>Role i zadania zespołu bez danych kontaktowych.</p></div></div>
      {teams.length > 0 ? <div className="team-grid">{teams.map((team: any) => <article className="team-card" key={team.role}><div className="eyebrow">{team.role}</div><ul>{(team.tasks || []).map((task: string) => <li key={task}><span className="public-check-indicator" aria-hidden="true"><CheckCircle2 size={16} /></span><span>{task}</span></li>)}</ul></article>)}</div> : <p className="empty-copy">Checklisty zespołu nie są jeszcze dostępne.</p>}
    </section>

    {impact ? <section aria-labelledby="public-impact-title"><div className="section-title public-impact-heading"><BarChart3 size={21} /><div><h2 id="public-impact-title">Podsumowanie wpływu</h2><p>Deterministyczny szacunek obliczony dla zapisanych wyborów.</p></div></div><ImpactPage eguide={guide} impact={impact} ecoSummary={null} embedded /></section> : <section className="panel impact-empty"><div className="section-title"><BarChart3 size={21} /><div><h2>Podsumowanie wpływu</h2><p>Szacunek wpływu nie jest jeszcze dostępny dla tego wydarzenia.</p></div></div></section>}
  </main>;
}

export function PublicEventEmptyState() {
  return <main className="page public-empty-page"><section className="panel impact-empty"><div className="eyebrow">Publiczny poradnik wydarzenia</div><h1>Nie znaleziono wydarzenia</h1><p>Link może być nieaktualny albo wydarzenie nie zostało jeszcze udostępnione.</p></section></main>;
}
