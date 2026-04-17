"use client";
import { useEntries } from "../../lib/hooks/useEntries";
import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import { TrendingUp, BarChart2, Activity, Target, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import { useAppSettings } from "../context/AppSettingsContext";
import { MasterPasscodeGuard } from "../components/MasterPasscodeGuard";
import { Sidebar, THEME } from "../components/Sidebar";
import { PageTransition } from "../components/PageTransition";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function PerformancePage() {
  const { isWeb3, mode } = useWeb3();
  const { isDark, setIsDark } = useAppSettings();
  const [hydrated, setHydrated] = useState(false);
  
  // Use document class for initial mode to prevent jitter
  const initialMode = typeof document !== 'undefined' && document.documentElement.classList.contains('web3-mode') ? 'web3' : 'web2';
  const [perfMode, setPerfMode] = useState<"web2"|"web3">(initialMode);
  const [chartType, setChartType] = useState<"bar"|"line"|"radar">("bar");

  useEffect(() => {
    setHydrated(true);
    // Sync with actual context mode once hydrated
    setPerfMode(mode === "web3" ? "web3" : "web2");
  }, [mode]);

  const T = isDark ? THEME.dark : THEME.light;
  const { web2Entries, web3Entries } = useEntries(perfMode === "web3");
  const entries = perfMode === "web2" ? web2Entries : web3Entries;

  const perfData = MONTHS.map(month => {
    const me = entries.filter(e => MONTHS[new Date(e.date).getMonth()] === month);
    const earned = me.reduce((s,e) => s+e.earned, 0);
    const saved  = me.reduce((s,e) => s+e.saved, 0);
    const given  = me.reduce((s,e) => s+e.given, 0);
    const roi    = earned > 0 ? parseFloat(((saved/earned)*100).toFixed(1)) : 0;
    return { month, earned, saved, given, roi };
  });

  const activeData = perfData.filter(d => d.earned > 0 || d.saved > 0);

  const totalEarned = entries.reduce((s,e) => s+e.earned, 0);
  const totalSaved  = entries.reduce((s,e) => s+e.saved, 0);
  const totalGiven  = entries.reduce((s,e) => s+e.given, 0);
  const avgRoi = activeData.length > 0
    ? (activeData.reduce((s,d) => s+d.roi,0)/activeData.length).toFixed(1) : "0.0";
  const bestMonth = activeData.reduce((best,d) => d.roi>(best?.roi??-Infinity)?d:best, activeData[0]);
  const netIncome = totalEarned - totalGiven;

  const catMap: Record<string,number> = {};
  entries.forEach(e => { catMap[e.givenTo||"Other"] = (catMap[e.givenTo||"Other"]||0)+e.earned; });
  const catColors = [T.yellow, T.green, T.blue, T.purple, T.red];
  const catData = Object.entries(catMap).map(([name,value],i) => ({ name, value, color: catColors[i%catColors.length] }));

  const fmt = (n: number) => {
    if(n===undefined||n===null)return"$0";
    return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
  };

  const metrics = [
    { label:"Total Earned", value:fmt(totalEarned), icon:TrendingUp, color:T.yellow, sub:`${entries.length} entries`, up:true },
    { label:"Total Saved",  value:fmt(totalSaved),  icon:Target,     color:T.green,  sub:`${totalEarned>0?((totalSaved/totalEarned)*100).toFixed(1):"0"}% rate`, up:true },
    { label:"Avg ROI",      value:`${avgRoi}%`,     icon:BarChart2,  color:T.blue,   sub:bestMonth?`Best: ${bestMonth.month}`:"N/A", up:parseFloat(avgRoi)>=0 },
    { label:"Net Income",   value:fmt(netIncome),   icon:Activity,   color:netIncome>=0?T.green:T.red,
      sub:`${totalEarned>0?((netIncome/totalEarned)*100).toFixed(1):"0"}% margin`, up:netIncome>=0 },
  ];

  const emptyState = (
    <div style={{height:220,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}>
      <div style={{fontSize:36,opacity:0.2}}>📈</div>
      <div style={{fontSize:13,color:T.textMut}}>Add entries to see performance data</div>
    </div>
  );

  return (
    <MasterPasscodeGuard isDark={isDark}>
      <PageTransition>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Outfit:wght@400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{background:${T.bg};color:${T.textPri}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:99px}
        option{background:${T.card};color:${T.textPri}}
        .kc{transition:transform 0.2s ease,box-shadow 0.2s ease;}
        .kc:hover{transform:translateY(-2px);}
        .chart-btn{transition:all 0.15s;cursor:pointer;}
        .chart-btn:hover{opacity:0.8;}
      `}</style>

      <div style={{display:"flex",minHeight:"100vh",background:T.bg,
        fontFamily:"'Outfit','Segoe UI',sans-serif",color:T.textPri}}>

        <Sidebar isDark={isDark} setIsDark={setIsDark}/>

        <div style={{marginLeft:230,flex:1,display:"flex",flexDirection:"column"}}>

          {/* TOP BAR */}
          <div style={{padding:"1rem 2rem",display:"flex",alignItems:"center",
            justifyContent:"space-between",borderBottom:`1px solid ${T.border}`,
            background:isDark?"rgba(8,8,8,0.85)":"rgba(242,242,240,0.9)",
            backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:40}}>
            <div>
              <div style={{fontSize:10,color:T.textMut,fontWeight:700,
                letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:2}}>Analytics</div>
              <div style={{fontSize:20,fontWeight:900,letterSpacing:"-0.03em"}}>Performance</div>
            </div>
            {/* Mode + Chart toggles */}
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <div style={{display:"flex",background:T.pill,borderRadius:10,padding:3,border:`1px solid ${T.border}`}}>
                {(["web2","web3"] as const).map(m=>(
                  <button key={m} onClick={()=>setPerfMode(m)} className="chart-btn"
                    style={{padding:"6px 14px",borderRadius:7,border:"none",cursor:"pointer",
                      fontFamily:"inherit",fontSize:11,fontWeight:700,transition:"all 0.15s",
                      background:perfMode=== m?T.yellow:"transparent",
                      color:perfMode=== m?"#000":T.textMut}}>
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
              <div style={{display:"flex",background:T.pill,borderRadius:10,padding:3,border:`1px solid ${T.border}`}}>
                {(["bar","line","radar"] as const).map(c=>(
                  <button key={c} onClick={()=>setChartType(c)} className="chart-btn"
                    style={{padding:"6px 12px",borderRadius:7,border:"none",cursor:"pointer",
                      fontFamily:"inherit",fontSize:11,fontWeight:700,transition:"all 0.15s",
                      background:chartType===c?T.yellow:"transparent",
                      color:chartType===c?"#000":T.textMut}}>
                    {c.charAt(0).toUpperCase()+c.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div style={{padding:"1.5rem 2rem 4rem",flex:1,animation:"slideUp 0.4s ease"}}>

            {/* Metric cards */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"1rem",marginBottom:"1.5rem"}}>
              {metrics.map((m,i)=>(
                <div key={m.label} className="kc" style={{
                  background:i===0?T.yellow:T.card,
                  borderRadius:20,padding:"1.5rem",
                  border:`1px solid ${i===0?"transparent":T.border}`,
                }}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                    <span style={{fontSize:9,fontWeight:700,letterSpacing:"0.08em",
                      textTransform:"uppercase",color:i===0?"rgba(0,0,0,0.4)":T.textMut}}>
                      {m.label}
                    </span>
                    <m.icon size={14} color={i===0?"rgba(0,0,0,0.5)":m.color}/>
                  </div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:"1.55rem",
                    fontWeight:700,color:i===0?"#000":m.color,letterSpacing:"-0.03em",lineHeight:1,marginBottom:8}}>
                    {m.value}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    {m.up?<ArrowUpRight size={11} color={i===0?"rgba(0,0,0,0.4)":T.green}/>
                         :<ArrowDownRight size={11} color={T.red}/>}
                    <span style={{fontSize:11,color:i===0?"rgba(0,0,0,0.4)":T.textMut,fontWeight:600}}>
                      {m.sub}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr",gap:"1rem",marginBottom:"1rem"}}>

              {/* Main chart */}
              <div className="kc" style={{background:T.card,borderRadius:20,padding:"1.5rem",border:`1px solid ${T.border}`,display:"flex",flexDirection:"column"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:800,color:T.textPri}}>
                      {chartType==="bar"?"Monthly Breakdown":chartType==="line"?"ROI Trend":"Radar Overview"}
                    </div>
                    <div style={{fontSize:11,color:T.textMut,marginTop:2}}>
                      {activeData.length} active months
                    </div>
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

                {activeData.length>0?(
                  <div style={{flex:1,minHeight:250}}>
                    {chartType==="bar"&&(
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={perfData} barCategoryGap="38%" barGap={2}>
                          <CartesianGrid strokeDasharray="2 5" stroke={isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.06)"} vertical={false}/>
                          <XAxis dataKey="month" tick={{fill:T.textMut,fontSize:10}} axisLine={false} tickLine={false}/>
                          <YAxis tick={{fill:T.textMut,fontSize:10}} axisLine={false} tickLine={false}
                            tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} width={34}/>
                          <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,fontSize:12,color:T.textPri}}
                            formatter={(v:any)=>[fmt(Number(v))]}/>
                          <Bar dataKey="earned" name="Earned" fill={T.yellow} radius={[4,4,0,0]}/>
                          <Bar dataKey="saved" name="Saved" fill={T.green} radius={[4,4,0,0]}/>
                          <Bar dataKey="given" name="Given" fill={T.red} radius={[4,4,0,0]}/>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    {chartType==="line"&&(
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={perfData}>
                          <defs>
                            <linearGradient id="gROI" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={T.blue} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={T.blue} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="2 5" stroke={isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.06)"} vertical={false}/>
                          <XAxis dataKey="month" tick={{fill:T.textMut,fontSize:10}} axisLine={false} tickLine={false}/>
                          <YAxis tick={{fill:T.textMut,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`}/>
                          <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,fontSize:12,color:T.textPri}}/>
                          <Area type="monotone" dataKey="roi" stroke={T.blue} strokeWidth={3} fillOpacity={1} fill="url(#gROI)"/>
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                    {chartType==="radar"&&(
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={perfData}>
                          <PolarGrid stroke={isDark?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.08)"}/>
                          <PolarAngleAxis dataKey="month" tick={{fill:T.textMut,fontSize:9}}/>
                          <Radar name="ROI" dataKey="roi" stroke={T.yellow} fill={T.yellow} fillOpacity={0.5}/>
                          <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,fontSize:12,color:T.textPri}}/>
                        </RadarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                ):(emptyState)}
              </div>

              {/* Pie chart */}
              <div className="kc" style={{background:T.card,borderRadius:20,padding:"1.5rem",border:`1px solid ${T.border}`,display:"flex",flexDirection:"column"}}>
                <div style={{fontSize:13,fontWeight:800,color:T.textPri,marginBottom:"1rem"}}>Allocation</div>
                {catData.length>0?(
                  <div style={{flex:1,display:"flex",flexDirection:"column"}}>
                    <div style={{height:180}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={catData} innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value">
                            {catData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color}/>)}
                          </Pie>
                          <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,fontSize:12,color:T.textPri}}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:8}}>
                      {catData.map(c=>(
                        <div key={c.name} style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{width:8,height:8,borderRadius:2,background:c.color}}/>
                            <span style={{fontSize:11,color:T.textSec,fontWeight:600}}>{c.name}</span>
                          </div>
                          <span style={{fontSize:11,fontWeight:700,color:T.textPri}}>{fmt(c.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ):(emptyState)}
              </div>
            </div>
          </div>
        </div>
      </div>
      </PageTransition>
    </MasterPasscodeGuard>
  );
}
