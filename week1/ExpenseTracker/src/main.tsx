import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowDownLeft, ArrowUpRight, BarChart3, ChevronDown, CircleDollarSign, LayoutDashboard, Plus, Settings, Tags, Wallet, X } from 'lucide-react';
import './styles.css';

type Category = { id: string; name: string; color: string };
type Transaction = { id: string; title: string; categoryId: string; amount: number; date: string };
type Budget = { categoryId: string; limit: number };

const categories: Category[] = [
  { id:'food', name:'Élelmiszer', color:'#f59e0b' }, { id:'housing', name:'Lakhatás', color:'#6366f1' },
  { id:'transport', name:'Közlekedés', color:'#0ea5e9' }, { id:'leisure', name:'Szórakozás', color:'#ec4899' },
  { id:'health', name:'Egészség', color:'#10b981' }, { id:'other', name:'Egyéb', color:'#64748b' }
];
const initialTransactions: Transaction[] = [
  {id:'1',title:'Bevásárlás',categoryId:'food',amount:18450,date:'2026-09-15'},
  {id:'2',title:'Havi albérlet',categoryId:'housing',amount:185000,date:'2026-09-14'},
  {id:'3',title:'Bérlet',categoryId:'transport',amount:9500,date:'2026-09-13'},
  {id:'4',title:'Mozi',categoryId:'leisure',amount:5200,date:'2026-09-12'},
  {id:'5',title:'Gyógyszertár',categoryId:'health',amount:6900,date:'2026-09-10'}
];
const initialBudgets: Budget[] = [{categoryId:'food',limit:70000},{categoryId:'transport',limit:30000},{categoryId:'leisure',limit:25000},{categoryId:'health',limit:20000}];
const money = new Intl.NumberFormat('hu-HU',{style:'currency',currency:'HUF',maximumFractionDigits:0});
const key = 'fintrack-prototype-v1';

function App(){
  const [txs,setTxs]=useState<Transaction[]>(()=>{try{return JSON.parse(localStorage.getItem(key)||'').transactions||initialTransactions}catch{return initialTransactions}});
  const [cats,setCats]=useState<Category[]>(()=>{try{return JSON.parse(localStorage.getItem(key)||'').categories||categories}catch{return categories}});
  const [budgets,setBudgets]=useState<Budget[]>(()=>{try{return JSON.parse(localStorage.getItem(key)||'').budgets||initialBudgets}catch{return initialBudgets}});
  const [modal,setModal]=useState<'transaction'|'category'|null>(null);
  const [active,setActive]=useState('dashboard');
  const [filter,setFilter]=useState('all');
  useEffect(()=>localStorage.setItem(key,JSON.stringify({transactions:txs,categories:cats,budgets})),[txs,cats,budgets]);
  const spent=txs.reduce((s,t)=>s+t.amount,0); const budgetTotal=budgets.reduce((s,b)=>s+b.limit,0);
  const filtered=filter==='all'?txs:txs.filter(t=>t.categoryId===filter);
  const categorySpend=useMemo(()=>cats.map(c=>({...c,total:txs.filter(t=>t.categoryId===c.id).reduce((s,t)=>s+t.amount,0)})).filter(c=>c.total>0).sort((a,b)=>b.total-a.total),[cats,txs]);
  const addTx=(title:string,categoryId:string,amount:number,date:string)=>{setTxs(v=>[{id:crypto.randomUUID(),title,categoryId,amount,date},...v]);setModal(null)};
  const addCat=(name:string,color:string)=>{setCats(v=>[...v,{id:crypto.randomUUID(),name,color}]);setModal(null)};
  return <div className="app">
    <aside className="sidebar"><div className="brand"><div className="logo"><CircleDollarSign size={23}/></div><span>FinTrack</span></div>
      <nav><Nav active={active==='dashboard'} icon={<LayoutDashboard/>} text="Áttekintés" onClick={()=>setActive('dashboard')}/><Nav active={active==='transactions'} icon={<ArrowUpRight/>} text="Tranzakciók" onClick={()=>setActive('transactions')}/><Nav active={active==='categories'} icon={<Tags/>} text="Kategóriák" onClick={()=>setActive('categories')}/><Nav active={active==='budgets'} icon={<BarChart3/>} text="Keretek" onClick={()=>setActive('budgets')}/></nav>
      <div className="side-bottom"><Nav active={false} icon={<Settings/>} text="Beállítások" onClick={()=>{}}/><div className="profile"><div className="avatar">VK</div><div><b>Valkenzzo</b><span>Prototípus</span></div><ChevronDown size={16}/></div></div>
    </aside>
    <main><header><div><p className="eyebrow">PÉNZÜGYI ÁTTEKINTÉS</p><h1>{active==='dashboard'?'Jó napot!':active==='transactions'?'Tranzakciók':active==='categories'?'Kategóriák':'Költségkeretek'}</h1></div><button className="primary" onClick={()=>setModal('transaction')}><Plus size={18}/> Új kiadás</button></header>
      {active==='dashboard' && <><section className="stats"><Stat label="Teljes kiadás" value={money.format(spent)} hint="ebben a hónapban"/><Stat label="Költségkeretek" value={money.format(budgetTotal)} hint="beállított havi keret"/><Stat label="Tranzakciók" value={String(txs.length)} hint="összes rögzített tétel"/><Stat label="Legnagyobb kategória" value={categorySpend[0]?.name||'—'} hint={categorySpend[0]?money.format(categorySpend[0].total):''}/></section>
      <div className="grid"><section className="card large"><div className="card-head"><div><h2>Költések kategóriánként</h2><p>Az aktuális hónap összes kiadása</p></div></div><div className="bars">{categorySpend.map(c=><div className="bar-row" key={c.id}><div className="bar-label"><span className="dot" style={{background:c.color}}></span>{c.name}<b>{money.format(c.total)}</b></div><div className="bar-bg"><div className="bar" style={{width:`${Math.min(100,c.total/(categorySpend[0]?.total||1)*100)}%`,background:c.color}}/></div></div>)}</div></section>
      <section className="card"><div className="card-head"><div><h2>Költségkeretek</h2><p>Hol tartasz ebben a hónapban?</p></div></div>{budgets.map(b=>{const c=cats.find(x=>x.id===b.categoryId);const used=txs.filter(t=>t.categoryId===b.categoryId).reduce((s,t)=>s+t.amount,0);return <div className="budget" key={b.categoryId}><div><span>{c?.name}</span><b>{money.format(used)} / {money.format(b.limit)}</b></div><div className="bar-bg"><div className="bar" style={{width:`${Math.min(100,used/b.limit*100)}%`}}/></div></div>})}</section></div></>}
      {active==='transactions' && <section className="card full"><div className="toolbar"><div><h2>Tranzakciólista</h2><p>Új kiadásokat itt tudsz rögzíteni.</p></div><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Minden kategória</option>{cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><TransactionList txs={filtered} cats={cats}/></section>}
      {active==='categories' && <section className="card full"><div className="toolbar"><div><h2>Kategóriák</h2><p>A kiadások csoportosításához használt kategóriák.</p></div><button className="secondary" onClick={()=>setModal('category')}><Plus size={17}/> Új kategória</button></div><div className="category-grid">{cats.map(c=><div className="category-card" key={c.id}><span className="category-icon" style={{background:c.color}}><Tags size={18}/></span><div><b>{c.name}</b><span>{money.format(txs.filter(t=>t.categoryId===c.id).reduce((s,t)=>s+t.amount,0))} kiadás</span></div></div>)}</div></section>}
      {active==='budgets' && <section className="card full"><div className="toolbar"><div><h2>Havi költségkeretek</h2><p>Egyszerű kontroll a legfontosabb kiadási kategóriák felett.</p></div></div>{budgets.map(b=>{const c=cats.find(x=>x.id===b.categoryId);const used=txs.filter(t=>t.categoryId===b.categoryId).reduce((s,t)=>s+t.amount,0);return <div className="budget big" key={b.categoryId}><div className="budget-top"><div><span className="dot" style={{background:c?.color}}></span><b>{c?.name}</b></div><strong>{Math.round(used/b.limit*100)}%</strong></div><div className="bar-bg"><div className="bar" style={{width:`${Math.min(100,used/b.limit*100)}%`,background:c?.color}}/></div><div className="budget-meta"><span>Elköltve: {money.format(used)}</span><span>Keret: {money.format(b.limit)}</span></div></div>})}</section>}
    </main>
    {modal==='transaction'&&<TransactionModal cats={cats} onClose={()=>setModal(null)} onAdd={addTx}/>} {modal==='category'&&<CategoryModal onClose={()=>setModal(null)} onAdd={addCat}/>} 
  </div>
}
function Nav({active,icon,text,onClick}:{active:boolean;icon:React.ReactNode;text:string;onClick:()=>void}){return <button className={`nav ${active?'active':''}`} onClick={onClick}>{icon}<span>{text}</span></button>}
function Stat({label,value,hint}:{label:string;value:string;hint:string}){return <div className="stat"><span>{label}</span><strong>{value}</strong><small>{hint}</small></div>}
function TransactionList({txs,cats}:{txs:Transaction[];cats:Category[]}){return <div className="transactions">{txs.map(t=>{const c=cats.find(x=>x.id===t.categoryId);return <div className="tx" key={t.id}><div className="tx-icon" style={{background:c?.color}}><ArrowDownLeft size={17}/></div><div className="tx-main"><b>{t.title}</b><span>{c?.name} · {new Date(t.date).toLocaleDateString('hu-HU')}</span></div><strong>-{money.format(t.amount)}</strong></div>})}{!txs.length&&<div className="empty">Nincs ilyen kategóriájú tranzakció.</div>}</div>}
function TransactionModal({cats,onClose,onAdd}:{cats:Category[];onClose:()=>void;onAdd:(a:string,b:string,c:number,d:string)=>void}){const [title,setTitle]=useState('');const [cat,setCat]=useState(cats[0]?.id||'');const [amount,setAmount]=useState('');const [date,setDate]=useState(new Date().toISOString().slice(0,10));return <Modal title="Új kiadás" onClose={onClose}><label>Megnevezés<input autoFocus value={title} onChange={e=>setTitle(e.target.value)} placeholder="Pl. Bevásárlás"/></label><label>Kategória<select value={cat} onChange={e=>setCat(e.target.value)}>{cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Összeg (Ft)<input type="number" min="1" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0"/></label><label>Dátum<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><button className="primary wide" disabled={!title||!cat||Number(amount)<=0} onClick={()=>onAdd(title,cat,Number(amount),date)}>Kiadás mentése</button></Modal>}
function CategoryModal({onClose,onAdd}:{onClose:()=>void;onAdd:(a:string,b:string)=>void}){const [name,setName]=useState('');const [color,setColor]=useState('#2974A6');return <Modal title="Új kategória" onClose={onClose}><label>Kategória neve<input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="Pl. Hobbi"/></label><label>Szín<div className="color-row">{['#2974A6','#f59e0b','#10b981','#ec4899','#6366f1','#ef4444'].map(x=><button key={x} className={`color ${color===x?'selected':''}`} style={{background:x}} onClick={()=>setColor(x)}/>)}</div></label><button className="primary wide" disabled={!name} onClick={()=>onAdd(name,color)}>Kategória létrehozása</button></Modal>}
function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}){return <div className="overlay" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="modal"><div className="modal-head"><h2>{title}</h2><button onClick={onClose}><X/></button></div>{children}</div></div>}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
