import { useState } from 'react';
import type { ReactNode } from 'react';
import { Leaf, Menu, X } from 'lucide-react';
export type View = 'start'|'creator'|'rules'|'criteria'|'guide'|'impact';
const nav: {id: View; label: string}[] = [
 {id:'start',label:'Start'}, {id:'creator',label:'Kreator'}, {id:'rules',label:'Zasady 6R'}, {id:'criteria',label:'Kryteria dostawców'}, {id:'guide',label:'Poradnik i checklisty'}, {id:'impact',label:'Wpływ przed i po'}
];
export function Header({view,onNavigate,publicMode=false}:{view:View;onNavigate:(v:View)=>void;publicMode?:boolean}) {
 const [open,setOpen]=useState(false);
 return <header className="site-header"><div className="header-inner"><button className="brand" onClick={()=>onNavigate('start')} aria-label="WiseOrganise — Start"><span className="brand-mark"><Leaf size={18}/></span><span>WiseOrganise</span></button>{!publicMode && <><button className="menu-toggle" onClick={()=>setOpen(!open)} aria-label="Otwórz menu">{open?<X/>:<Menu/>}</button><nav className={open?'main-nav open':'main-nav'} aria-label="Główna nawigacja">{nav.map(item=><button key={item.id} className={view===item.id?'nav-link active':'nav-link'} onClick={()=>{onNavigate(item.id);setOpen(false)}}>{item.label}</button>)}</nav></>}</div></header>
}
export function PageShell({view,onNavigate,children,publicMode=false}:{view:View;onNavigate:(v:View)=>void;children:ReactNode;publicMode?:boolean}) { return <div className="app-shell"><Header view={view} onNavigate={onNavigate} publicMode={publicMode}/>{children}<footer className="footer">WiseOrganise · decyzje oparte na zasadach, nie na rankingach firm</footer></div> }
/** Creator progress. Steps beyond the furthest one reached stay unreachable. */
export function Stepper({current,onChange,maxStep}:{current:number;onChange:(step:number)=>void;maxStep?:number}) { const labels=['Podstawy','Potrzeby','Opcje','Poradnik']; const reached=maxStep??current; return <div className="stepper" aria-label="Postęp kreatora">{labels.map((label,i)=><button key={label} className={current===i?'step active':current>i?'step done':'step'} disabled={i>reached} aria-disabled={i>reached} onClick={()=>{if(i<=reached)onChange(i)}}><span>{i+1}</span><strong>{label}</strong></button>)}</div> }
