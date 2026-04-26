"use client";
import { useEntries } from "../../lib/hooks/useEntries";
import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import {
  TrendingUp, BarChart2, Activity, Target, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import { useAppSettings } from "../context/AppSettingsContext";
import { MasterPasscodeGuard } from "../components/MasterPasscodeGuard";
import { Sidebar, THEME } from "../components/Sidebar";
import { PageTransition } from "../components/PageTransition";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function PerformancePage() {
  // FIX: Use Web3Context mode directly instead of duplicating state
  const { isWeb3, mode, setMode } = useWeb3();
  const { isDark, setIsDark } = useAppSettings();
  const [chartType, setChartType] = useState<"bar" | "line" | "radar">("bar");

  const T = isDark ? THEME.dark : THEME.light;

  // FIX: Pass isWeb3 from context — updates automatically when mode changes
  const { web2Entries, web3Entries } = useEntries(isWeb3);
  const entries = isWeb3 ? web3Entries : web2Entries;

  const perfMode = mode; // alias for readability

  const perfData = MONTHS.map(month => {
    const me = entries.filter(e => MONTHS[new Date(e.date).getMonth()] === month);
    const earned = me.reduce((s, e) => s + e.earned, 0);
    const saved  = me.reduce((s, e) => s + e.saved, 0);
    const given  = me.reduce((s, e) => s + e.given, 0);
    const roi    = earned > 0 ? parseFloat(((saved / earned) * 100).toFixed(1)) : 0;
    return { month, earned, saved, given, roi };
  });

  const activeData = perfData.filter(d => d.earned > 0 || d.saved > 0);

  const totalEarned = entries.reduce((s, e) => s + e.earned, 0);
  const totalSaved  = entries.reduce((s, e) => s + e.saved, 0);
  const totalGiven  = entries.reduce((s, e) => s + e.given, 0);
  const avgRoi = activeData.length > 0
    ? (activeData.reduce((s, d) => s + d.roi, 0) / activeData.length).toFixed(1)
    : "0.0";
  const bestMonth = activeData.reduce((best, d) => d.roi > (best?.roi ?? -Infinity) ? d : best, activeData[0]);
  const netIncome = totalEarned - totalGiven;

  const catMap: Record<string, number> = {};
  entries.forEach(e => { catMap[e.givenTo || "Other"] = (catMap[e.givenTo || "Other"] || 0) + e.earned; });
  const catColors = [T.yellow, T.green, T.blue, T.purple, T.red];
  const catData = Object.entries(catMap).map(([name, value], i) => ({
    name, value, color: catColors[i % catColors.length]
  }));

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <MasterPasscodeGuard isDark={isDark}>
      <PageTransition>
        <style>{`
          .bento-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
          .bento-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
        `}</style>

        <div style={{ display: "flex", minHeight: "100vh", background: T.bg, fontFamily: "'Outfit', sans-serif", color: T.textPri }}>
          <Sidebar isDark={isDark} setIsDark={setIsDark} />

          <main style={{ marginLeft: 80, flex: 1, padding: "2.5rem 3rem", maxWidth: 1400, margin: "0 auto", width: "calc(100% - 80px)" }}>

            {/* Header */}
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem" }}>
              <div>
                <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 8 }}>
                  Performance
                </h1>
                {/* FIX: Mode buttons now use Web3Context setMode to keep global state in sync */}
                <div style={{ display: "flex", gap: 12 }}>
                  {(["banks", "crypto"] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      style={{
                        padding: "8px 20px", borderRadius: 99, border: "none", fontSize: 13, fontWeight: 700,
                        background: perfMode === m ? T.textPri : T.pill,
                        color: perfMode === m ? T.bg : T.textSec,
                        cursor: "pointer", transition: "all 0.2s"
                      }}>
                      {m.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ display: "flex", background: T.pill, borderRadius: 16, padding: 4 }}>
                  {(["bar", "line", "radar"] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setChartType(type)}
                      style={{
                        padding: "8px 16px", borderRadius: 12, border: "none", fontSize: 12, fontWeight: 700,
                        background: chartType === type ? T.yellow : "transparent",
                        color: chartType === type ? "#000" : T.textSec,
                        cursor: "pointer", transition: "all 0.2s"
                      }}>
                      {type.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </header>

            {/* Bento Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "1.5rem", gridAutoRows: "minmax(160px, auto)" }}>

              {/* Metrics */}
              {[
                { label: "Total Earned", value: fmt(totalEarned), icon: TrendingUp, color: T.yellow, sub: `${entries.length} entries` },
                { label: "Savings Rate", value: `${totalEarned > 0 ? ((totalSaved / totalEarned) * 100).toFixed(1) : "0"}%`, icon: Target, color: T.green, sub: fmt(totalSaved) },
                { label: "Avg ROI", value: `${avgRoi}%`, icon: BarChart2, color: T.blue, sub: bestMonth ? `Best: ${bestMonth.month}` : "N/A" },
                { label: "Net Margin", value: `${totalEarned > 0 ? ((netIncome / totalEarned) * 100).toFixed(1) : "0"}%`, icon: Activity, color: netIncome >= 0 ? T.green : T.red, sub: fmt(netIncome) }
              ].map((m, i) => (
                <div key={i} className="bento-card" style={{
                  gridColumn: "span 3", background: T.card, borderRadius: 32, padding: "1.5rem",
                  border: `1px solid ${T.border}`, display: "flex", flexDirection: "column", justifyContent: "space-between"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `${m.color}20`, display: "flex", alignItems: "center", justifyContent: "center", color: m.color }}>
                      <m.icon size={20} />
                    </div>
                    <ArrowUpRight size={16} color={T.textMut} />
                  </div>
                  <div style={{ marginTop: "1rem" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>{m.value}</div>
                    <div style={{ fontSize: 12, color: T.textMut, marginTop: 4 }}>{m.sub}</div>
                  </div>
                </div>
              ))}

              {/* Main Chart Card */}
              <div className="bento-card" style={{
                gridColumn: "span 8", gridRow: "span 3", background: T.card, borderRadius: 32,
                padding: "2.5rem", border: `1px solid ${T.border}`
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>Growth Analytics</h3>
                    <p style={{ fontSize: 13, color: T.textSec }}>
                      {chartType === "bar" ? "Monthly financial distribution" : "Performance trends over time"}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    {[{ c: T.yellow, l: "Earned" }, { c: T.green, l: "Saved" }, { c: T.red, l: "Given" }].map(x => (
                      <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 3, background: x.c }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: T.textSec }}>{x.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ height: 380 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === "bar" ? (
                      <BarChart data={perfData} barCategoryGap="35%" barGap={6}>
                        <CartesianGrid strokeDasharray="0" stroke={T.border} vertical={false} />
                        <XAxis dataKey="month" tick={{ fill: T.textMut, fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip cursor={{ fill: T.pill }} contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16 }} />
                        <Bar dataKey="earned" fill={T.yellow} radius={[8, 8, 8, 8]} />
                        <Bar dataKey="saved" fill={T.green} radius={[8, 8, 8, 8]} />
                        <Bar dataKey="given" fill={T.red} radius={[8, 8, 8, 8]} />
                      </BarChart>
                    ) : chartType === "line" ? (
                      <AreaChart data={perfData}>
                        <defs>
                          <linearGradient id="colorEarned" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={T.yellow} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={T.yellow} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="0" stroke={T.border} vertical={false} />
                        <XAxis dataKey="month" tick={{ fill: T.textMut, fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16 }} />
                        <Area type="monotone" dataKey="earned" stroke={T.yellow} strokeWidth={4} fillOpacity={1} fill="url(#colorEarned)" />
                        <Area type="monotone" dataKey="saved" stroke={T.green} strokeWidth={4} fill="transparent" />
                      </AreaChart>
                    ) : (
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={perfData}>
                        <PolarGrid stroke={T.border} />
                        <PolarAngleAxis dataKey="month" tick={{ fill: T.textMut, fontSize: 11 }} />
                        <Radar name="Earned" dataKey="earned" stroke={T.yellow} fill={T.yellow} fillOpacity={0.4} />
                        <Radar name="Saved" dataKey="saved" stroke={T.green} fill={T.green} fillOpacity={0.4} />
                      </RadarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Breakdown Card */}
              <div className="bento-card" style={{
                gridColumn: "span 4", gridRow: "span 3", background: T.card, borderRadius: 32,
                padding: "2.5rem", border: `1px solid ${T.border}`
              }}>
                <div style={{ marginBottom: "2rem" }}>
                  <h3 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>Categories</h3>
                  <p style={{ fontSize: 13, color: T.textSec }}>Distribution of income sources</p>
                </div>
                {catData.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 280, color: T.textMut }}>
                    <Activity size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                    <div style={{ fontSize: 14 }}>No data yet</div>
                  </div>
                ) : (
                  <>
                    <div style={{ height: 220, marginBottom: "2rem" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={catData} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                            {catData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {catData.slice(0, 4).map((cat, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 3, background: cat.color }} />
                            <span style={{ fontSize: 14, fontWeight: 600, color: T.textSec }}>{cat.name}</span>
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 800 }}>{fmt(cat.value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

            </div>
          </main>
        </div>
      </PageTransition>
    </MasterPasscodeGuard>
  );
}