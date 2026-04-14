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
import { MasterPasscodeGuard } from "../components/MasterPasscodeGuard";
import { Sidebar, THEME } from "../components/Sidebar";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function PerformancePage() {
  const { isWeb3, mode } = useWeb3();
  const [isDark, setIsDark] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [perfMode, setPerfMode] = useState<"web2"|"web3">(mode === "web3" ? "web3" : "web2");
  const [chartType, setChartType] = useState<"bar"|"line"|"radar">("bar");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ledger_theme");
      setIsDark(saved ? saved === "dark" : true);
    } catch { setIsDark(true); }
    setHydrated(true);
  }, []);

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
      <>
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
                      background:(hydrated?perfMode:"")=== m?T.yellow:"transparent",
                      color:(hydrated?perfMode:"")=== m?"#000":T.textMut}}>
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
              <div className="kc" style={{background:T.card,borderRadius:20,padding:"1.5rem",border:`1px solid ${T.border}`}}>
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
                  <>
                    {chartType==="bar"&&(
                      <ResponsiveContainer width="100%" height={230}>
                        <BarChart data={perfData} barCategoryGap="38%" barGap={2}>
                          <CartesianGrid strokeDasharray="2 5" stroke={isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.06)"} vertical={false}/>
                          <XAxis dataKey="month" tick={{fill:T.textMut,fontSize:10}} axisLine={false} tickLine={false}/>
                          <YAxis tick={{fill:T.textMut,fontSize:10}} axisLine={false} tickLine={false}
                            tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} width={34}/>
                          <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,fontSize:12,color:T.textPri}}
                            formatter={(v:any)=>[fmt(Number(v))]}/>
                          <Bar dataKey="earned" name="Earned" fill={T.yellow} radius={[5,5,0,0]}/>
                          <Bar dataKey="saved"  name="Saved"  fill={T.green}  radius={[5,5,0,0]}/>
                          <Bar dataKey="given"  name="Given"  fill={T.red}    radius={[5,5,0,0]}/>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    {chartType==="line"&&(
                      <ResponsiveContainer width="100%" height={230}>
                        <LineChart data={perfData}>
                          <CartesianGrid strokeDasharray="2 5" stroke={isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.06)"} vertical={false}/>
                          <XAxis dataKey="month" tick={{fill:T.textMut,fontSize:10}} axisLine={false} tickLine={false}/>
                          <YAxis tick={{fill:T.textMut,fontSize:10}} axisLine={false} tickLine={false}
                            tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} width={34}/>
                          <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,fontSize:12,color:T.textPri}}
                            formatter={(v:any)=>[fmt(Number(v))]}/>
                          <Line type="monotone" dataKey="earned" name="Earned" stroke={T.yellow} strokeWidth={2.5}
                            dot={{r:3,fill:T.yellow,strokeWidth:0}} activeDot={{r:5}}/>
                          <Line type="monotone" dataKey="saved"  name="Saved"  stroke={T.green}  strokeWidth={2.5}
                            dot={{r:3,fill:T.green,strokeWidth:0}}  activeDot={{r:5}}/>
                          <Line type="monotone" dataKey="given"  name="Given"  stroke={T.red}    strokeWidth={2.5}
                            dot={{r:3,fill:T.red,strokeWidth:0}}    activeDot={{r:5}}/>
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                    {chartType==="radar"&&(
                      <ResponsiveContainer width="100%" height={230}>
                        <RadarChart data={activeData}>
                          <PolarGrid stroke={isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)"}/>
                          <PolarAngleAxis dataKey="month" tick={{fill:T.textMut,fontSize:10}}/>
                          <Radar name="Earned" dataKey="earned" stroke={T.yellow} fill={T.yellow} fillOpacity={0.18}/>
                          <Radar name="Saved"  dataKey="saved"  stroke={T.green}  fill={T.green}  fillOpacity={0.15}/>
                          <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,fontSize:12,color:T.textPri}}
                            formatter={(v:any)=>[fmt(Number(v))]}/>
                        </RadarChart>
                      </ResponsiveContainer>
                    )}
                  </>
                ):emptyState}
              </div>

              {/* Category donut */}
              <div className="kc" style={{background:T.green,borderRadius:20,padding:"1.5rem"}}>
                <div style={{fontSize:13,fontWeight:800,color:"#000",marginBottom:4}}>By Category</div>
                <div style={{fontSize:11,color:"rgba(0,0,0,0.45)",marginBottom:"1rem"}}>Income breakdown</div>
                {catData.length>0?(
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={catData} cx="50%" cy="50%" outerRadius={70} innerRadius={32}
                          dataKey="value" labelLine={false}>
                          {catData.map((_,i)=><Cell key={i} fill={["#000","rgba(0,0,0,0.7)","rgba(0,0,0,0.5)","rgba(0,0,0,0.35)","rgba(0,0,0,0.2)"][i%5]}/>)}
                        </Pie>
                        <Tooltip contentStyle={{background:"#fff",border:"none",borderRadius:10,fontSize:12,color:"#000"}}
                          formatter={(v:any)=>[fmt(Number(v))]}/>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:8}}>
                      {catData.slice(0,4).map((c,i)=>(
                        <div key={c.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <div style={{width:6,height:6,borderRadius:2,
                              background:["#000","rgba(0,0,0,0.7)","rgba(0,0,0,0.5)","rgba(0,0,0,0.3)"][i]}}/>
                            <span style={{fontSize:11,color:"rgba(0,0,0,0.6)",fontWeight:600}}>{c.name}</span>
                          </div>
                          <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:700,color:"#000"}}>{fmt(c.value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ):(
                  <div style={{height:200,display:"flex",alignItems:"center",justifyContent:"center",
                    color:"rgba(0,0,0,0.3)",fontSize:13}}>No categories yet</div>
                )}
              </div>
            </div>

            {/* ROI trend */}
            <div className="kc" style={{background:T.card,borderRadius:20,padding:"1.5rem",border:`1px solid ${T.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:800,color:T.textPri}}>ROI Trend</div>
                  <div style={{fontSize:11,color:T.textMut,marginTop:2}}>Save rate per month (%)</div>
                </div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:22,fontWeight:700,color:T.yellow}}>
                  {avgRoi}%
                </div>
              </div>
              {activeData.length>0?(
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={perfData}>
                    <defs>
                      <linearGradient id="roi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={T.yellow} stopOpacity={0.2}/>
                        <stop offset="100%" stopColor={T.yellow} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 5" stroke={isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.06)"} vertical={false}/>
                    <XAxis dataKey="month" tick={{fill:T.textMut,fontSize:10}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:T.textMut,fontSize:10}} axisLine={false} tickLine={false}
                      tickFormatter={v=>`${v}%`} width={34}/>
                    <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,fontSize:12,color:T.textPri}}
                      formatter={(v:any)=>[`${v}%`,"ROI"]}/>
                    <Area type="monotone" dataKey="roi" stroke={T.yellow} strokeWidth={2.5}
                      fill="url(#roi)" dot={{r:3,fill:T.yellow,strokeWidth:0}} activeDot={{r:5}}/>
                  </AreaChart>
                </ResponsiveContainer>
              ):emptyState}
            </div>
          </div>
        </div>
      </div>
      </>
    </MasterPasscodeGuard>
  );
}