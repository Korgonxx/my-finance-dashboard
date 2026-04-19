"use client";
import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import {
  Plus, Edit2, Trash2, X, Target, Download, Zap,
  Send, TrendingUp, TrendingDown, Eye, EyeOff,
  ArrowUpRight, ArrowDownRight, DollarSign, Wallet, CreditCard, Activity, Calendar
} from "lucide-react";
import { useWeb3 } from "./context/Web3Context";
import { useEntries, useGoal } from "@/lib/hooks/useEntries";
import { useAppSettings, type Currency } from "./context/AppSettingsContext";
import { MasterPasscodeGuard } from "./components/MasterPasscodeGuard";
import { Sidebar, THEME, type ThemeType } from "./components/Sidebar";
import { CloudSyncModal } from "./components/CloudSyncModal";
import { PageTransition } from "./components/PageTransition";

type Entry = {
  id:string;date:string;project:string;
  earned:number;saved:number;given:number;givenTo:string;
  walletAddress?:string;walletName?:string;
  mode:"web2"|"web3";
  investmentAmount?:number;currentValue?:number;
};

function uid(){return Math.random().toString(36).slice(2,10);}
function pct(a:number,b:number){return b>0?((a/b)*100).toFixed(1):"0.0";}
function shortAddr(a:string){return a?`${a.slice(0,6)}…${a.slice(-4)}`:"" ;}
const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function buildMonthly(entries:Entry[]){
  return MONTHS.map(month=>{
    const me=entries.filter(e=>MONTHS[new Date(e.date).getMonth()]===month);
    return{month,earned:me.reduce((s,e)=>s+e.earned,0),saved:me.reduce((s,e)=>s+e.saved,0),given:me.reduce((s,e)=>s+e.given,0)};
  });
}

// ── Entry Modal ───────────────────────────────────────────────────────────────
function EntryModal({onSave,onClose,initial,isWeb3,T}:{
  onSave:(e:Entry)=>void;onClose:()=>void;
  initial?:Partial<Entry>;
  isWeb3:boolean;T:ThemeType;
}){
  const[form,setForm]=useState({
    date:initial?.date??new Date().toISOString().slice(0,10),
    project:initial?.project??"",
    earned:initial?.earned !== undefined ? String(initial.earned) : "",
    saved:initial?.saved !== undefined ? String(initial.saved) : "",
    given:initial?.given !== undefined ? String(initial.given) : "",
    givenTo:initial?.givenTo??"",
    walletAddress:initial?.walletAddress??"",walletName:initial?.walletName??"",
  });
  const inp:React.CSSProperties={width:"100%",padding:"12px 16px",
    background:T.pill,border:`1px solid ${T.border}`,
    borderRadius:14,color:T.textPri,fontSize:14,fontFamily:"inherit",
    outline:"none",boxSizing:"border-box",transition:"all 0.2s"};
  const lbl:React.CSSProperties={fontSize:11,color:T.textSec,fontWeight:700,
    letterSpacing:"0.02em",marginBottom:6,display:"block",marginLeft:4};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,
      backdropFilter:"blur(12px)",padding:"1rem",animation:"fadeIn 0.2s"}}>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes popIn{from{opacity:0;transform:scale(0.96) translateY(10px)}to{opacity:1;transform:none}}`}</style>
      <div style={{width:"100%",maxWidth:480,background:T.card,
        border:`1px solid ${T.border}`,borderRadius:32,padding:"2.5rem",
        animation:"popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",boxShadow:"0 30px 60px rgba(0,0,0,0.12)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"2rem"}}>
          <div>
            <div style={{fontSize:22,fontWeight:800,letterSpacing:"-0.03em",color:T.textPri}}>
              {initial?.id?"Edit Entry":"New Entry"}
            </div>
            <div style={{fontSize:13,color:T.textSec,marginTop:4}}>
              {isWeb3?"Record a crypto transaction":"Track your personal finances"}
            </div>
          </div>
          <button onClick={onClose} style={{width:40,height:40,borderRadius:12,background:T.pill,
            border:"none",cursor:"pointer",color:T.textSec,
            display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>
            <X size={18}/>
          </button>
        </div>
        <div style={{display:"grid",gap:18}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div><label style={lbl}>Date</label>
              <input type="date" style={inp} value={form.date}
                onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
            <div><label style={lbl}>Category</label>
              <input style={inp} value={form.givenTo} placeholder="e.g. Work, Gift"
                onChange={e=>setForm(f=>({...f,givenTo:e.target.value}))}/></div>
          </div>
          <div><label style={lbl}>{isWeb3?"Description":"Project Name"}</label>
            <input style={inp} value={form.project}
              placeholder={isWeb3?"e.g. ETH staking reward":"e.g. Client project"}
              onChange={e=>setForm(f=>({...f,project:e.target.value}))}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            {[{k:"earned",l:isWeb3?"Received":"Earned",c:T.yellow},
              {k:"saved",l:isWeb3?"Staked":"Saved",c:T.green},
              {k:"given",l:isWeb3?"Sent":"Given",c:T.red}].map(({k,l,c})=>(
              <div key={k}>
                <label style={lbl}>{l}</label>
                <input type="number" style={inp}
                  value={(form as any)[k]} placeholder="0"
                  onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:12,marginTop:"2.5rem"}}>
          <button onClick={onClose} style={{flex:1,padding:"14px",
            background:T.pill,border:"none",borderRadius:16,
            color:T.textSec,cursor:"pointer",fontSize:14,fontFamily:"inherit",fontWeight:700}}>Cancel</button>
          <button onClick={()=>onSave({
            id:initial?.id??uid(),date:form.date,project:form.project,
            earned:parseFloat(String(form.earned))||0,
            saved:parseFloat(String(form.saved))||0,
            given:parseFloat(String(form.given))||0,
            givenTo:form.givenTo,walletAddress:form.walletAddress,
            walletName:form.walletName,mode:isWeb3?"web3":"web2",
          })} style={{flex:2,padding:"14px",background:T.yellow,border:"none",
            borderRadius:16,color:"#000",cursor:"pointer",fontSize:14,
            fontWeight:800,fontFamily:"inherit",boxShadow:`0 8px 20px ${T.yellow}40`}}>
            {initial?.id?"Save Changes":"Add Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({entry,onConfirm,onClose,T}:{entry:Entry;onConfirm:()=>void;onClose:()=>void;T:ThemeType}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,
      backdropFilter:"blur(12px)",padding:"1rem"}}>
      <div style={{width:"100%",maxWidth:380,background:T.card,
        border:`1px solid ${T.border}`,borderRadius:32,padding:"2.5rem",textAlign:"center",
        boxShadow:"0 30px 60px rgba(0,0,0,0.12)"}}>
        <div style={{width:60,height:60,borderRadius:20,background:`${T.red}15`,
          display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1.5rem"}}>
          <Trash2 size={24} color={T.red}/>
        </div>
        <div style={{fontSize:20,fontWeight:800,marginBottom:8,color:T.textPri,letterSpacing:"-0.03em"}}>Delete Entry?</div>
        <div style={{fontSize:14,color:T.textSec,marginBottom:"2rem",lineHeight:1.6}}>
          "{entry.project}" will be permanently removed.
        </div>
        <div style={{display:"flex",gap:12}}>
          <button onClick={onClose} style={{flex:1,padding:"14px",
            background:T.pill,border:"none",borderRadius:16,
            color:T.textSec,cursor:"pointer",fontSize:14,fontFamily:"inherit",fontWeight:700}}>Cancel</button>
          <button onClick={onConfirm} style={{flex:1,padding:"14px",
            background:T.red,border:"none",borderRadius:16,
            color:"#fff",cursor:"pointer",fontSize:14,fontWeight:800,fontFamily:"inherit"}}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function FinanceDashboard(){
  const { isWeb3, mode, setMode } = useWeb3();
  const { currency, hideBalances, isDark, setIsDark, appPasscodeVerified } = useAppSettings();
  const { web2Entries, web3Entries, loaded, save, remove } = useEntries(mode === "web3");
  const { goal, setGoal } = useGoal(mode);

  const [hydrated, setHydrated] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [editEntry, setEditEntry] = useState<Entry|null>(null);
  const [delEntry, setDelEntry] = useState<Entry|null>(null);
  const [syncModal, setSyncModal] = useState(false);
  const [filter, setFilter] = useState("All");

  useEffect(() => { setHydrated(true); }, []);

  const entries = mode === "web2" ? web2Entries : web3Entries;
  const sorted = entries
    .filter(e => filter === "All" || e.givenTo === filter)
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalEarned = entries.reduce((s,e) => s+e.earned, 0);
  const totalSaved  = entries.reduce((s,e) => s+e.saved, 0);
  const totalGiven  = entries.reduce((s,e) => s+e.given, 0);
  const netIncome   = totalEarned - totalGiven;

  const monthly = buildMonthly(entries);
  const categories = ["All", ...Array.from(new Set(entries.map(e => e.givenTo).filter(Boolean)))];

  const T = isDark ? THEME.dark : THEME.light;
  const sym = currency === "USD" ? "$" : currency === "EUR" ? "€" : "£";
  const money = (n: number) => hideBalances ? "••••" : `${sym}${n.toLocaleString(undefined, {maximumFractionDigits:0})}`;

  if (!hydrated) return null;

  return (
    <MasterPasscodeGuard isDark={isDark}>
      <PageTransition>
        <style>{`
          .bento-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
          .bento-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
          .tr-row:hover { background: ${T.pill}; }
        `}</style>

        <div style={{ display: "flex", minHeight: "100vh", background: T.bg, fontFamily: "'Outfit', sans-serif", color: T.textPri }}>
          <Sidebar isDark={isDark} setIsDark={setIsDark} />

          <main style={{ marginLeft: 80, flex: 1, padding: "2.5rem 3rem", maxWidth: 1400, margin: "0 auto", width: "calc(100% - 80px)" }}>
            
            {/* Header */}
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem" }}>
              <div>
                <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 8 }}>
                  {mode === "web3" ? "Crypto Portfolio" : "Financial Overview"}
                </h1>
                <div style={{ display: "flex", gap: 12 }}>
                  {["web2", "web3"].map(m => (
                    <button key={m} onClick={() => setMode(m as any)}
                      style={{ padding: "8px 20px", borderRadius: 99, border: "none", fontSize: 13, fontWeight: 700,
                        background: mode === m ? T.textPri : T.pill, color: mode === m ? T.bg : T.textSec, cursor: "pointer", transition: "all 0.2s" }}>
                      {m.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setSyncModal(true)} style={{ width: 48, height: 48, borderRadius: 16, background: T.pill, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.textSec }}>
                  <Zap size={20} />
                </button>
                <button onClick={() => setAddModal(true)} style={{ padding: "0 24px", height: 48, borderRadius: 16, background: T.yellow, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 800, color: "#000", display: "flex", alignItems: "center", gap: 8, boxShadow: `0 8px 20px ${T.yellow}40` }}>
                  <Plus size={20} strokeWidth={3} /> New Entry
                </button>
              </div>
            </header>

            {/* Bento Grid Layout */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "1.5rem", gridAutoRows: "minmax(160px, auto)" }}>
              
              {/* Main Metric: Net Income */}
              <div className="bento-card" style={{ gridColumn: "span 4", gridRow: "span 2", background: T.card, borderRadius: 32, padding: "2rem", border: `1px solid ${T.border}`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: `${T.blue}20`, display: "flex", alignItems: "center", justifyContent: "center", color: T.blue }}>
                    <Activity size={24} />
                  </div>
                  <div style={{ padding: "6px 12px", borderRadius: 99, background: netIncome >= 0 ? `${T.green}20` : `${T.red}20`, color: netIncome >= 0 ? T.green : T.red, fontSize: 12, fontWeight: 800 }}>
                    {netIncome >= 0 ? "+" : ""}{pct(Math.abs(netIncome), totalEarned)}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.textSec, marginBottom: 4 }}>Net Income</div>
                  <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-0.05em", color: netIncome >= 0 ? T.green : T.red }}>{money(netIncome)}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: T.pill, padding: "12px 16px", borderRadius: 20 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.textSec, textTransform: "uppercase", marginBottom: 4 }}>Earned</div>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{money(totalEarned)}</div>
                  </div>
                  <div style={{ background: T.pill, padding: "12px 16px", borderRadius: 20 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.textSec, textTransform: "uppercase", marginBottom: 4 }}>Saved</div>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{money(totalSaved)}</div>
                  </div>
                </div>
              </div>

              {/* Chart: Monthly Breakdown */}
              <div className="bento-card" style={{ gridColumn: "span 5", gridRow: "span 2", background: T.card, borderRadius: 32, padding: "2rem", border: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>Activity</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[{c:T.yellow,l:"E"},{c:T.green,l:"S"},{c:T.red,l:"G"}].map(x=>(
                      <div key={x.l} style={{ width: 12, height: 12, borderRadius: 4, background: x.c }} title={x.l} />
                    ))}
                  </div>
                </div>
                <div style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthly} barCategoryGap="40%" barGap={4}>
                      <CartesianGrid strokeDasharray="0" stroke={T.border} vertical={false} />
                      <XAxis dataKey="month" tick={{fill:T.textMut,fontSize:11,fontWeight:600}} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip cursor={{fill: T.pill}} contentStyle={{background:T.card, border:`1px solid ${T.border}`, borderRadius:16, boxShadow: "0 10px 30px rgba(0,0,0,0.1)"}} />
                      <Bar dataKey="earned" fill={T.yellow} radius={[6,6,6,6]} />
                      <Bar dataKey="saved" fill={T.green} radius={[6,6,6,6]} />
                      <Bar dataKey="given" fill={T.red} radius={[6,6,6,6]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* User / Profile Card */}
              <div className="bento-card" style={{ gridColumn: "span 3", gridRow: "span 2", background: T.purple + "15", borderRadius: 32, padding: "2rem", border: `1px solid ${T.purple}30`, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <div style={{ width: 80, height: 80, borderRadius: 30, background: T.purple, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>👤</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Korgon User</div>
                <div style={{ fontSize: 13, color: T.textSec, marginBottom: 20 }}>Financial Master</div>
                <div style={{ width: "100%", height: 1, background: `${T.purple}30`, marginBottom: 20 }} />
                <div style={{ display: "flex", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: "uppercase" }}>Entries</div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{entries.length}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: "uppercase" }}>Goal</div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{pct(totalSaved, goal)}%</div>
                  </div>
                </div>
              </div>

              {/* Transactions List */}
              <div style={{ gridColumn: "span 12", background: T.card, borderRadius: 32, padding: "2rem", border: `1px solid ${T.border}`, marginTop: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>Recent Transactions</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {categories.slice(0, 5).map(cat => (
                      <button key={cat} onClick={() => setFilter(cat)}
                        style={{ padding: "8px 16px", borderRadius: 99, border: "none", fontSize: 12, fontWeight: 700,
                          background: filter === cat ? T.textPri : T.pill, color: filter === cat ? T.bg : T.textSec, cursor: "pointer", transition: "all 0.2s" }}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {sorted.slice(0, 8).map(e => (
                    <div key={e.id} className="tr-row" style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderRadius: 20, transition: "all 0.2s" }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: T.pill, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 16, color: T.textSec }}>
                        {e.mode === "web3" ? <Wallet size={18} /> : <Calendar size={18} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{e.project}</div>
                        <div style={{ fontSize: 12, color: T.textMut }}>{e.date} • {e.givenTo || "General"}</div>
                      </div>
                      <div style={{ textAlign: "right", marginRight: 24 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: T.yellow }}>+{money(e.earned)}</div>
                        <div style={{ fontSize: 11, color: T.textMut }}>Earned</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setEditEntry(e)} style={{ width: 36, height: 36, borderRadius: 10, background: T.pill, border: "none", cursor: "pointer", color: T.textSec, display: "flex", alignItems: "center", justifyContent: "center" }}><Edit2 size={14}/></button>
                        <button onClick={() => setDelEntry(e)} style={{ width: 36, height: 36, borderRadius: 10, background: T.pill, border: "none", cursor: "pointer", color: T.red, display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={14}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </main>
        </div>

        {addModal && <EntryModal isWeb3={mode === "web3"} T={T} onSave={e => { save(e); setAddModal(false); }} onClose={() => setAddModal(false)} />}
        {editEntry && <EntryModal isWeb3={mode === "web3"} T={T} initial={editEntry} onSave={e => { save(e); setEditEntry(null); }} onClose={() => setEditEntry(null)} />}
        {delEntry && <DeleteModal entry={delEntry} T={T} onConfirm={() => { remove(delEntry.id); setDelEntry(null); }} onClose={() => setDelEntry(null)} />}
        {syncModal && <CloudSyncModal T={T} onClose={() => setSyncModal(false)} />}
      </PageTransition>
    </MasterPasscodeGuard>
  );
}
