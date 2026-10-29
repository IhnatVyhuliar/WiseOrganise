import { useState } from 'react';
import type { ReactNode } from 'react';
import { Leaf, Menu, X } from 'lucide-react';
export type View = 'start'|'creator'|'rules'|'criteria'|'guide'|'impact'|'public';
const nav: {id: View; label: string}[] = [
 {id:'start',label:'Start'}, {id:'creator',label:'Kreator'}, {id:'rules',label:'Zasady 6R'}, {id:'criteria',label:'Kryteria dostawców'}, {id:'guide',label:'Poradnik i checklisty'}, {id:'impact',label:'Wpływ przed i po'}
];
export function Header({view,onNavigate,publicMode=false}:{view:View;onNavigate:(v:View)=>void;publicMode?:boolean}) {
 const [open,setOpen]=useState(false);
 return <header className="site-header"><div className="header-inner">{publicMode?<span className="brand" aria-label="WiseOrganise"><span className="brand-mark"><Leaf size={18}/></span><span>WiseOrganise</span></span>:<button className="brand" onClick={()=>onNavigate('start')} aria-label="WiseOrganise — Start"><span className="brand-mark"><Leaf size={18}/></span><span>WiseOrganise</span></button>}{!publicMode && <><button className="menu-toggle" onClick={()=>setOpen(!open)} aria-label="Otwórz menu">{open?<X/>:<Menu/>}</button><nav className={open?'main-nav open':'main-nav'} aria-label="Główna nawigacja">{nav.map(item=><button key={item.id} className={view===item.id?'nav-link active':'nav-link'} onClick={()=>{onNavigate(item.id);setOpen(false)}}>{item.label}</button>)}</nav></>}</div></header>
}
/**
 * `chrome='minimal'` drops the organizer navigation: a visitor arriving on a share
 * link has no event in state, and every nav target would create one for them.
 */
export function PageShell({view,onNavigate,chrome='full',children}:{view:View;onNavigate:(v:View)=>void;chrome?:'full'|'minimal';children:ReactNode}) { return <div className="app-shell"><Header view={view} onNavigate={onNavigate} publicMode={chrome==='minimal'}/>{children}<footer className="footer">WiseOrganise · decyzje oparte na zasadach, nie na rankingach firm</footer></div> }
/**
 * Creator progress. Steps beyond the furthest one reached stay unreachable.
 * `action` is the step's own forward move, sitting at the right end of the rail so
 * the row reads as where you are and what happens next. The steps keep their own
 * track because at phone width it scrolls sideways while the action wraps below it.
 */
export function Stepper({current,onChange,maxStep,action}:{current:number;onChange:(step:number)=>void;maxStep?:number;action?:ReactNode}) { const labels=['Podstawy','Potrzeby','Opcje','Poradnik']; const reached=maxStep??current; return <div className="stepper" aria-label="Postęp kreatora"><div className="stepper-steps">{labels.map((label,i)=><button key={label} className={current===i?'step active':current>i?'step done':'step'} disabled={i>reached} aria-disabled={i>reached} onClick={()=>{if(i<=reached)onChange(i)}}><span>{i+1}</span><strong>{label}</strong></button>)}</div>{action&&<div className="stepper-action">{action}</div>}</div> }
