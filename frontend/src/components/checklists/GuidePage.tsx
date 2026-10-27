import { CheckSquare, Users, Sparkles, BarChart3 } from 'lucide-react';
import type { ChecklistItem, Milestone, TeamRole } from '../../types';
import type { ChecklistDonePayload } from '../../lib/api';
import type { View } from '../layout/Layout';
import '../../styles/needs.css';
/** Polish names for the lifecycle milestones the checklist is grouped by. */
const MILESTONES:{id:Milestone;title:string;hint:string}[]=[
 {id:'T-60',title:'Na 60 dni przed wydarzeniem',hint:'Decyzje, które trudno cofnąć później.'},
 {id:'T-30',title:'Na 30 dni przed wydarzeniem',hint:'Zamówienia i ustalenia z dostawcami.'},
 {id:'T-7',title:'Na tydzień przed wydarzeniem',hint:'Ostatnie potwierdzenia i materiały.'},
 {id:'T-0',title:'W dniu wydarzenia',hint:'To, co dzieje się na miejscu.'},
 {id:'T+7',title:'Tydzień po wydarzeniu',hint:'Pomiar, wnioski i następna edycja.'},
];
const OTHER_MILESTONE={id:'inne',title:'Bez wyznaczonego terminu',hint:'Zadania, które warto zaplanować samodzielnie.'};
export function GuidePage({checklist,roles,eguide,onNavigate,onToggleDone,onGenerate}:{checklist:ChecklistItem[];roles:TeamRole[];eguide:any;eventId?:string;onNavigate:(v:View)=>void;onToggleDone:(payload:ChecklistDonePayload)=>Promise<void>;onGenerate:()=>Promise<void>}){
 const generated:any[]=eguide?.organizerChecklist||eguide?.organizer_checklist||checklist;
 const teams:any[]=eguide?.teamChecklists||eguide?.team_checklists||roles;
 const isDone=(item:any)=>!!(item.isDone??item.is_done);
 const completedOf=(team:any):string[]=>team.completedTasks||team.completed_tasks||[];
 const done=generated.filter(isDone).length;
 const groups=[...MILESTONES.map(m=>({...m,items:generated.filter(item=>item.milestone===m.id)})),{...OTHER_MILESTONE,items:generated.filter(item=>!MILESTONES.some(m=>m.id===item.milestone))}].filter(group=>group.items.length>0);
 return <main className="page guide-page"><div className="page-heading"><div><div className="eyebrow">Poradnik organizatora</div><h1>Plan, który prowadzi za rękę</h1><p>Zasady i opcje przygotowuje zespół. AI może ułożyć poradnik z bazy wiedzy, ale nie dopisuje faktów.</p></div><button className="button primary" onClick={onGenerate}><Sparkles size={17}/> Wygeneruj poradnik</button></div><section className="guide-progress"><CheckSquare size={20}/><span><strong>{done} z {generated.length}</strong> zadań organizatora ukończonych</span><div className="progress-track"><div style={{width:`${generated.length?(done/generated.length)*100:0}%`}}/></div></section><section className="checklist-section"><div className="section-title"><CheckSquare size={21}/><div><h2>Checklista głównego organizatora</h2><p>Zadania ułożone w czasie: od przygotowań, przez dzień wydarzenia, po powrót uczestników.</p></div></div>{groups.map(group=><div className="milestone-group" key={group.id}><div className="milestone-heading"><div className="eyebrow">{group.title}</div><small>{group.hint}</small></div><div className="checklist-grid">{group.items.map((item:any)=><label className={isDone(item)?'check-row done':'check-row'} key={item.id}><input type="checkbox" checked={isDone(item)} onChange={()=>onToggleDone({itemId:item.id,isDone:!isDone(item)})}/><span><small>{item.area}</small>{item.label}</span></label>)}</div></div>)}</section><section className="team-section"><div className="section-title"><Users size={21}/><div><h2>Checklisty dla osób w zespole</h2><p>Przydziel role i uzupełnij kontakt przed wysłaniem poradnika.</p></div></div><div className="team-grid">{teams.map((team:any)=>{const completed=completedOf(team);return <article className="team-card" key={team.role}><div className="eyebrow">{team.role}</div><h3>{team.contact}</h3><ul>{team.tasks.map((task:string)=><li key={task}><input type="checkbox" checked={completed.includes(task)} onChange={()=>onToggleDone({itemId:task,isDone:!completed.includes(task),role:team.role,task})}/> <span>{task}</span></li>)}</ul></article>;})}</div></section><div className="guide-actions"><button className="button secondary" onClick={()=>onNavigate('criteria')}>Kryteria dostawców</button><button className="button primary" onClick={()=>onNavigate('impact')}><BarChart3 size={17}/> Zobacz wpływ przed i po</button></div></main> }
