"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell,
} from "recharts";
import {
  TrendingUp, BarChart2, PieChart as PieIcon, Activity,
  Sun, Moon, ArrowUpRight, ArrowDownLeft, Target,
  LayoutDashboard, Wallet, CreditCard, ArrowLeft,
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import { useAppSettings } from "../context/AppSettingsContext";
import { MasterPasscodeGuard } from "../components/MasterPasscodeGuard";
import { BottomToolsBar } from "../components/BottomToolsBar";

const DARK = {
  bg: "#06080f",
  card: "rgba(255,255,255,0.032)",
  border: "rgba(255,255,255,0.075)",
  primary: "#00c9a7",
  violet: "#8b5cf6",
  rose: "#f43f5e",
  blue: "#60a5fa",
  amber: "#f59e0b",
  textPri: "#f0f4ff",
  textSec: "rgba(240,244,255,0.5)",
  textMut: "rgba(240,244,255,0.28)",
  shadow: "0 32px 80px rgba(0,0,0,0.8)",
  headerBg: "rgba(6,8,15,0.82)",
  chartGrid: "rgba(255,255,255,0.04)",
  btnGhost: "rgba(255,255,255,0.05)",
};

const LIGHT = {
  bg: "#f0f4f8",
  card: "rgba(255,255,255,0.85)",
  border: "rgba(0,0,0,0.08)",
  primary: "#009d82",
  violet: "#7c3aed",
  rose: "#e11d48",
  blue: "#2563eb",
  amber: "#d97706",
  textPri: "#0d1117",
  textSec: "rgba(13,17,23,0.6)",
  textMut: "rgba(13,17,23,0.38)",
  shadow: "0 32px 80px rgba(0,0,0,0.12)",
  headerBg: "rgba(240,244,248,0.9)",
  chartGrid: "rgba(0,0,0,0.05)",
  btnGhost: "rgba(0,0,0,0.04)",
};

const glassCard = (T: typeof DARK, extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 16,
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  ...extra,
});

export default function PerformanceMetrics() {
  const { mode, setMode } = useWeb3();
  const { hideBalances } = useAppSettings();
  const defaultMode = mode === "web3" ? "web3" : "web2";
  const [isDark, setIsDark] = useState(true);
  const [performanceMode, setPerformanceMode] = useState<"web2" | "web3">(defaultMode);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ledger_theme");
      setIsDark(saved ? saved === "dark" : true);
    } catch {
      setIsDark(true);
    }
  }, []);

  const T = isDark ? DARK : LIGHT;

  const bgStyle: React.CSSProperties = {
    background: isDark
      ? `radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,201,167,0.07) 0%, transparent 55%), radial-gradient(ellipse 60% 45% at 85% 90%, rgba(139,92,246,0.06) 0%, transparent 55%), ${T.bg}`
      : `radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,157,130,0.08) 0%, transparent 55%), radial-gradient(ellipse 60% 45% at 85% 90%, rgba(124,58,237,0.05) 0%, transparent 55%), ${T.bg}`,
  };

  // Web2 Performance Data
  const web2PerformanceData = [
    { month: "Jan", roi: 2.5, earned: 2400, saved: 2210 },
    { month: "Feb", roi: 3.2, earned: 2210, saved: 2290 },
    { month: "Mar", roi: 2.8, earned: 2290, saved: 2000 },
    { month: "Apr", roi: 4.1, earned: 2000, saved: 2181 },
    { month: "May", roi: 3.5, earned: 2181, saved: 2500 },
    { month: "Jun", roi: 5.2, earned: 2500, saved: 2100 },
  ];

  // Web3 Performance Data (with higher volatility typical of crypto)
  const web3PerformanceData = [
    { month: "Jan", roi: 5.2, earned: 4200, saved: 1100 },
    { month: "Feb", roi: -2.1, earned: 1800, saved: 800 },
    { month: "Mar", roi: 8.5, earned: 5200, saved: 1200 },
    { month: "Apr", roi: 12.3, earned: 7500, saved: 1800 },
    { month: "May", roi: 6.8, earned: 4100, saved: 1500 },
    { month: "Jun", roi: 15.7, earned: 9200, saved: 2100 },
  ];

  // Web2 Category Performance
  const web2CategoryPerformance = [
    { name: "Salary", value: 50, color: T.primary },
    { name: "Bonuses", value: 25, color: T.blue },
    { name: "Side Income", value: 15, color: T.violet },
    { name: "Other", value: 10, color: T.rose },
  ];

  // Web3 Category Performance
  const web3CategoryPerformance = [
    { name: "Trading", value: 45, color: T.primary },
    { name: "Staking", value: 30, color: T.violet },
    { name: "Farming", value: 15, color: T.blue },
    { name: "Other", value: 10, color: T.rose },
  ];

  // Web2 Metrics
  const web2MetricsData = [
    {
      label: "Total ROI",
      value: "21.3%",
      icon: TrendingUp,
      color: T.primary,
      change: "+2.1%",
    },
    {
      label: "Monthly Avg",
      value: "3.55%",
      icon: BarChart2,
      color: T.violet,
      change: "+0.3%",
    },
    {
      label: "Best Month",
      value: "5.2%",
      icon: Target,
      color: T.amber,
      change: "Jun 2024",
    },
    {
      label: "Consistency",
      value: "95%",
      icon: Activity,
      color: T.blue,
      change: "Very Stable",
    },
  ];

  // Web3 Metrics
  const web3MetricsData = [
    {
      label: "Total ROI",
      value: "46.4%",
      icon: TrendingUp,
      color: T.primary,
      change: "+8.2%",
    },
    {
      label: "Monthly Avg",
      value: "7.73%",
      icon: BarChart2,
      color: T.violet,
      change: "+2.1%",
    },
    {
      label: "Best Month",
      value: "15.7%",
      icon: Target,
      color: T.amber,
      change: "Jun 2024",
    },
    {
      label: "Volatility",
      value: "8.5%",
      icon: Activity,
      color: T.rose,
      change: "Moderate",
    },
  ];

  const performanceData = performanceMode === "web2" ? web2PerformanceData : web3PerformanceData;
  const categoryPerformance = performanceMode === "web2" ? web2CategoryPerformance : web3CategoryPerformance;
  const metricsData = performanceMode === "web2" ? web2MetricsData : web3MetricsData;

  return (
    <MasterPasscodeGuard isDark={isDark}>
      <>
        <style suppressHydrationWarning>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&family=Geist:wght@400;500;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @keyframes slideUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; } }
          @media (max-width: 768px) {
            body { font-size: 14px; }
            h1 { font-size: 1.5rem; }
            h2 { font-size: 1.2rem; }
          }
        `}</style>

        <div style={{ minHeight: "100vh", ...bgStyle, fontFamily: "'Geist','Segoe UI',sans-serif", color: T.textPri }}>
          {/* Header */}
          <header
            style={{
              position: "sticky",
              top: 0,
              zIndex: 40,
              borderBottom: `1px solid ${T.border}`,
              background: T.headerBg,
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              padding: "1rem 1rem",
            }}
          >
            <div
              style={{
                maxWidth: 1380,
                margin: "0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <Link
                  href="/"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "0.5rem 1rem",
                    borderRadius: 8,
                    textDecoration: "none",
                    color: T.textMut,
                    background: T.btnGhost,
                    border: `1px solid ${T.border}`,
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  <ArrowLeft size={14} /> Back
                </Link>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, fontFamily: "'Syne',sans-serif" }}>
                  Performance Metrics
                </h1>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                {/* Web2/Web3 Toggle */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: T.btnGhost,
                    border: `1px solid ${T.border}`,
                    borderRadius: 8,
                    padding: "0.25rem",
                  }}
                >
                  <button
                    onClick={() => setPerformanceMode("web2")}
                    style={{
                      padding: "0.4rem 0.8rem",
                      borderRadius: 6,
                      border: "none",
                      background: performanceMode === "web2" ? T.primary : "transparent",
                      color: performanceMode === "web2" ? (isDark ? "#021a14" : "#fff") : T.textMut,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                      transition: "all 0.2s",
                    }}
                  >
                    <CreditCard size={12} style={{ display: "inline", marginRight: 4 }} />
                    Web2
                  </button>
                  <button
                    onClick={() => setPerformanceMode("web3")}
                    style={{
                      padding: "0.4rem 0.8rem",
                      borderRadius: 6,
                      border: "none",
                      background: performanceMode === "web3" ? T.primary : "transparent",
                      color: performanceMode === "web3" ? (isDark ? "#021a14" : "#fff") : T.textMut,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                      transition: "all 0.2s",
                    }}
                  >
                    <Wallet size={12} style={{ display: "inline", marginRight: 4 }} />
                    Web3
                  </button>
                </div>

                <button
                  onClick={() => setIsDark(!isDark)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "0.5rem 1rem",
                    borderRadius: 8,
                    background: isDark ? T.amber + "15" : T.violet + "15",
                    border: `1px solid ${isDark ? T.amber + "44" : T.violet + "44"}`,
                    color: isDark ? T.amber : T.violet,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "inherit",
                  }}
                >
                  {isDark ? <Sun size={14} /> : <Moon size={14} />}
                  {isDark ? "Light" : "Dark"}
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main
            style={{
              maxWidth: 1380,
              margin: "0 auto",
              padding: "2rem 1rem 6rem 1rem",
            }}
          >
            {/* KPI Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
                marginBottom: "2rem",
              }}
            >
              {metricsData.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div key={metric.label} style={{ ...glassCard(T, { padding: "1.5rem" }) }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: T.textMut, marginBottom: 4 }}>{metric.label}</div>
                        <div suppressHydrationWarning style={{ fontSize: "1.75rem", fontWeight: 700, color: metric.color }}>
                          {hideBalances ? "****" : metric.value}
                        </div>
                      </div>
                      <Icon size={24} style={{ color: metric.color, opacity: 0.5 }} />
                    </div>
                    <div style={{ fontSize: 12, color: metric.color, fontWeight: 600 }}>
                      {metric.change}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Charts Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem", marginBottom: "2rem" }}>
              {/* ROI Trend */}
              <div style={{ ...glassCard(T, { padding: "1.5rem" }) }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
                  <TrendingUp size={16} style={{ color: T.primary }} />
                  ROI Trend
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.chartGrid} />
                    <XAxis dataKey="month" stroke={T.textMut} style={{ fontSize: 12 }} />
                    <YAxis stroke={T.textMut} style={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: T.card,
                        border: `1px solid ${T.border}`,
                        borderRadius: 8,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="roi"
                      stroke={T.primary}
                      strokeWidth={2}
                      dot={{ fill: T.primary, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Performance Distribution */}
              <div style={{ ...glassCard(T, { padding: "1.5rem" }) }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
                  <PieIcon size={16} style={{ color: T.violet }} />
                  Performance Distribution
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryPerformance}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: T.card,
                        border: `1px solid ${T.border}`,
                        borderRadius: 8,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Performance */}
            <div style={{ ...glassCard(T, { padding: "1.5rem" }) }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
                <BarChart2 size={16} style={{ color: T.blue }} />
                Monthly Performance
              </h2>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorEarned" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={T.primary} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={T.primary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={T.blue} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={T.blue} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.chartGrid} />
                  <XAxis dataKey="month" stroke={T.textMut} style={{ fontSize: 12 }} />
                  <YAxis stroke={T.textMut} style={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: T.card,
                      border: `1px solid ${T.border}`,
                      borderRadius: 8,
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="earned"
                    stroke={T.primary}
                    fillOpacity={1}
                    fill="url(#colorEarned)"
                  />
                  <Area
                    type="monotone"
                    dataKey="saved"
                    stroke={T.blue}
                    fillOpacity={1}
                    fill="url(#colorSaved)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </main>
        </div>

        <BottomToolsBar isDark={isDark} setIsDark={setIsDark} />
      </>
    </MasterPasscodeGuard>
  );
}
