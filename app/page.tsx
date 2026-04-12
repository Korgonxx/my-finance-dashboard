"use client";
import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart, LineChart, Line,
} from "recharts";
import {
  Plus, Edit2, Trash2, X, Target, Download, Zap,
  Send, TrendingUp, TrendingDown, Eye, EyeOff,
  ArrowUpRight, ArrowDownRight, DollarSign,
} from "lucide-react";
import { useWeb3 } from "./context/Web3Context";
import { useEntries, useGoal } from "@/lib/hooks/useEntries";
import { useAppSettings, type Currency } from "./context/AppSettingsContext";
import { MasterPasscodeGuard } from "./components/MasterPasscodeGuard";
import { Sidebar, THEME, type ThemeType } from "./components/Sidebar";
import { CloudSyncModal } from "./components/CloudSyncModal";
import { loadDashboardState, saveDashboardState } from "./lib/cloudSync";

type Entry = {
  id:string;date:string;project:string;
  earned:number;saved:number;given:number;givenTo:string;
  walletAddress?:string;walletName?:string;
  mode:"web2"|"web3";
  investmentAmount?:number;currentValue?:number;
};

function uid(){return Math.random().toString(36).slice(2,10);}
function clamp(n:number,a:number,b:number){return Math.min(Math.max(n,a),b);}
function pct(a:number,b:number){return b>0?((a/b)*100).toFixed(1):"0.0";}
function shortAddr(a:string){return a?`${a.slice(0,6)}…${a.slice(-4)}`:"" ;}
const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function buildMonthly(entries:Entry[]){
  return MONTHS.map(month=>{
    const me=entries.filter(e=>MONTHS[new Date(e.date).getMonth()]===month);
    return{month,earned:me.reduce((s,e)=>s+e.earned,0),saved:me.reduce((s,e)=>s+e.saved,0),given:me.reduce((s,e)=>s+e.given,0)};
  });
}
function buildCumulative(entries:Entry[]){
  const s=[...entries].sort((a,b)=>new Date(a.date).getTime()-new Date(b.date).getTime());
  let c=0;return s.map(e=>({date:e.date.slice(5),value:(c+=e.earned)}));
}

// ── Entry Modal ───────────────────────────────────────────────────────────────
function EntryModal({onSave,onClose,initial,isWeb3,T}:{
  onSave:(e:Entry)=>void;onClose:()=>void;
  initial?:Partial<Entry>&{earned?:string;saved?:string;given?:string};
  isWeb3:boolean;T:ThemeType;
}){
  const[form,setForm]=useState({
    date:initial?.date??new Date().toISOString().slice(0,10),
    project:initial?.project??"",
    earned:initial?.earned??"",saved:initial?.saved??"",given:initial?.given??"",
    givenTo:initial?.givenTo??"",
    walletAddress:initial?.walletAddress??"",walletName:initial?.walletName??"",
  });
  const inp:React.CSSProperties={width:"100%",padding:"10px 14px",
    background:T.pill,border:`1px solid ${T.border}`,
    borderRadius:10,color:T.textPri,fontSize:14,fontFamily:"inherit",
    outline:"none",boxSizing:"border-box",transition:"border-color 0.15s"};
  const lbl:React.CSSProperties={fontSize:10,color:T.textMut,fontWeight:700,
    letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:5,display:"block"};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,
      backdropFilter:"blur(20px)",padding:"1rem",animation:"fadeIn 0.2s"}}>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes popIn{from{opacity:0;transform:scale(0.94) translateY(12px)}to{opacity:1;transform:none}}`}</style>
      <div style={{width:"100%",maxWidth:500,background:T.card,
        border:`1px solid ${T.border}`,borderRadius:24,padding:"2rem",
        animation:"popIn 0.25s ease",boxShadow:"0 40px 80px rgba(0,0,0,0.5)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.5rem"}}>
          <div>
            <div style={{fontSize:17,fontWeight:900,letterSpacing:"-0.02em",color:T.textPri}}>
              {initial?.id?"Edit Entry":"New Entry"}
            </div>
            <div style={{fontSize:12,color:T.textMut,marginTop:2}}>
              {isWeb3?"Record a crypto transaction":"Track your finances"}
            </div>
          </div>
          <button onClick={onClose} style={{width:34,height:34,borderRadius:9,background:T.pill,
            border:`1px solid ${T.border}`,cursor:"pointer",color:T.textSec,
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <X size={15}/>
          </button>
        </div>
        <div style={{display:"grid",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><label style={lbl}>Date</label>
              <input type="date" style={inp} value={form.date}
                onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
            <div><label style={lbl}>Category</label>
              <input style={inp} value={form.givenTo} placeholder="Work, Gift, Food..."
                onChange={e=>setForm(f=>({...f,givenTo:e.target.value}))}/></div>
          </div>
          <div><label style={lbl}>{isWeb3?"Description":"Project Name"}</label>
            <input style={inp} value={form.project}
              placeholder={isWeb3?"e.g. ETH staking reward":"e.g. Client project"}
              onChange={e=>setForm(f=>({...f,project:e.target.value}))}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            {[{k:"earned",l:isWeb3?"Received":"Earned",c:T.yellow},
              {k:"saved",l:isWeb3?"Staked":"Saved",c:T.green},
              {k:"given",l:isWeb3?"Sent":"Given",c:T.red}].map(({k,l,c})=>(
              <div key={k}>
                <label style={{...lbl,color:c+"99"}}>{l}</label>
                <input type="number" style={{...inp,borderColor:`${c}22`}}
                  value={(form as any)[k]} placeholder="0"
                  onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/>
              </div>
            ))}
          </div>
          {isWeb3&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={lbl}>Wallet Address</label>
                <input style={inp} value={form.walletAddress} placeholder="0x..."
                  onChange={e=>setForm(f=>({...f,walletAddress:e.target.value}))}/></div>
              <div><label style={lbl}>Wallet Name</label>
                <input style={inp} value={form.walletName} placeholder="My Wallet"
                  onChange={e=>setForm(f=>({...f,walletName:e.target.value}))}/></div>
            </div>
          )}
        </div>
        <div style={{display:"flex",gap:10,marginTop:"1.5rem"}}>
          <button onClick={onClose} style={{flex:1,padding:"11px",
            background:T.pill,border:`1px solid ${T.border}`,borderRadius:12,
            color:T.textSec,cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:600}}>Cancel</button>
          <button onClick={()=>onSave({
            id:initial?.id??uid(),date:form.date,project:form.project,
            earned:parseFloat(String(form.earned))||0,
            saved:parseFloat(String(form.saved))||0,
            given:parseFloat(String(form.given))||0,
            givenTo:form.givenTo,walletAddress:form.walletAddress,
            walletName:form.walletName,mode:isWeb3?"web3":"web2",
          })} style={{flex:2,padding:"11px",background:T.yellow,border:"none",
            borderRadius:12,color:"#000",cursor:"pointer",fontSize:13,
            fontWeight:900,fontFamily:"inherit",boxShadow:`0 4px 16px ${T.yellow}35`}}>
            {initial?.id?"Save Changes ✓":"Add Entry →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({entry,onConfirm,onClose,T}:{entry:Entry;onConfirm:()=>void;onClose:()=>void;T:ThemeType}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,
      backdropFilter:"blur(20px)",padding:"1rem"}}>
      <div style={{width:"100%",maxWidth:360,background:T.card,
        border:`1px solid ${T.border}`,borderRadius:24,padding:"2rem",textAlign:"center",
        boxShadow:"0 40px 80px rgba(0,0,0,0.5)"}}>
        <div style={{width:52,height:52,borderRadius:14,background:`${T.red}15`,
          display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1rem"}}>
          <Trash2 size={22} color={T.red}/>
        </div>
        <div style={{fontSize:17,fontWeight:900,marginBottom:8,color:T.textPri,letterSpacing:"-0.02em"}}>Delete Entry?</div>
        <div style={{fontSize:13,color:T.textMut,marginBottom:"1.5rem",lineHeight:1.6}}>
          "{entry.project}" will be permanently removed.
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:"11px",
            background:T.pill,border:`1px solid ${T.border}`,borderRadius:12,
            color:T.textSec,cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:600}}>Cancel</button>
          <button onClick={onConfirm} style={{flex:1,padding:"11px",
            background:T.red,border:"none",borderRadius:12,
            color:"#fff",cursor:"pointer",fontSize:13,fontWeight:900,fontFamily:"inherit"}}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Card Detail Modal ─────────────────────────────────────────────────────────
function CardDetailModal({title,children,onClose,T,accentBg}:{
  title:string;children:React.ReactNode;onClose:()=>void;T:ThemeType;accentBg?:string;
}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,
      backdropFilter:"blur(20px)",padding:"1rem"}}>
      <div style={{width:"100%",maxWidth:520,background:accentBg||T.card,
        border:`1px solid ${T.border}`,borderRadius:24,padding:"2rem",
        boxShadow:"0 40px 80px rgba(0,0,0,0.5)",maxHeight:"80vh",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.5rem"}}>
          <div style={{fontSize:17,fontWeight:900,letterSpacing:"-0.02em",
            color:accentBg?"#000":T.textPri}}>{title}</div>
          <button onClick={onClose} style={{width:34,height:34,borderRadius:9,
            background:"rgba(0,0,0,0.15)",border:"none",cursor:"pointer",
            color:accentBg?"#000":T.textSec,
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <X size={15}/>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function FinanceDashboard(){
  const{isWeb3,setMode}=useWeb3();
  const{setCurrentPage,currency,setCurrency,hideBalances,setHideBalances}=useAppSettings();
  const currentMode=isWeb3?"web3":"web2";
  const{goal,setGoal:setGoalAndSync}=useGoal(currentMode);
  const{web2Entries,web3Entries,setWeb2Entries,setWeb3Entries,loaded,save:saveEntry,remove:removeEntry}=useEntries(isWeb3);
  const[isDark,setIsDark]=useState(true);
  const[filter,setFilter]=useState("All");
  const[addModal,setAddModal]=useState(false);
  const[editEntry,setEditEntry]=useState<Entry|null>(null);
  const[deleteEntry,setDeleteEntry]=useState<Entry|null>(null);
  const[detailCard,setDetailCard]=useState<string|null>(null);
  const[cloudSyncModal,setCloudSyncModal]=useState(false);
  const[cloudSyncId,setCloudSyncId]=useState("");
  const[cloudSyncMessage,setCloudSyncMessage]=useState<string|null>(null);
  const[cloudSyncLoading,setCloudSyncLoading]=useState(false);
  const[autoSyncEnabled,setAutoSyncEnabled]=useState(false);
  const[goalInput,setGoalInput]=useState(String(goal));
  const[showGoalModal,setShowGoalModal]=useState(false);
  const[goalError,setGoalError]=useState("");
  const[isHydrated,setIsHydrated]=useState(false);

  const T=isDark?THEME.dark:THEME.light;

  useEffect(()=>{setIsHydrated(true);setCurrentPage("home");},[setCurrentPage]);
  useEffect(()=>{setGoalInput(String(goal));},[goal]);

  const entries=isWeb3?web3Entries:web2Entries;
  const save=useCallback((e:Entry)=>{saveEntry(e);setAddModal(false);setEditEntry(null);},[saveEntry]);
  const remove=useCallback((id:string)=>{removeEntry(id);setDeleteEntry(null);},[removeEntry]);

  const categories=["All",...Array.from(new Set(entries.map(e=>e.givenTo).filter(Boolean)))];
  const filtered=filter==="All"?entries:entries.filter(e=>e.givenTo===filter);
  const sorted=[...filtered].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime());

  const totalEarned=entries.reduce((s,e)=>s+e.earned,0);
  const totalSaved=entries.reduce((s,e)=>s+e.saved,0);
  const totalGiven=entries.reduce((s,e)=>s+e.given,0);
  const netIncome=totalEarned-totalGiven;
  const progress=clamp((totalEarned/goal)*100,0,100);
  const monthly=buildMonthly(entries);
  const cumulative=buildCumulative(entries);

  const money=(n:number)=>{
    if(hideBalances)return"••••";
    return new Intl.NumberFormat("en-US",{style:"currency",currency:isWeb3?"USD":currency,maximumFractionDigits:0}).format(n??0);
  };

  const generateCloudSyncId=useCallback(()=>`${uid()}${uid()}`,[]);
  const saveCloudSync=useCallback(async(id:string)=>{
    if(!id)return;setCloudSyncLoading(true);setCloudSyncMessage("Syncing...");
    try{
      await saveDashboardState(id,{entries:[...web2Entries,...web3Entries],goal,currency,hideBalances,mode:currentMode});
      setCloudSyncId(id);setCloudSyncMessage(`Synced — ID: ${id}`);
    }catch{setCloudSyncMessage("Sync failed.");}
    finally{setCloudSyncLoading(false);}
  },[web2Entries,web3Entries,goal,currency,hideBalances,currentMode]);

  const loadCloudSync=useCallback(async(id:string)=>{
    if(!id)return;setCloudSyncLoading(true);setCloudSyncMessage("Loading...");
    try{
      const data=await loadDashboardState(id);
      if(!data){setCloudSyncMessage("No data found.");return;}
      const all=Array.isArray(data.entries)?data.entries:[];
      setWeb2Entries(all.filter((e:any):e is Entry=>e?.mode==="web2"));
      setWeb3Entries(all.filter((e:any):e is Entry=>e?.mode==="web3"));
      setGoalAndSync(typeof data.goal==="number"?data.goal:60000);
      setCurrency((data.currency as any)||"USD");
      setHideBalances(Boolean(data.hideBalances));
      setCloudSyncMessage(`Loaded — ID: ${id}`);
    }catch{setCloudSyncMessage("Load failed.");}
    finally{setCloudSyncLoading(false);}
  },[setCurrency,setHideBalances,setGoalAndSync,setWeb2Entries,setWeb3Entries]);

  const exportCsv=useCallback(()=>{
    const hdr=["Date","Project","Earned","Saved","Given","Category"];
    const rows=sorted.map(e=>[e.date,`"${e.project}"`,e.earned,e.saved,e.given,e.givenTo]);
    const csv=[hdr,...rows].map(r=>r.join(",")).join("\n");
    const a=Object.assign(document.createElement("a"),{
      href:URL.createObjectURL(new Blob([csv],{type:"text/csv"})),
      download:`korgon-${new Date().toISOString().slice(0,10)}.csv`,
    });a.click();
  },[sorted]);

  const handleImportEntries=useCallback((importedEntries:Entry[],importedGoal?:number)=>{
    const setter=isWeb3?setWeb3Entries:setWeb2Entries;
    setter(importedEntries);
    if(importedGoal&&importedGoal>0)setGoalAndSync(importedGoal);
  },[isWeb3,setGoalAndSync,setWeb2Entries,setWeb3Entries]);

  // ── Recent categories for breakdown ──
  const catBreakdown=Object.entries(
    entries.reduce((acc,e)=>({...acc,[e.givenTo||"Uncategorised"]:(acc[e.givenTo||"Uncategorised"]||0)+e.earned}),{} as Record<string,number>)
  ).sort((a,b)=>b[1]-a[1]).slice(0,5);

  const monthlyWithActivity=monthly.filter(m=>m.earned>0||m.saved>0||m.given>0);

  return(
    <MasterPasscodeGuard isDark={isDark}>
      <>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Outfit:wght@400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{background:${T.bg};color:${T.textPri}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        @keyframes popIn{from{opacity:0;transform:scale(0.94) translateY(12px)}to{opacity:1;transform:none}}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:99px}
        input[type=date]::-webkit-calendar-picker-indicator{filter:${isDark?"invert(0.5)":"none"};cursor:pointer}
        input::placeholder{color:${T.textMut}}
        option{background:${T.card};color:${T.textPri}}
        .kc{transition:transform 0.2s ease,box-shadow 0.2s ease;}
        .kc:hover{transform:translateY(-3px);}
        .tr{transition:background 0.12s;}
        .tr:hover{background:${T.pill}!important;}
        .pill-btn{transition:all 0.15s;cursor:pointer;}
        .pill-btn:hover{opacity:0.8;}
      `}</style>

      <div style={{display:"flex",minHeight:"100vh",background:T.bg,
        fontFamily:"'Outfit','Segoe UI',sans-serif",color:T.textPri}}>

        <Sidebar isDark={isDark} setIsDark={setIsDark}/>

        {/* CONTENT */}
        <div style={{marginLeft:230,flex:1,display:"flex",flexDirection:"column",minHeight:"100vh"}}>

          {/* TOP BAR */}
          <div style={{padding:"1rem 2rem",display:"flex",alignItems:"center",
            justifyContent:"space-between",
            borderBottom:`1px solid ${T.border}`,
            background: isDark?"rgba(8,8,8,0.85)":"rgba(242,242,240,0.9)",
            backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:40}}>
            <div>
              <div style={{fontSize:10,color:T.textMut,fontWeight:700,
                letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:2}}>
                {isHydrated&&isWeb3?"Crypto Portfolio":"Personal Finance"}
              </div>
              <div style={{fontSize:20,fontWeight:900,letterSpacing:"-0.03em",color:T.textPri}}>
                Dashboard
              </div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <button onClick={()=>setCloudSyncModal(true)}
                style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",
                  borderRadius:99,background:T.pill,border:`1px solid ${T.border}`,
                  color:T.textSec,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                <Zap size={11}/>Sync
              </button>
              <button onClick={exportCsv}
                style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",
                  borderRadius:99,background:T.pill,border:`1px solid ${T.border}`,
                  color:T.textSec,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                <Download size={11}/>Export
              </button>
              <button onClick={()=>setAddModal(true)}
                style={{display:"flex",alignItems:"center",gap:6,padding:"7px 18px",
                  borderRadius:99,background:T.yellow,border:"none",
                  color:"#000",fontSize:11,fontWeight:900,cursor:"pointer",
                  fontFamily:"inherit",boxShadow:`0 4px 14px ${T.yellow}40`}}>
                <Plus size={13}/>Add Entry
              </button>
            </div>
          </div>

          {/* PAGE */}
          <div style={{padding:"1.5rem 2rem 4rem",flex:1,animation:"slideUp 0.4s ease"}}>

            {/* ── HEADLINE NUMBERS ── */}
            <div style={{display:"flex",gap:0,marginBottom:"1.5rem",
              background:T.card,borderRadius:20,border:`1px solid ${T.border}`,
              overflow:"hidden"}}>
              {[
                {label:isHydrated&&isWeb3?"Total Assets":"Total Earned",value:money(totalEarned),change:null,color:T.yellow},
                {label:"Net Income",value:money(netIncome),
                  change:{val:pct(Math.abs(netIncome),totalEarned)+"%",up:netIncome>=0},
                  color:netIncome>=0?T.green:T.red},
                {label:isHydrated&&isWeb3?"Total Sent":"Total Given",value:money(totalGiven),change:null,color:T.textSec},
                {label:isHydrated&&isWeb3?"Portfolio Goal":"Yearly Goal",value:`${Math.round(progress)}%`,
                  change:{val:money(goal),up:true},color:T.yellow},
              ].map((item,i)=>(
                <div key={i} style={{flex:1,padding:"1.5rem",
                  borderRight:i<3?`1px solid ${T.border}`:"none",
                  cursor:i===3?"pointer":"default"}}
                  onClick={i===3?()=>setShowGoalModal(true):undefined}>
                  <div style={{fontSize:10,color:T.textMut,fontWeight:700,
                    letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>
                    {item.label}
                  </div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:"1.8rem",
                    fontWeight:700,color:item.color,letterSpacing:"-0.04em",lineHeight:1,marginBottom:6}}>
                    {item.value}
                  </div>
                  {item.change&&(
                    <div style={{display:"flex",alignItems:"center",gap:4,
                      padding:"2px 8px",borderRadius:99,width:"fit-content",
                      background:item.change.up?`${T.green}15`:`${T.red}15`}}>
                      {item.change.up?<ArrowUpRight size={11} color={T.green}/>:<ArrowDownRight size={11} color={T.red}/>}
                      <span style={{fontSize:11,fontWeight:700,
                        color:item.change.up?T.green:T.red}}>{item.change.val}</span>
                    </div>
                  )}
                  {i===3&&(
                    <div style={{height:3,background:T.border,borderRadius:99,marginTop:8}}>
                      <div style={{height:"100%",borderRadius:99,background:T.yellow,
                        width:`${progress}%`,transition:"width 1s ease"}}/>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ── CARD GRID ── */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"1rem",marginBottom:"1rem"}}>

              {/* Cash Flow — GREEN */}
              <div className="kc" onClick={()=>setDetailCard("cashflow")}
                style={{background:T.green,borderRadius:20,padding:"1.5rem",cursor:"pointer",
                  position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:-20,right:-20,width:100,height:100,
                  borderRadius:"50%",background:"rgba(0,0,0,0.08)"}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12,position:"relative"}}>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",
                      textTransform:"uppercase",color:"rgba(0,0,0,0.45)",marginBottom:4}}>Cash Flow</div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:"1.7rem",
                      fontWeight:700,color:"#000",letterSpacing:"-0.03em",lineHeight:1}}>
                      {money(totalEarned)}
                    </div>
                  </div>
                  <div style={{width:34,height:34,borderRadius:10,background:"rgba(0,0,0,0.12)",
                    display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <TrendingUp size={15} color="#000"/>
                  </div>
                </div>
                <div style={{height:70,position:"relative"}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cumulative.slice(-10)}>
                      <defs>
                        <linearGradient id="gfg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#000" stopOpacity={0.2}/>
                          <stop offset="100%" stopColor="#000" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="value" stroke="#000" strokeWidth={2} fill="url(#gfg)" dot={false}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div style={{display:"flex",gap:16,marginTop:8}}>
                  <div>
                    <div style={{fontSize:9,color:"rgba(0,0,0,0.4)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"}}>Saved</div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:700,color:"#000"}}>{money(totalSaved)}</div>
                  </div>
                  <div>
                    <div style={{fontSize:9,color:"rgba(0,0,0,0.4)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"}}>Given</div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:700,color:"#000"}}>{money(totalGiven)}</div>
                  </div>
                </div>
              </div>

              {/* Goal — YELLOW */}
              <div className="kc" onClick={()=>setShowGoalModal(true)}
                style={{background:T.yellow,borderRadius:20,padding:"1.5rem",cursor:"pointer",
                  position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",bottom:-30,right:-30,width:120,height:120,
                  borderRadius:"50%",background:"rgba(0,0,0,0.06)"}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12,position:"relative"}}>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",
                      textTransform:"uppercase",color:"rgba(0,0,0,0.4)",marginBottom:4}}>
                      {money(goal)}
                    </div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:"1.7rem",
                      fontWeight:700,color:"#000",letterSpacing:"-0.03em",lineHeight:1}}>
                      {Math.round(progress)}%
                    </div>
                  </div>
                  <button style={{width:34,height:34,borderRadius:10,background:"rgba(0,0,0,0.12)",
                    border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <Target size={15} color="#000"/>
                  </button>
                </div>
                <div style={{height:8,background:"rgba(0,0,0,0.12)",borderRadius:99,marginBottom:10,position:"relative"}}>
                  <div style={{position:"absolute",inset:0,borderRadius:99,background:"rgba(0,0,0,0.5)",
                    width:`${progress}%`,transition:"width 1s ease"}}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <div style={{background:"rgba(0,0,0,0.1)",borderRadius:10,padding:"8px 10px"}}>
                    <div style={{fontSize:9,color:"rgba(0,0,0,0.4)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2}}>Earned</div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:700,color:"#000"}}>{money(totalEarned)}</div>
                  </div>
                  <div style={{background:"rgba(0,0,0,0.1)",borderRadius:10,padding:"8px 10px"}}>
                    <div style={{fontSize:9,color:"rgba(0,0,0,0.4)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2}}>Remain</div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:700,color:"#000"}}>{money(Math.max(0,goal-totalEarned))}</div>
                  </div>
                </div>
              </div>

              {/* Net Income — DARK */}
              <div className="kc" onClick={()=>setDetailCard("income")}
                style={{background:T.card,borderRadius:20,padding:"1.5rem",cursor:"pointer",
                  border:`1px solid ${T.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",
                      textTransform:"uppercase",color:T.textMut,marginBottom:4}}>Net Income</div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:"1.7rem",
                      fontWeight:700,letterSpacing:"-0.03em",lineHeight:1,
                      color:netIncome>=0?T.green:T.red}}>
                      {money(netIncome)}
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:4,
                    padding:"4px 10px",borderRadius:99,
                    background:netIncome>=0?`${T.green}15`:`${T.red}15`}}>
                    {netIncome>=0
                      ?<TrendingUp size={12} color={T.green}/>
                      :<TrendingDown size={12} color={T.red}/>}
                    <span style={{fontSize:11,fontWeight:700,
                      color:netIncome>=0?T.green:T.red}}>
                      {pct(Math.abs(netIncome),totalEarned)}%
                    </span>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                  <div style={{background:T.card2,borderRadius:10,padding:"10px 12px"}}>
                    <div style={{fontSize:9,color:T.textMut,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:3}}>Saved</div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:700,color:T.green}}>{money(totalSaved)}</div>
                  </div>
                  <div style={{background:T.card2,borderRadius:10,padding:"10px 12px"}}>
                    <div style={{fontSize:9,color:T.textMut,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:3}}>Given</div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:700,color:T.red}}>{money(totalGiven)}</div>
                  </div>
                </div>
                <div style={{fontSize:11,color:T.textMut,textAlign:"right"}}>View details →</div>
              </div>
            </div>

            {/* ── CHARTS ROW ── */}
            <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:"1rem",marginBottom:"1rem"}}>

              {/* Monthly breakdown */}
              <div className="kc" onClick={()=>setDetailCard("monthly")}
                style={{background:T.card,borderRadius:20,padding:"1.5rem",
                  border:`1px solid ${T.border}`,cursor:"pointer"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:800,letterSpacing:"-0.01em",color:T.textPri}}>Monthly Breakdown</div>
                    <div style={{fontSize:11,color:T.textMut,marginTop:2}}>Earned · Saved · Given</div>
                  </div>
                  <div style={{display:"flex",gap:10}}>
                    {[{c:T.yellow,l:"Earned"},{c:T.green,l:"Saved"},{c:T.red,l:"Given"}].map(x=>(
                      <div key={x.l} style={{display:"flex",alignItems:"center",gap:4}}>
                        <div style={{width:6,height:6,borderRadius:2,background:x.c}}/>
                        <span style={{fontSize:10,color:T.textMut,fontWeight:600}}>{x.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {monthlyWithActivity.length>0?(
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={monthly} barCategoryGap="38%" barGap={2}>
                      <CartesianGrid strokeDasharray="2 5" stroke={isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.06)"} vertical={false}/>
                      <XAxis dataKey="month" tick={{fill:T.textMut,fontSize:10}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fill:T.textMut,fontSize:10}} axisLine={false} tickLine={false}
                        tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} width={34}/>
                      <Tooltip contentStyle={{background:T.card2,border:`1px solid ${T.border}`,
                        borderRadius:12,fontSize:12,color:T.textPri,boxShadow:"0 8px 32px rgba(0,0,0,0.3)"}}/>
                      <Bar dataKey="earned" name="Earned" fill={T.yellow} radius={[5,5,0,0]}/>
                      <Bar dataKey="saved"  name="Saved"  fill={T.green}  radius={[5,5,0,0]}/>
                      <Bar dataKey="given"  name="Given"  fill={T.red}    radius={[5,5,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                ):(
                  <div style={{height:200,display:"flex",flexDirection:"column",alignItems:"center",
                    justifyContent:"center",gap:12}}>
                    <div style={{fontSize:32,opacity:0.2}}>📊</div>
                    <div style={{fontSize:13,color:T.textMut}}>Add entries to see your chart</div>
                    <button onClick={(e)=>{e.stopPropagation();setAddModal(true);}}
                      style={{padding:"8px 18px",borderRadius:99,background:T.yellow,border:"none",
                        color:"#000",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
                      Add First Entry
                    </button>
                  </div>
                )}
              </div>

              {/* Category breakdown */}
              <div className="kc" onClick={()=>setDetailCard("categories")}
                style={{background:T.card,borderRadius:20,padding:"1.5rem",
                  border:`1px solid ${T.border}`,cursor:"pointer"}}>
                <div style={{fontSize:13,fontWeight:800,letterSpacing:"-0.01em",marginBottom:4}}>By Category</div>
                <div style={{fontSize:11,color:T.textMut,marginBottom:"1.25rem"}}>Income sources breakdown</div>
                {catBreakdown.length>0?(
                  catBreakdown.map(([cat,val],i)=>{
                    const colors=[T.yellow,T.green,T.blue,T.purple,T.red];
                    const maxVal=catBreakdown[0][1];
                    return(
                      <div key={cat} style={{marginBottom:14}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                          <span style={{fontSize:12,fontWeight:600,color:T.textSec}}>{cat||"Other"}</span>
                          <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,
                            fontWeight:700,color:colors[i%colors.length]}}>{money(val)}</span>
                        </div>
                        <div style={{height:5,background:T.pill,borderRadius:99}}>
                          <div style={{height:"100%",borderRadius:99,background:colors[i%colors.length],
                            width:`${(val/maxVal)*100}%`,transition:"width 0.8s ease"}}/>
                        </div>
                      </div>
                    );
                  })
                ):(
                  <div style={{textAlign:"center",padding:"2rem 0",color:T.textMut,fontSize:13}}>
                    No categories yet
                  </div>
                )}
              </div>
            </div>

            {/* ── TRANSACTION TABLE ── */}
            <div style={{background:T.card,borderRadius:20,border:`1px solid ${T.border}`,overflow:"hidden"}}>
              <div style={{padding:"1.25rem 1.5rem",borderBottom:`1px solid ${T.border}`,
                display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                <div>
                  <div style={{fontSize:14,fontWeight:800,letterSpacing:"-0.01em"}}>Recent Transactions</div>
                  <div style={{fontSize:11,color:T.textMut,marginTop:2}}>{sorted.length} entries</div>
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {categories.slice(0,7).map(cat=>(
                    <button key={cat} className="pill-btn" onClick={()=>setFilter(cat)}
                      style={{padding:"5px 14px",borderRadius:99,
                        background:filter===cat?T.yellow:T.pill,
                        color:filter===cat?"#000":T.textSec,
                        border:`1px solid ${filter===cat?"transparent":T.border}`,
                        fontSize:11,fontWeight:700,fontFamily:"inherit",
                        boxShadow:filter===cat?`0 2px 8px ${T.yellow}30`:"none"}}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",minWidth:560}}>
                  <thead>
                    <tr>
                      {["Date","Description",...(isHydrated&&isWeb3?["Wallet"]:[]),"Received","Saved","Sent","Category",""].map((h,i)=>(
                        <th key={i} style={{padding:"0.7rem 1.25rem",
                          textAlign:["Received","Saved","Sent"].includes(h)?"right":h===""?"center":"left",
                          fontSize:9,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",
                          color:T.textMut,background:isDark?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.02)",
                          whiteSpace:"nowrap"}}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map(e=>(
                      <tr key={e.id} className="tr" style={{borderBottom:`1px solid ${T.border}`}}>
                        <td style={{padding:"0.85rem 1.25rem",fontSize:11,color:T.textMut,
                          fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>{e.date}</td>
                        <td style={{padding:"0.85rem 1.25rem",fontSize:13,fontWeight:600,
                          color:T.textPri,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {e.project}
                        </td>
                        {isHydrated&&isWeb3&&(
                          <td style={{padding:"0.85rem 1.25rem",fontSize:11,
                            fontFamily:"'DM Mono',monospace",color:T.textMut}}>
                            {e.walletName||shortAddr(e.walletAddress||"")||"—"}
                          </td>
                        )}
                        <td style={{padding:"0.85rem 1.25rem",textAlign:"right",
                          fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:700,
                          color:T.yellow,whiteSpace:"nowrap"}}>{money(e.earned)}</td>
                        <td style={{padding:"0.85rem 1.25rem",textAlign:"right",
                          fontFamily:"'DM Mono',monospace",fontSize:12,color:T.green,whiteSpace:"nowrap"}}>
                          {money(e.saved)}
                        </td>
                        <td style={{padding:"0.85rem 1.25rem",textAlign:"right",
                          fontFamily:"'DM Mono',monospace",fontSize:12,color:T.red,whiteSpace:"nowrap"}}>
                          {money(e.given)}
                        </td>
                        <td style={{padding:"0.85rem 1.25rem"}}>
                          {e.givenTo&&(
                            <span style={{padding:"3px 10px",borderRadius:99,
                              background:T.pill,fontSize:10,fontWeight:700,color:T.textSec,
                              border:`1px solid ${T.border}`}}>{e.givenTo}</span>
                          )}
                        </td>
                        <td style={{padding:"0.85rem 1.25rem"}}>
                          <div style={{display:"flex",gap:5,justifyContent:"center"}}>
                            <button onClick={()=>setEditEntry(e)}
                              style={{width:27,height:27,borderRadius:7,
                                background:`${T.blue}12`,border:"none",cursor:"pointer",color:T.blue,
                                display:"flex",alignItems:"center",justifyContent:"center"}}>
                              <Edit2 size={11}/>
                            </button>
                            <button onClick={()=>setDeleteEntry(e)}
                              style={{width:27,height:27,borderRadius:7,
                                background:`${T.red}12`,border:"none",cursor:"pointer",color:T.red,
                                display:"flex",alignItems:"center",justifyContent:"center"}}>
                              <Trash2 size={11}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {sorted.length===0&&(
                      <tr><td colSpan={9} style={{padding:"4rem",textAlign:"center"}}>
                        <div style={{fontSize:32,marginBottom:12,opacity:0.3}}>📝</div>
                        <div style={{color:T.textMut,fontSize:14,marginBottom:12}}>No entries yet</div>
                        <button onClick={()=>setAddModal(true)}
                          style={{padding:"10px 24px",borderRadius:99,background:T.yellow,border:"none",
                            color:"#000",cursor:"pointer",fontWeight:800,fontSize:13,fontFamily:"inherit"}}>
                          Add your first entry →
                        </button>
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}
      {addModal&&<EntryModal onSave={save} onClose={()=>setAddModal(false)} isWeb3={isWeb3} T={T}/>}
      {editEntry&&<EntryModal
        initial={{...editEntry,earned:String(editEntry.earned),saved:String(editEntry.saved),given:String(editEntry.given)}}
        onSave={save} onClose={()=>setEditEntry(null)} isWeb3={isWeb3} T={T}/>}
      {deleteEntry&&<DeleteModal entry={deleteEntry} onConfirm={()=>remove(deleteEntry.id)} onClose={()=>setDeleteEntry(null)} T={T}/>}

      {/* Cash Flow Detail */}
      {detailCard==="cashflow"&&(
        <CardDetailModal title="Cash Flow Details" onClose={()=>setDetailCard(null)} T={T} accentBg={T.green}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
            {[
              {l:"Total Earned",v:money(totalEarned)},
              {l:"Total Saved",v:money(totalSaved)},
              {l:"Total Given",v:money(totalGiven)},
            ].map(x=>(
              <div key={x.l} style={{background:"rgba(0,0,0,0.12)",borderRadius:12,padding:"12px 14px"}}>
                <div style={{fontSize:9,color:"rgba(0,0,0,0.45)",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4}}>{x.l}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:15,fontWeight:700,color:"#000"}}>{x.v}</div>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={cumulative}>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(0,0,0,0.1)" vertical={false}/>
              <XAxis dataKey="date" tick={{fill:"rgba(0,0,0,0.4)",fontSize:9}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"rgba(0,0,0,0.4)",fontSize:9}} axisLine={false} tickLine={false}
                tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} width={34}/>
              <Tooltip contentStyle={{background:"#fff",border:"none",borderRadius:10,fontSize:12,color:"#000"}}/>
              <Line type="monotone" dataKey="value" stroke="#000" strokeWidth={2.5} dot={false} activeDot={{r:5}}/>
            </LineChart>
          </ResponsiveContainer>
        </CardDetailModal>
      )}

      {/* Income Detail */}
      {detailCard==="income"&&(
        <CardDetailModal title="Income Breakdown" onClose={()=>setDetailCard(null)} T={T}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
            {[
              {l:"Total Earned",v:money(totalEarned),c:T.yellow},
              {l:"Net Income",v:money(netIncome),c:netIncome>=0?T.green:T.red},
              {l:"Total Saved",v:money(totalSaved),c:T.green},
              {l:"Total Given",v:money(totalGiven),c:T.red},
            ].map(x=>(
              <div key={x.l} style={{background:T.card2,borderRadius:12,padding:"14px 16px",border:`1px solid ${T.border}`}}>
                <div style={{fontSize:9,color:T.textMut,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6}}>{x.l}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:18,fontWeight:700,color:x.c}}>{x.v}</div>
              </div>
            ))}
          </div>
          <div style={{marginBottom:12}}>
            {catBreakdown.map(([cat,val],i)=>{
              const colors=[T.yellow,T.green,T.blue,T.purple,T.red];
              return(
                <div key={cat} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                  <div style={{width:8,height:8,borderRadius:2,background:colors[i%colors.length],flexShrink:0}}/>
                  <div style={{flex:1,fontSize:13,color:T.textSec,fontWeight:600}}>{cat||"Other"}</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:700,color:colors[i%colors.length]}}>{money(val)}</div>
                </div>
              );
            })}
          </div>
        </CardDetailModal>
      )}

      {/* Monthly Detail */}
      {detailCard==="monthly"&&(
        <CardDetailModal title="Monthly Performance" onClose={()=>setDetailCard(null)} T={T}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly} barCategoryGap="35%" barGap={2}>
              <CartesianGrid strokeDasharray="2 5" stroke={isDark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.06)"} vertical={false}/>
              <XAxis dataKey="month" tick={{fill:T.textMut,fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:T.textMut,fontSize:10}} axisLine={false} tickLine={false}
                tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} width={34}/>
              <Tooltip contentStyle={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:12,fontSize:12,color:T.textPri}}/>
              <Bar dataKey="earned" name="Earned" fill={T.yellow} radius={[5,5,0,0]}/>
              <Bar dataKey="saved"  name="Saved"  fill={T.green}  radius={[5,5,0,0]}/>
              <Bar dataKey="given"  name="Given"  fill={T.red}    radius={[5,5,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </CardDetailModal>
      )}

      {/* Categories Detail */}
      {detailCard==="categories"&&(
        <CardDetailModal title="Category Breakdown" onClose={()=>setDetailCard(null)} T={T}>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {catBreakdown.length>0?catBreakdown.map(([cat,val],i)=>{
              const colors=[T.yellow,T.green,T.blue,T.purple,T.red];
              const maxVal=catBreakdown[0][1];
              return(
                <div key={cat}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:10,height:10,borderRadius:3,background:colors[i%colors.length]}}/>
                      <span style={{fontSize:13,fontWeight:700,color:T.textPri}}>{cat||"Other"}</span>
                    </div>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:700,
                      color:colors[i%colors.length]}}>{money(val)}</span>
                  </div>
                  <div style={{height:6,background:T.pill,borderRadius:99}}>
                    <div style={{height:"100%",borderRadius:99,background:colors[i%colors.length],
                      width:`${(val/maxVal)*100}%`,transition:"width 0.8s ease"}}/>
                  </div>
                </div>
              );
            }):(
              <div style={{textAlign:"center",padding:"2rem",color:T.textMut,fontSize:13}}>
                Add entries with categories to see breakdown
              </div>
            )}
          </div>
        </CardDetailModal>
      )}

      {cloudSyncModal&&(
        <CloudSyncModal
          cloudSyncId={cloudSyncId}
          onClose={()=>setCloudSyncModal(false)}
          onGenerateId={generateCloudSyncId}
          onSave={saveCloudSync}
          onLoad={loadCloudSync}
          loading={cloudSyncLoading}
          message={cloudSyncMessage}
          autoSyncEnabled={autoSyncEnabled}
          setAutoSyncEnabled={setAutoSyncEnabled}
          T={{card:T.card,border:T.border,primary:T.yellow,textPri:T.textPri,
            textSec:T.textSec,textMut:T.textMut,inputBg:T.pill,
            rose:T.red,shadow:"0 32px 80px rgba(0,0,0,0.8)",
            btnGhost:T.pill,selectBg:T.card,blue:T.blue} as any}
        />
      )}

      {/* Goal Modal */}
      {showGoalModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",
          display:"flex",alignItems:"center",justifyContent:"center",
          zIndex:200,backdropFilter:"blur(20px)",padding:"1rem"}}>
          <div style={{width:"100%",maxWidth:380,background:T.card,
            border:`1px solid ${T.border}`,borderRadius:24,padding:"2rem",
            boxShadow:"0 40px 80px rgba(0,0,0,0.5)",animation:"popIn 0.25s ease"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:"1.5rem"}}>
              <div style={{width:38,height:38,borderRadius:10,background:`${T.yellow}18`,
                display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Target size={17} color={T.yellow}/>
              </div>
              <div>
                <div style={{fontSize:16,fontWeight:900,letterSpacing:"-0.02em",color:T.textPri}}>Set Your Goal</div>
                <div style={{fontSize:11,color:T.textMut}}>Annual {isHydrated&&isWeb3?"portfolio":"earning"} target</div>
              </div>
            </div>
            <input type="number" value={goalInput}
              onChange={e=>{setGoalInput(e.target.value);setGoalError("");}}
              style={{width:"100%",padding:"12px 14px",
                background:T.pill,border:`1px solid ${T.border}`,
                borderRadius:12,color:T.textPri,fontSize:16,fontFamily:"'DM Mono',monospace",
                marginBottom:8,boxSizing:"border-box",fontWeight:700}}
              placeholder="e.g. 100000"/>
            {goalError&&<div style={{color:T.red,fontSize:12,marginBottom:8,fontWeight:600}}>{goalError}</div>}
            <div style={{display:"flex",gap:10,marginTop:16}}>
              <button onClick={()=>setShowGoalModal(false)}
                style={{flex:1,padding:"11px",background:T.pill,border:`1px solid ${T.border}`,
                  borderRadius:12,color:T.textSec,cursor:"pointer",fontSize:13,
                  fontFamily:"inherit",fontWeight:600}}>Cancel</button>
              <button onClick={()=>{
                const p=parseFloat(goalInput.replace(/[^0-9.]/g,""));
                if(!p||p<=0){setGoalError("Enter a valid goal");return;}
                setGoalAndSync(p);setShowGoalModal(false);
              }} style={{flex:2,padding:"11px",background:T.yellow,border:"none",
                borderRadius:12,color:"#000",cursor:"pointer",fontSize:13,
                fontWeight:900,fontFamily:"inherit",boxShadow:`0 4px 14px ${T.yellow}35`}}>
                Save Goal →
              </button>
            </div>
          </div>
        </div>
      )}
      </>
    </MasterPasscodeGuard>
  );
}