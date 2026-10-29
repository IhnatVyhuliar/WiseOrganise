import { useRef, useState } from 'react';
import { CheckSquare, Users, Sparkles, BarChart3, Info, Link2, Check } from 'lucide-react';
import type { ChecklistItem, TeamRole } from '../../types';
import type { ChecklistDonePayload } from '../../lib/api';
import type { View } from '../layout/Layout';
import { groupByMilestone } from './milestones';
import '../../styles/needs.css';
/**
 * The share link with a copy button. A browser that refuses the clipboard (no permission,
 * no user activation, insecure origin) must still leave the organizer somewhere to go, so
 * the field is selected and labelled instead of the click doing nothing at all.
 */
function ShareLink({url}:{url:string}){
 const [state,setState]=useState<'idle'|'copied'|'manual'>('idle');
 const field=useRef<HTMLInputElement>(null);
 // An unfocused document can leave writeText pending forever, which would leave the
 // button inert; the race turns that into the same visible fallback as a refusal.
 const copy=async()=>{try{await Promise.race([navigator.clipboard.writeText(url),new Promise((_,reject)=>window.setTimeout(()=>reject(new Error('clipboard timeout')),1500))]);setState('copied');window.setTimeout(()=>setState('idle'),2500)}catch{setState('manual');field.current?.select()}};
 return <section className="share-link"><div className="section-title"><Link2 size={21}/><div><h2>Link do udostępnienia planu</h2><p>Każdy z tym adresem zobaczy ustalenia, checklisty i szacowany wpływ. Nie zobaczy opisu wydarzenia ani danych kontaktowych.</p></div></div><div className="share-row"><input ref={field} className="share-input" type="text" readOnly value={url} onFocus={(event)=>event.currentTarget.select()} aria-label="Adres do udostępnienia"/><button className="button secondary" type="button" onClick={copy}>{state==='copied'?<><Check size={17}/> Skopiowano</>:<>Kopiuj link</>}</button></div>{state==='manual'&&<p className="share-hint">Przeglądarka nie udostępniła schowka. Adres jest zaznaczony — skopiuj go skrótem Ctrl+C.</p>}</section>
}
export function GuidePage({checklist,roles,eguide,shareUrl,onNavigate,onToggleDone,onGenerate,busy,hasGuide}:{checklist:ChecklistItem[];roles:TeamRole[];eguide:any;eventId?:string;shareUrl?:string;onNavigate:(v:View)=>void;onToggleDone:(payload:ChecklistDonePayload)=>Promise<void>;onGenerate:()=>Promise<void>;busy?:boolean;hasGuide?:boolean}){
 const generated:any[]=eguide?.organizerChecklist||eguide?.organizer_checklist||checklist;
 const teams:any[]=eguide?.teamChecklists||eguide?.team_checklists||roles;
 const isDone=(item:any)=>!!(item.isDone??item.is_done);
 const completedOf=(team:any):string[]=>team.completedTasks||team.completed_tasks||[];
 const done=generated.filter(isDone).length;
 const groups=groupByMilestone(generated);
 return <main className="page guide-page"><div className="page-heading"><div><div className="eyebrow">Poradnik organizatora</div><h1>Plan, który prowadzi za rękę</h1><p>Zasady i opcje przygotowuje zespół. AI może ułożyć poradnik z bazy wiedzy, ale nie dopisuje faktów.</p></div><button className="button primary" onClick={onGenerate} disabled={busy}><Sparkles size={17}/> {busy?'Generuję poradnik…':'Wygeneruj poradnik'}</button></div>{busy&&<div className="notice"><Info size={18}/><p>Składam poradnik z bazy wiedzy. Przy włączonym AI to zwykle trwa kilkanaście sekund.</p></div>}{!busy&&!hasGuide&&<div className="notice"><Info size={18}/><p>To jeszcze ogólna baza zadań. Kliknij „Wygeneruj poradnik”, żeby dopasować ją do obszarów i poziomów wybranych w kreatorze.</p></div>}<section className="guide-progress"><CheckSquare size={20}/><span><strong>{done} z {generated.length}</strong> zadań organizatora ukończonych</span><div className="progress-track"><div style={{width:`${generated.length?(done/generated.length)*100:0}%`}}/></div></section><section className="checklist-section"><div className="section-title"><CheckSquare size={21}/><div><h2>Checklista głównego organizatora</h2><p>Zadania ułożone w czasie: od przygotowań, przez dzień wydarzenia, po powrót uczestników.</p></div></div>{groups.map(group=><div className="milestone-group" key={group.id}><div className="milestone-heading"><div className="eyebrow">{group.title}</div><small>{group.hint}</small></div><div className="checklist-grid">{group.items.map((item:any)=><label className={isDone(item)?'check-row done':'check-row'} key={item.id}><input type="checkbox" checked={isDone(item)} onChange={()=>onToggleDone({itemId:item.id,isDone:!isDone(item)})}/><span><small>{item.area}</small>{item.label}</span></label>)}</div></div>)}</section><section className="team-section"><div className="section-title"><Users size={21}/><div><h2>Checklisty dla osób w zespole</h2><p>Przydziel role i uzupełnij kontakt przed wysłaniem poradnika.</p></div></div><div className="team-grid">{teams.map((team:any)=>{const completed=completedOf(team);return <article className="team-card" key={team.role}><div className="eyebrow">{team.role}</div><h3>{team.contact}</h3><ul>{team.tasks.map((task:string)=><li key={task}><input type="checkbox" checked={completed.includes(task)} onChange={()=>onToggleDone({itemId:task,isDone:!completed.includes(task),role:team.role,task})}/> <span>{task}</span></li>)}</ul></article>;})}</div></section>{shareUrl&&<ShareLink url={shareUrl}/>}<div className="guide-actions"><button className="button secondary" onClick={()=>onNavigate('criteria')}>Kryteria dostawców</button><button className="button primary" onClick={()=>onNavigate('impact')}><BarChart3 size={17}/> Zobacz wpływ przed i po</button></div></main> }
