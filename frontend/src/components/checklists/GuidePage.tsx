import { CheckSquare, Clipboard, Copy, Users, Sparkles, BarChart3, Info } from 'lucide-react';
import { useState } from 'react';
import type { ChecklistItem, Milestone, TeamRole } from '../../types';
import type { ChecklistDonePayload, EGuideAiStatus } from '../../lib/api';
import type { View } from '../layout/Layout';
import '../../styles/needs.css';

const MILESTONES: { id: Milestone; title: string; hint: string }[] = [
  { id: 'T-60', title: 'Na 60 dni przed wydarzeniem', hint: 'Decyzje, które trudno cofnąć później.' },
  { id: 'T-30', title: 'Na 30 dni przed wydarzeniem', hint: 'Zamówienia i ustalenia z dostawcami.' },
  { id: 'T-7', title: 'Na tydzień przed wydarzeniem', hint: 'Ostatnie potwierdzenia i materiały.' },
  { id: 'T-0', title: 'W dniu wydarzenia', hint: 'To, co dzieje się na miejscu.' },
  { id: 'T+7', title: 'Tydzień po wydarzeniu', hint: 'Pomiar, wnioski i następna edycja.' },
];
const OTHER_MILESTONE = { id: 'inne', title: 'Bez wyznaczonego terminu', hint: 'Zadania, które warto zaplanować samodzielnie.' };

export interface GuideDecision { area: string; level: number; justification: string; cost: string; }
interface GuidePageProps {
  checklist: ChecklistItem[]; roles: TeamRole[]; eguide: any; decisions: GuideDecision[]; shareUrl: string;
  onNavigate: (view: View) => void; onToggleDone: (payload: ChecklistDonePayload) => Promise<void>;
  onGenerate: () => Promise<void>; busy?: boolean;
}
const statusLabel: Record<EGuideAiStatus, string> = {
  disabled: 'AI jest wyłączone.', in_progress: 'AI dopracowuje poradnik. Odświeżam jego stan…',
  ready: 'Poradnik został dopracowany przez AI.', failed: 'Wersja bazowa poradnika jest gotowa, ale nie udało się złożyć wersji dopracowanej przez AI.',
};

export function GuidePage({ checklist, roles, eguide, decisions, shareUrl, onNavigate, onToggleDone, onGenerate, busy }: GuidePageProps) {
  const [copied, setCopied] = useState(false);
  const generated: any[] = eguide?.organizerChecklist || eguide?.organizer_checklist || checklist;
  const teams: any[] = eguide?.teamChecklists || eguide?.team_checklists || roles;
  const isDone = (item: any) => Boolean(item.isDone ?? item.is_done);
  const completedOf = (team: any): string[] => team.completedTasks || team.completed_tasks || [];
  const done = generated.filter(isDone).length;
  const groups = [...MILESTONES.map((milestone) => ({ ...milestone, items: generated.filter((item) => item.milestone === milestone.id) })), { ...OTHER_MILESTONE, items: generated.filter((item) => !MILESTONES.some((milestone) => milestone.id === item.milestone)) }].filter((group) => group.items.length > 0);
  const aiStatus: EGuideAiStatus = eguide?.aiStatus || 'disabled';
  const aiEnabled = Boolean(eguide?.aiEnabled) && aiStatus !== 'disabled';
  return <main className="page guide-page">
    <div className="page-heading"><div><div className="eyebrow">Poradnik organizatora</div><h1>Plan, który prowadzi za rękę</h1><p>Zasady i opcje przygotowuje zespół. AI może ułożyć poradnik z bazy wiedzy, ale nie dopisuje faktów.</p></div>{aiEnabled && <button className="button secondary" onClick={onGenerate} disabled={busy}><Sparkles size={17} /> {busy ? 'Dopracowuję poradnik…' : 'Dopracuj poradnik z AI'}</button>}</div>
    {aiStatus !== 'disabled' && <div className={`notice guide-ai-status ${aiStatus}`}><Info size={18} /><p>{statusLabel[aiStatus]}</p></div>}
    <section className="guide-share" aria-labelledby="share-title"><div className="section-title"><Clipboard size={21} /><div><h2 id="share-title">Udostępnij poradnik</h2><p>Skopiuj link i prześlij go osobom, które pracują przy wydarzeniu.</p></div></div><div className="share-link-row"><a href={shareUrl} className="share-link" aria-label="Link do poradnika">{shareUrl}</a><button className="button secondary" type="button" onClick={() => { void navigator.clipboard?.writeText(shareUrl).then(() => setCopied(true)).catch(() => setCopied(false)); }}><Copy size={17} /> Kopiuj link</button></div><small className="share-confirmation" aria-live="polite">{copied ? 'Link skopiowany.' : 'Link jest gotowy do skopiowania.'}</small></section>
    {decisions.length > 0 && <section className="guide-decisions" aria-labelledby="decisions-title"><div className="section-title"><Info size={21} /><div><h2 id="decisions-title">Ustalenia</h2><p>Wybrane poziomy i ich uzasadnienie dla każdego zaznaczonego obszaru.</p></div></div><div className="decisions-grid">{decisions.map((decision) => <article className="decision-card" key={decision.area}><div className="eyebrow">Obszar</div><h3>{decision.area}</h3><dl><div><dt>Wybrany poziom</dt><dd>{decision.level}</dd></div><div><dt>Uzasadnienie</dt><dd>{decision.justification}</dd></div><div><dt>Wpływ na koszt</dt><dd>{decision.cost}</dd></div></dl></article>)}</div></section>}
    <section className="guide-progress"><CheckSquare size={20} /><span><strong>{done} z {generated.length}</strong> zadań organizatora ukończonych</span><div className="progress-track"><div style={{ width: `${generated.length ? (done / generated.length) * 100 : 0}%` }} /></div></section>
    <section className="checklist-section"><div className="section-title"><CheckSquare size={21} /><div><h2>Checklista głównego organizatora</h2><p>Zadania ułożone w czasie: od przygotowań, przez dzień wydarzenia, po powrót uczestników.</p></div></div>{groups.map((group) => <div className="milestone-group" key={group.id}><div className="milestone-heading"><div className="eyebrow">{group.title}</div><small>{group.hint}</small></div><div className="checklist-grid">{group.items.map((item: any) => <label className={isDone(item) ? 'check-row done' : 'check-row'} key={item.id}><input type="checkbox" checked={isDone(item)} onChange={() => { void onToggleDone({ itemId: item.id, isDone: !isDone(item) }); }} /><span><small>{item.area}</small>{item.label}</span></label>)}</div></div>)}</section>
    <section className="team-section"><div className="section-title"><Users size={21} /><div><h2>Checklisty dla osób w zespole</h2><p>Przydziel role i pracujcie na wspólnej liście zadań.</p></div></div><div className="team-grid">{teams.map((team: any) => { const completed = completedOf(team); return <article className="team-card" key={team.role}><div className="eyebrow">{team.role}</div><ul>{team.tasks.map((task: string) => <li key={task}><input type="checkbox" checked={completed.includes(task)} onChange={() => { void onToggleDone({ itemId: task, isDone: !completed.includes(task), role: team.role, task }); }} /> <span>{task}</span></li>)}</ul></article>; })}</div></section>
    <div className="guide-actions"><button className="button secondary" onClick={() => onNavigate('criteria')}>Kryteria dostawców</button><button className="button primary" onClick={() => onNavigate('impact')}><BarChart3 size={17} /> Zobacz wpływ przed i po</button></div>
  </main>;
}
