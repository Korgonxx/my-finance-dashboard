"use client";
import { useEntries } from "../../lib/hooks/useEntries";
import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { TrendingUp, BarChart2, Activity, Target, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useWeb3 } from "../context/Web3Context";

const BRAND = "#C8FF00";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const PIE_COLORS = [BRAND, "#FF6B6B", "#818CF8", "#34D399", "#F59E0B", "#06B6D4"];

export default function PerformancePage() {
  const { isWeb3, mode } = useWeb3();
  const [chartType, setChartType] = useState<"bar"|"area"|"line">("bar");

  const { web2Entries, web3Entries } = useEntries(isWeb3);
  const entries = isWeb3 ? web3Entries : web2Entries;

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
  const avgRoi = activeData.length > 0 ? (activeData.reduce((s,d) => s+d.roi,0)/activeData.length).toFixed(1) : "0.0";
  const bestMonth = activeData.reduce((b,d) => d.roi>(b?.roi??-Infinity)?d:b, activeData[0]);
  const netIncome = totalEarned - totalGiven;

  const catMap: Record<string,number> = {};
  entries.forEach(e => { catMap[e.givenTo||"Other"] = (catMap[e.givenTo||"Other"]||0)+e.given; });
  const catData = Object.entries(catMap).slice(0,6).map(([name, value],i) => ({ name, value, color: PIE_COLORS[i%PIE_COLORS.length] }));

  const fmt = (n: number) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

  const ChartComponent = chartType === 'area' ? AreaChart : chartType === 'line' ? LineChart : BarChart;

  const customTooltipStyle = { background:'#161618', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)', color:'#fff', padding:'10px 14px' };

  return (
    <div className="bg-[#080809] min-h-screen text-white font-sans">
      {/* Header */}
      <div className="border-b border-white/5 px-4 md:px-8 py-5">
        <h1 className="text-lg font-bold text-white">Performance Analytics</h1>
        <p className="text-xs text-white/25 mt-0.5">{mode === 'banks' ? 'Banking' : 'Crypto'} · {entries.length} transactions</p>
      </div>

      <div className="p-4 md:p-8 space-y-6 pb-24 md:pb-8">

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label:'Total Earned', value: fmt(totalEarned), sub:`+${totalEarned>0?((totalSaved/totalEarned)*100).toFixed(0):0}% saved`, color:'#34D399', icon: ArrowDownRight },
            { label:'Total Spent',  value: fmt(totalGiven),  sub: totalEarned>0?`${((totalGiven/totalEarned)*100).toFixed(0)}% of income`:'—', color:'#FF6B6B', icon: ArrowUpRight },
            { label:'Net Income',   value: fmt(netIncome),   sub: netIncome>=0?'Positive balance':'Negative balance', color: netIncome>=0?BRAND:'#FF6B6B', icon: TrendingUp },
            { label:'Avg ROI',      value: `${avgRoi}%`,     sub: bestMonth?`Best: ${bestMonth.month}`:'No data yet', color:'#818CF8', icon: Target },
          ].map((s,i) => (
            <div key={i} className="bg-[#0E0E11] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-white/30 uppercase tracking-wider">{s.label}</p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:`${s.color}15` }}>
                  <s.icon size={14} style={{ color:s.color }}/>
                </div>
              </div>
              <p className="text-2xl font-bold mb-1" style={{ color:s.color }}>{s.value}</p>
              <p className="text-xs text-white/25">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Main chart */}
        <div className="bg-[#0E0E11] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-bold text-white">Monthly Overview</p>
            <div className="flex gap-1 bg-white/4 rounded-lg p-1">
              {(['bar','area','line'] as const).map(t => (
                <button key={t} onClick={() => setChartType(t)}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all"
                  style={{ background: chartType===t ? BRAND : 'transparent', color: chartType===t ? '#000' : 'rgba(255,255,255,0.3)' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={perfData} margin={{top:10,right:0,left:-20,bottom:0}}>
                  <defs>
                    <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={BRAND} stopOpacity={0.3}/><stop offset="95%" stopColor={BRAND} stopOpacity={0}/></linearGradient>
                    <linearGradient id="givenGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.3}/><stop offset="95%" stopColor="#FF6B6B" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize:11,fill:'rgba(255,255,255,0.25)',fontWeight:600}} dy={10}/>
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize:11,fill:'rgba(255,255,255,0.25)'}} tickFormatter={fmt}/>
                  <Tooltip contentStyle={customTooltipStyle}/>
                  <Area type="monotone" dataKey="earned" stroke={BRAND} fill="url(#earnGrad)" strokeWidth={2} dot={false}/>
                  <Area type="monotone" dataKey="given" stroke="#FF6B6B" fill="url(#givenGrad)" strokeWidth={2} dot={false}/>
                </AreaChart>
              ) : chartType === 'line' ? (
                <LineChart data={perfData} margin={{top:10,right:0,left:-20,bottom:0}}>
                  <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize:11,fill:'rgba(255,255,255,0.25)',fontWeight:600}} dy={10}/>
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize:11,fill:'rgba(255,255,255,0.25)'}} tickFormatter={fmt}/>
                  <Tooltip contentStyle={customTooltipStyle}/>
                  <Line type="monotone" dataKey="earned" stroke={BRAND} strokeWidth={2.5} dot={{ fill:BRAND, r:4 }} activeDot={{ r:6 }}/>
                  <Line type="monotone" dataKey="given" stroke="#FF6B6B" strokeWidth={2.5} dot={{ fill:'#FF6B6B', r:4 }} activeDot={{ r:6 }}/>
                  <Line type="monotone" dataKey="saved" stroke="#818CF8" strokeWidth={2} strokeDasharray="4 2" dot={false}/>
                </LineChart>
              ) : (
                <BarChart data={perfData} margin={{top:10,right:0,left:-20,bottom:0}} barSize={20}>
                  <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize:11,fill:'rgba(255,255,255,0.25)',fontWeight:600}} dy={10}/>
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize:11,fill:'rgba(255,255,255,0.25)'}} tickFormatter={fmt}/>
                  <Tooltip contentStyle={customTooltipStyle}/>
                  <Bar dataKey="earned" fill={BRAND} radius={[6,6,0,0]}/>
                  <Bar dataKey="given" fill="rgba(255,107,107,0.7)" radius={[6,6,0,0]}/>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-5 mt-3">
            <div className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm inline-block" style={{background:BRAND}}/><span className="text-xs text-white/30">Income</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm inline-block bg-[#FF6B6B]/70"/><span className="text-xs text-white/30">Expenses</span></div>
            {chartType==='line' && <div className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm inline-block bg-[#818CF8]"/><span className="text-xs text-white/30">Saved</span></div>}
          </div>
        </div>

        {/* ROI + Breakdown row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ROI bar */}
          <div className="bg-[#0E0E11] border border-white/5 rounded-2xl p-5">
            <p className="text-sm font-bold text-white mb-5">Savings ROI by Month</p>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perfData} margin={{top:5,right:0,left:-30,bottom:0}} barSize={14}>
                  <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize:10,fill:'rgba(255,255,255,0.25)',fontWeight:600}} dy={8}/>
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize:10,fill:'rgba(255,255,255,0.25)'}} tickFormatter={v=>`${v}%`}/>
                  <Tooltip contentStyle={customTooltipStyle} formatter={(v:any) => [`${v}%`, 'ROI']}/>
                  <Bar dataKey="roi" radius={[4,4,0,0]}>
                    {perfData.map((d,i) => <Cell key={i} fill={d.roi>0?BRAND:'rgba(255,107,107,0.5)'}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category breakdown */}
          <div className="bg-[#0E0E11] border border-white/5 rounded-2xl p-5">
            <p className="text-sm font-bold text-white mb-5">Spending by Category</p>
            {catData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-white/20">
                <p className="text-sm">No spending data yet</p>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-40 h-40 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={catData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value" stroke="none">
                        {catData.map((d,i) => <Cell key={i} fill={d.color}/>)}
                      </Pie>
                      <Tooltip contentStyle={customTooltipStyle} formatter={(v:any) => [`$${Number(v).toLocaleString()}`, '']}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2.5 min-w-0">
                  {catData.map((d,i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:d.color }}/>
                      <span className="text-xs text-white/50 truncate flex-1">{d.name}</span>
                      <span className="text-xs font-bold text-white/70">{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Monthly table */}
        <div className="bg-[#0E0E11] border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <p className="text-sm font-bold text-white">Monthly Breakdown</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Month','Income','Expenses','Saved','ROI'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {perfData.filter(d => d.earned > 0 || d.given > 0 || d.saved > 0).map((d, i) => (
                  <tr key={d.month} className={`border-b border-white/4 hover:bg-white/2 transition-all ${i%2===0?'':'bg-white/[0.01]'}`}>
                    <td className="px-5 py-3.5 font-semibold text-white/70">{d.month}</td>
                    <td className="px-5 py-3.5 font-bold" style={{ color:BRAND }}>{fmt(d.earned)}</td>
                    <td className="px-5 py-3.5 font-bold text-[#FF6B6B]">{fmt(d.given)}</td>
                    <td className="px-5 py-3.5 font-bold text-[#818CF8]">{fmt(d.saved)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${d.roi>0?'text-emerald-400 bg-emerald-400/10':'text-white/30 bg-white/5'}`}>
                        {d.roi}%
                      </span>
                    </td>
                  </tr>
                ))}
                {activeData.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-white/20 text-sm">No performance data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}