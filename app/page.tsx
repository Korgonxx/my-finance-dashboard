"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import {
  Heart, Gift, Users, Star, Briefcase, Plus, Edit2, Trash2,
  X, Target, DollarSign, PiggyBank, HandHeart, ChevronDown,
  Download, FileSpreadsheet, FileText, CheckCircle, Zap,
  Link, AlertCircle, ExternalLink, Sun, Moon,
  BarChart2, TrendingUp, PieChart as PieIcon, Activity,
  Wallet, Coins, Send, Copy, CreditCard, LayoutDashboard,
  Eye, EyeOff,
} from "lucide-react";
import { useWeb3 } from "./context/Web3Context";
import { useEntries, useGoal } from "@/lib/hooks/useEntries";
import { useAppSettings, CURRENCY_SYMBOLS, type Currency } from "./context/AppSettingsContext";
import { MasterPasscodeGuard } from "./components/MasterPasscodeGuard";
import { BottomToolsBar } from "./components/BottomToolsBar";
import { CloudSyncModal } from "./components/CloudSyncModal";
import { loadDashboardState, saveDashboardState } from "./lib/cloudSync";

/* ─── THEME TOKENS ─────────────────────────────────────────────────── */

const DARK = {
  bg:        "#06080f",
  card:      "rgba(255,255,255,0.032)",
  border:    "rgba(255,255,255,0.075)",
  borderHov: "rgba(255,255,255,0.14)",
  primary:   "#00c9a7",
  amber:     "#f59e0b",
  violet:    "#8b5cf6",
  rose:      "#f43f5e",
  blue:      "#60a5fa",
  textPri:   "#f0f4ff",
  textSec:   "rgba(240,244,255,0.5)",
  textMut:   "rgba(240,244,255,0.28)",
  glow:      "rgba(0,0,0,0.8)",
  shadow:    "0 32px 80px rgba(0,0,0,0.8)",
  headerBg:  "rgba(6,8,15,0.82)",
  chartGrid: "rgba(255,255,255,0.04)",
  btnGhost:  "rgba(255,255,255,0.05)",
  inputBg:   "rgba(255,255,255,0.04)",
  selectBg:  "rgba(6,8,15,0.85)",
  modalBg:   "linear-gradient(145deg, #0f1623, #0a0f1a)",
  tooltipBg: "rgba(6,8,15,0.96)",
  tableRow:  "rgba(255,255,255,0.008)",
  tableHov:  "rgba(0,201,167,0.03)",
  tagBg:     "rgba(255,255,255,0.03)",
};

const LIGHT = {
  bg:        "#f0f4f8",
  card:      "rgba(255,255,255,0.85)",
  border:    "rgba(0,0,0,0.08)",
  borderHov: "rgba(0,0,0,0.18)",
  primary:   "#009d82",
  amber:     "#d97706",
  violet:    "#7c3aed",
  rose:      "#e11d48",
  blue:      "#2563eb",
  textPri:   "#0d1117",
  textSec:   "rgba(13,17,23,0.6)",
  textMut:   "rgba(13,17,23,0.38)",
  glow:      "rgba(0,0,0,0.15)",
  shadow:    "0 32px 80px rgba(0,0,0,0.12)",
  headerBg:  "rgba(240,244,248,0.9)",
  chartGrid: "rgba(0,0,0,0.05)",
  btnGhost:  "rgba(0,0,0,0.04)",
  inputBg:   "rgba(0,0,0,0.04)",
  selectBg:  "rgba(255,255,255,0.95)",
  modalBg:   "linear-gradient(145deg, #ffffff, #f3f4f6)",
  tooltipBg: "rgba(255,255,255,0.98)",
  tableRow:  "rgba(0,0,0,0.018)",
  tableHov:  "rgba(0,157,130,0.04)",
  tagBg:     "rgba(0,0,0,0.03)",
};

/* ─── CONSTANTS ────────────────────────────────────────────────────── */

const CATEGORIES: Record<string, { icon: React.ElementType; color: string }> = {
  Family:  { icon: Users,       color: "#8b5cf6" },
  Charity: { icon: Heart,       color: "#f43f5e" },
  Gift:    { icon: Gift,        color: "#f59e0b" },
  Self:    { icon: Star,        color: "#00c9a7" },
  Work:    { icon: Briefcase,   color: "#60a5fa" },
  Other:   { icon: CheckCircle, color: "#94a3b8" },
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const CHART_TYPES = [
  { id: "bar",   icon: BarChart2,  label: "Bar"   },
  { id: "line",  icon: TrendingUp, label: "Line"  },
  { id: "pie",   icon: PieIcon,    label: "Pie"   },
  { id: "radar", icon: Activity,   label: "Radar" },
] as const;
type ChartType = typeof CHART_TYPES[number]["id"];

const NETWORKS = ["Ethereum", "Polygon", "BSC", "Arbitrum", "Optimism", "Base"];

const SEED_DATA = [
  { id:"1", date:"2025-01-15", project:"Brand Identity — Nexus Co.",    earned:3200, saved:960,  given:320, givenTo:"Charity", walletAddress:"", walletName:"" },
  { id:"2", date:"2025-02-03", project:"UI Kit — Waveform App",         earned:1800, saved:540,  given:180, givenTo:"Family",  walletAddress:"", walletName:"" },
  { id:"3", date:"2025-03-22", project:"Dashboard — FinFlow",           earned:4500, saved:1350, given:450, givenTo:"Charity", walletAddress:"", walletName:"" },
  { id:"4", date:"2025-04-10", project:"Logo Suite — Terra Labs",       earned:2100, saved:630,  given:210, givenTo:"Gift",    walletAddress:"", walletName:"" },
  { id:"5", date:"2025-05-05", project:"Motion Pack — Bloom Studio",    earned:2800, saved:840,  given:280, givenTo:"Self",    walletAddress:"", walletName:"" },
  { id:"6", date:"2025-06-18", project:"Rebrand — Cobalt Systems",      earned:5200, saved:1560, given:520, givenTo:"Charity", walletAddress:"0x71C7656EC7ab88b098defB751B7401B5f6d8976F", walletName:"Main Wallet", investmentAmount:2500, currentValue:4250 },
  { id:"7", date:"2025-07-29", project:"App Screens — Lumos Health",    earned:3600, saved:1080, given:360, givenTo:"Family",  walletAddress:"0x3A76Bff1aA3c56E9f0E96c8B23B3a61B3f0c21D", walletName:"DeFi Wallet", investmentAmount:1800, currentValue:2100 },
  { id:"8", date:"2025-08-14", project:"Icon Set — Meridian Bank",      earned:1500, saved:450,  given:150, givenTo:"Gift",    walletAddress:"", walletName:"" },
  { id:"9", date:"2025-09-08", project:"Web Design — Arcadia Foods",    earned:3900, saved:1170, given:390, givenTo:"Charity", walletAddress:"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", walletName:"Trading Wallet", investmentAmount:3200, currentValue:3840 },
  { id:"a", date:"2025-10-20", project:"Pitch Deck — Vertex AI",        earned:4800, saved:1440, given:480, givenTo:"Work",    walletAddress:"", walletName:"" },
  { id:"b", date:"2025-11-11", project:"Brand Book — Solaris Tech",     earned:6100, saved:1830, given:610, givenTo:"Charity", walletAddress:"0x71C7656EC7ab88b098defB751B7401B5f6d8976F", walletName:"Main Wallet", investmentAmount:4000, currentValue:5200 },
  { id:"c", date:"2025-12-05", project:"Year-End Retainer Fee",         earned:2200, saved:660,  given:220, givenTo:"Family",  walletAddress:"", walletName:"" },
];

const SEED_DATA_WEB2 = SEED_DATA.filter(e => !e.walletAddress).map(e => ({ ...e, mode: "web2" as const }));
const SEED_DATA_WEB3 = SEED_DATA.filter(e => e.walletAddress).map(e => ({ ...e, mode: "web3" as const }));

interface Entry {
  id: string; date: string; project: string;
  earned: number; saved: number; given: number; givenTo: string;
  walletAddress?: string; walletName?: string;
  mode: "web2" | "web3";
  investmentAmount?: number; // Web3: initial investment
  currentValue?: number; // Web3: current value
}

/* ─── HELPERS ──────────────────────────────────────────────────────── */

const uid   = () => Math.random().toString(36).slice(2, 9);
const pct   = (a: number, b: number) => b > 0 ? ((a / b) * 100).toFixed(1) : "0.0";
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
const shortAddr = (addr: string) => addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";
const GOAL_CURRENCIES: Currency[] = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "INR"];

function getGoogleSheetId(raw: string) {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.hostname.includes("docs.google.com")) {
      const parts = url.pathname.split("/").filter(Boolean);
      const idx = parts.indexOf("d");
      if (idx !== -1 && parts.length > idx + 1) return parts[idx + 1];
    }
  } catch {}
  const match = value.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

function buildMonthly(entries: Entry[]) {
  const map: Record<string, { month:string; earned:number; saved:number; given:number }> = {};
  MONTHS.forEach(m => { map[m] = { month:m, earned:0, saved:0, given:0 }; });
  entries.forEach(({ date, earned, saved, given }) => {
    const m = MONTHS[new Date(date).getMonth()];
    if (m) { map[m].earned += earned; map[m].saved += saved; map[m].given += given; }
  });
  return Object.values(map);
}

function buildCumulative(entries: Entry[]) {
  const sorted = [...entries].sort((a,b) => new Date(a.date).getTime()-new Date(b.date).getTime());
  let cum = 0;
  return sorted.map(e => { cum += e.earned; return { date:e.date.slice(0,7), cumulative:cum }; });
}

/* ─── ANIMATED COUNTER ─────────────────────────────────────────────── */

function useCounter(target: number, duration = 900) {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * ease));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return val;
}

/* ─── GLASS CARD ───────────────────────────────────────────────────── */

const glassCard = (T: typeof DARK, extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 16,
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  ...extra,
});

/* ─── METRIC CARD ──────────────────────────────────────────────────── */

function MetricCard({ icon:Icon, label, rawValue, isPercent, sub, accent, index, T, fmt }: {
  icon:React.ElementType; label:string; rawValue:number; isPercent?:boolean;
  sub:string; accent:string; index:number; T:typeof DARK; fmt:(n:number)=>string;
}) {
  const counted = useCounter(rawValue, 700 + index * 100);
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ ...glassCard(T, {
        padding:"1.5rem 1.75rem", position:"relative", overflow:"hidden",
        border:`1px solid ${hov ? accent+"55" : T.border}`,
        transition:"border-color 0.3s, transform 0.3s, box-shadow 0.3s",
        transform: hov ? "translateY(-3px)" : "none",
        boxShadow: hov ? `0 16px 48px ${accent}22` : "none",
        cursor:"default",
      }) }}>
      <div style={{ position:"absolute", top:"-40%", right:"-20%", width:130, height:130, borderRadius:"50%",
        background:`radial-gradient(circle, ${accent}20 0%, transparent 70%)`, pointerEvents:"none" }} />
      <div style={{ position:"absolute", top:0, left:"12%", right:"12%", height:2, borderRadius:999,
        background:`linear-gradient(90deg, transparent, ${accent}, transparent)`,
        opacity: hov ? 0.9 : 0.3, transition:"opacity 0.3s" }} />
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"1rem" }}>
        <span style={{ fontSize:11, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:T.textMut }}>{label}</span>
        <div style={{ width:36, height:36, borderRadius:10, background:`${accent}18`, border:`1px solid ${accent}30`,
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Icon size={16} style={{ color:accent }} />
        </div>
      </div>
      <div style={{ fontFamily:"'DM Mono','Fira Mono',monospace", fontSize:"1.9rem", fontWeight:700,
        color:T.textPri, letterSpacing:"-0.03em", lineHeight:1 }}>
        {isPercent ? `${counted}%` : fmt(counted)}
      </div>
      {sub && <div style={{ fontSize:12, color:T.textMut, marginTop:"0.5rem" }}>{sub}</div>}
    </div>
  );
}

/* ─── CATEGORY PILL ────────────────────────────────────────────────── */

function Pill({ cat }: { cat: string }) {
  const m = CATEGORIES[cat] || CATEGORIES.Other;
  const I = m.icon;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px 3px 7px",
      borderRadius:999, background:`${m.color}16`, border:`1px solid ${m.color}30`,
      fontSize:11, fontWeight:700, color:m.color, letterSpacing:"0.04em", textTransform:"uppercase", whiteSpace:"nowrap" }}>
      <I size={10} />{cat}
    </span>
  );
}

/* ─── NETWORK BADGE ─────────────────────────────────────────────────── */

const NETWORK_COLORS: Record<string, string> = {
  Ethereum: "#627eea", Polygon: "#8247e5", BSC: "#f0b90b",
  Arbitrum: "#28a0f0", Optimism: "#ff0420", Base: "#0052ff",
};

function NetworkBadge({ network }: { network: string }) {
  const color = NETWORK_COLORS[network] || "#94a3b8";
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 8px",
      borderRadius:999, background:`${color}18`, border:`1px solid ${color}33`,
      fontSize:10, fontWeight:700, color, letterSpacing:"0.05em", textTransform:"uppercase" }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:color }} />
      {network}
    </span>
  );
}

/* ─── CUSTOM TOOLTIP ────────────────────────────────────────────────── */

function ChartTip({ active, payload, label, T, fmt }: {
  active?:boolean; payload?:Array<{ name:string; value:number; color:string }>;
  label?:string; T:typeof DARK; fmt:(n:number)=>string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:T.tooltipBg, border:`1px solid ${T.border}`,
      borderRadius:12, padding:"10px 14px", fontSize:12, minWidth:140,
      boxShadow:`0 8px 24px ${T.glow}` }}>
      <div style={{ color:T.textMut, marginBottom:8, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase", fontSize:10 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, marginBottom:3 }}>
          <span style={{ display:"flex", alignItems:"center", gap:5, color:T.textSec }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:p.color, display:"inline-block" }} />
            {p.name}
          </span>
          <span style={{ fontFamily:"'DM Mono','Fira Mono',monospace", color:T.textPri, fontWeight:600 }}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── FORM FIELD ────────────────────────────────────────────────────── */

function Field({ label, type="text", value, onChange, placeholder, T, mono, ...rest }: {
  label:string; type?:string; value:string|number;
  onChange:(e:React.ChangeEvent<HTMLInputElement>)=>void;
  placeholder?:string; T:typeof DARK; mono?:boolean;
  [k:string]:unknown;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div>
      <div style={{ fontSize:11, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:T.textMut }}>{label}</div>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ marginTop:6, width:"100%", boxSizing:"border-box",
          background: focus ? `${T.primary}0a` : T.inputBg,
          border:`1px solid ${focus ? T.primary+"66" : T.border}`,
          borderRadius:10, padding:"0.6rem 0.9rem", color:T.textPri, fontSize:14,
          outline:"none", transition:"all 0.2s",
          fontFamily: mono ? "'DM Mono','Fira Mono',monospace" : "inherit" }} />
    </div>
  );
}

function SelectF({ label, value, onChange, options, T }: {
  label:string; value:string; onChange:(e:React.ChangeEvent<HTMLSelectElement>)=>void;
  options:string[]; T:typeof DARK;
}) {
  return (
    <div>
      <div style={{ fontSize:11, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", color:T.textMut }}>{label}</div>
      <div style={{ marginTop:6, position:"relative" }}>
        <select value={value} onChange={onChange}
          style={{ width:"100%", appearance:"none", background:T.selectBg,
            border:`1px solid ${T.border}`, borderRadius:10,
            padding:"0.6rem 2rem 0.6rem 0.9rem", color:T.textPri,
            fontSize:14, outline:"none", cursor:"pointer", fontFamily:"inherit" }}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={13} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", color:T.textMut, pointerEvents:"none" }} />
      </div>
    </div>
  );
}

/* ─── MODAL WRAPPER ─────────────────────────────────────────────────── */

function Modal({ children, onClose, width=520, T }: {
  children:React.ReactNode; onClose:()=>void; width?:number; T:typeof DARK;
}) {
  useEffect(() => {
    const h = (e:KeyboardEvent) => { if (e.key==="Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:100,
      background: T===DARK ? "rgba(0,0,0,0.72)" : "rgba(0,0,0,0.45)",
      backdropFilter:"blur(6px)", WebkitBackdropFilter:"blur(6px)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
      <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:width,
        background:T.modalBg, border:`1px solid ${T.border}`, borderRadius:20,
        padding:"2rem", boxShadow:T.shadow, animation:"slideUp 0.22s cubic-bezier(0.16,1,0.3,1)",
        maxHeight:"90vh", overflowY:"auto" }}>
        {children}
      </div>
    </div>
  );
}

/* ─── ENTRY MODAL ───────────────────────────────────────────────────── */

const EMPTY_FORM = { date:"", project:"", earned:"", saved:"", given:"", givenTo:"Charity", walletAddress:"", walletName:"", investmentAmount:"", currentValue:"" };
type FormState = typeof EMPTY_FORM & { id?:string };

function EntryModal({ initial, onSave, onClose, T, isWeb3 }: {
  initial?:Partial<FormState>; onSave:(e:Entry)=>void; onClose:()=>void;
  T:typeof DARK; isWeb3:boolean;
}) {
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, ...initial });
  const set = (k:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]:e.target.value }));
  const isEdit = Boolean(initial?.id);
  const submit = () => {
    if (!form.date || !form.project || !form.earned) return;
    const baseEntry = {
      id: form.id || uid(),
      date: form.date,
      project: form.project,
      earned: +form.earned || 0,
      saved: +form.saved || 0,
      given: +form.given || 0,
      givenTo: form.givenTo,
      walletAddress: form.walletAddress,
      walletName: form.walletName,
      mode: isWeb3 ? "web3" as const : "web2" as const,
    };
    
    const entry: Entry = {
      ...baseEntry,
      ...(isWeb3 && form.investmentAmount ? {
        investmentAmount: +form.investmentAmount,
        currentValue: +form.currentValue || +form.investmentAmount,
      } : {}),
    };
    
    onSave(entry);
  };
  const hasEarned = parseFloat(form.earned as string) > 0;

  const labels = isWeb3
    ? { project:"Description", earned:"Received ($)", saved:"Saved ($)", given:"Sent ($)" }
    : { project:"Project Name", earned:"Earned ($)", saved:"Saved ($)", given:"Given ($)" };

  return (
    <Modal onClose={onClose} width={540} T={T}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.75rem" }}>
        <div>
          <h2 style={{ margin:0, color:T.textPri, fontSize:"1.1rem", fontWeight:700 }}>
            {isEdit ? "Edit Entry" : "New Entry"}
          </h2>
          <p style={{ margin:"4px 0 0", color:T.textMut, fontSize:13 }}>
            {isEdit ? "Update transaction details" : `Record a new ${isWeb3?"transaction":"project"}`}
          </p>
        </div>
        <button onClick={onClose} style={{ background:T.btnGhost, border:`1px solid ${T.border}`,
          borderRadius:8, padding:6, cursor:"pointer", color:T.textMut, display:"flex" }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ display:"grid", gap:"1.1rem" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
          <Field label="Date" type="date" value={form.date} onChange={set("date")} T={T} />
          <SelectF label="Category" value={form.givenTo} onChange={set("givenTo")} options={Object.keys(CATEGORIES)} T={T} />
        </div>

        <Field label={labels.project} value={form.project} onChange={set("project")}
          placeholder={isWeb3 ? "e.g. ETH transfer to exchange" : "e.g. Brand Identity — Client Name"} T={T} />

        {/* Web3: wallet fields */}
        {isWeb3 && (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
              <Field label="Wallet Address (optional)" value={form.walletAddress??""} onChange={set("walletAddress")}
                placeholder="0x..." T={T} mono />
              <Field label="Wallet Name (optional)" value={form.walletName??""} onChange={set("walletName")}
                placeholder="e.g. Main Wallet" T={T} />
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
              <Field label="Investment Amount ($)" type="number" value={form.investmentAmount??""} onChange={set("investmentAmount")}
                placeholder="e.g. 1000" T={T} />
              <Field label="Current Value ($)" type="number" value={form.currentValue??""} onChange={set("currentValue")}
                placeholder="e.g. 1200" T={T} />
            </div>
          </>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0.75rem" }}>
          <Field label={labels.earned} type="number" value={form.earned} onChange={set("earned")} placeholder="0" T={T} />
          <Field label={labels.saved}  type="number" value={form.saved}  onChange={set("saved")}  placeholder="0" T={T} />
          <Field label={labels.given}  type="number" value={form.given}  onChange={set("given")}  placeholder="0" T={T} />
        </div>
      </div>

      {hasEarned && (
        <div style={{ marginTop:"1.25rem", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
          {[
            { label: isWeb3 ? "Stake Rate" : "Save Rate", val:pct(+form.saved,+form.earned)+"%", color:T.primary },
            { label: isWeb3 ? "Send Rate"  : "Give Rate", val:pct(+form.given,+form.earned)+"%", color:T.rose },
          ].map(r => (
            <div key={r.label} style={{ background:T.tagBg, borderRadius:10, padding:"10px 14px", border:`1px solid ${r.color}22` }}>
              <div style={{ fontSize:10, color:T.textMut, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em" }}>{r.label}</div>
              <div style={{ fontFamily:"'DM Mono','Fira Mono',monospace", fontSize:"1.05rem", fontWeight:700, color:r.color, marginTop:3 }}>{r.val}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:"flex", justifyContent:"flex-end", gap:"0.75rem", marginTop:"1.75rem",
        paddingTop:"1.5rem", borderTop:`1px solid ${T.border}` }}>
        <button onClick={onClose} style={{ background:T.btnGhost, border:`1px solid ${T.border}`,
          borderRadius:10, padding:"0.6rem 1.2rem", color:T.textSec, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>
          Cancel
        </button>
        <button onClick={submit} style={{ background:`linear-gradient(135deg, ${T.primary}, ${T.primary}cc)`,
          border:"none", borderRadius:10, padding:"0.6rem 1.4rem", color:T===DARK?"#021a14":"#fff",
          fontSize:14, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontFamily:"inherit" }}>
          <CheckCircle size={15} /> {isEdit ? "Update" : "Save Entry"}
        </button>
      </div>
    </Modal>
  );
}

/* ─── DELETE MODAL ──────────────────────────────────────────────────── */

function DeleteModal({ entry, onConfirm, onClose, T }: {
  entry:Entry; onConfirm:()=>void; onClose:()=>void; T:typeof DARK;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");

  const handleDelete = () => {
    if (confirmText.trim().toLowerCase() !== entry?.project?.toLowerCase()) {
      setError("Project name doesn't match");
      return;
    }
    onConfirm();
  };

  return (
    <Modal onClose={onClose} width={450} T={T}>
      <div style={{ textAlign:"center", padding:"0.5rem" }}>
        <div style={{ width:56, height:56, borderRadius:"50%", background:"rgba(244,63,94,0.12)",
          border:"1px solid rgba(244,63,94,0.25)", display:"flex", alignItems:"center",
          justifyContent:"center", margin:"0 auto 1.25rem" }}>
          <Trash2 size={22} style={{ color:T.rose }} />
        </div>
        <h2 style={{ color:T.textPri, fontSize:"1.05rem", fontWeight:700, margin:"0 0 8px" }}>Delete Entry?</h2>
        <p style={{ color:T.textSec, fontSize:13, marginBottom:"0.4rem" }}>{entry?.project}</p>
        <p style={{ color:T.textMut, fontSize:13, marginBottom:"1rem" }}>This cannot be undone.</p>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontSize: 12, color: T.textPri, marginBottom: 8, textAlign: "left" }}>
            Type the project name to confirm deletion:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => {
              setConfirmText(e.target.value);
              setError("");
            }}
            placeholder="Enter project name..."
            style={{
              width: "100%",
              background: T.inputBg,
              border: `2px solid ${error ? "#f43f5e" : T.border}`,
              borderRadius: 8,
              padding: "0.75rem",
              color: T.textPri,
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
            }}
            autoFocus
          />
          {error && (
            <p style={{ color: "#f43f5e", fontSize: 12, margin: "4px 0 0 0", textAlign: "left" }}>
              {error}
            </p>
          )}
        </div>

        <div style={{ display:"flex", gap:"0.75rem", justifyContent:"center" }}>
          <button onClick={onClose} style={{ background:T.btnGhost, border:`1px solid ${T.border}`,
            borderRadius:10, padding:"0.6rem 1.25rem", color:T.textSec, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!confirmText.trim() || confirmText.trim().toLowerCase() !== entry?.project?.toLowerCase()}
            style={{
              background: confirmText.trim() && confirmText.trim().toLowerCase() === entry?.project?.toLowerCase()
                ? "linear-gradient(135deg, #be123c, #f43f5e)"
                : T.btnGhost,
              border:"none",
              borderRadius:10,
              padding:"0.6rem 1.4rem",
              color: confirmText.trim() && confirmText.trim().toLowerCase() === entry?.project?.toLowerCase()
                ? "#fff"
                : T.textMut,
              fontSize:14,
              fontWeight:700,
              cursor: confirmText.trim() && confirmText.trim().toLowerCase() === entry?.project?.toLowerCase()
                ? "pointer"
                : "not-allowed",
              display:"flex",
              alignItems:"center",
              gap:7,
              fontFamily:"inherit"
            }}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── GOOGLE SHEETS HOOK ────────────────────────────────────────────── */

const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

function useGSheets() {
  const [status, setStatus]     = useState<"idle"|"loading"|"authed"|"importing"|"exporting"|"done"|"error">("idle");
  const [sheetUrl, setSheetUrl] = useState<string|null>(null);
  const [errMsg, setErrMsg]     = useState<string|null>(null);
  const tokenRef  = useRef<string|null>(null);
  const clientRef = useRef<{ requestAccessToken:()=>void }|null>(null);

  const loadGIS = () => new Promise<void>((res,rej) => {
    if ((window as unknown as { google?:unknown }).google) { res(); return; }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.onload = () => res(); s.onerror = () => rej();
    document.head.appendChild(s);
  });

  const authorize = useCallback(async (clientId:string) => {
    try {
      setStatus("loading"); setErrMsg(null);
      await loadGIS();
      const google = (window as unknown as { google:{ accounts:{ oauth2:{ initTokenClient:(opts:unknown)=>{ requestAccessToken:()=>void } } } } }).google;
      clientRef.current = google.accounts.oauth2.initTokenClient({
        client_id: clientId, scope: SCOPES,
        callback: (resp:{ error?:string; access_token?:string }) => {
          if (resp.error) { setStatus("error"); setErrMsg(resp.error); return; }
          tokenRef.current = resp.access_token || null;
          setStatus("authed");
        },
      });
      clientRef.current.requestAccessToken();
    } catch(e) { setStatus("error"); setErrMsg(String(e)); }
  }, []);

  const pushToSheets = useCallback(async (entries:Entry[], goal:number) => {
    if (!tokenRef.current) return;
    setStatus("exporting");
    try {
      const strCell = (s:string|number) => ({ userEnteredValue:{ stringValue:String(s) } });
      const numCell = (n:number) => ({ userEnteredValue:{ numberValue:n }, userEnteredFormat:{ numberFormat:{ type:"CURRENCY", pattern:"$#,##0" } } });
      const boldRow = (vals:string[]) => ({ values: vals.map(v => ({ ...strCell(v), userEnteredFormat:{ textFormat:{ bold:true } } })) });
      const sorted = [...entries].sort((a,b) => new Date(a.date).getTime()-new Date(b.date).getTime());
      const totE = entries.reduce((s,e)=>s+e.earned,0);
      const totS = entries.reduce((s,e)=>s+e.saved,0);
      const totG = entries.reduce((s,e)=>s+e.given,0);
      const res = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
        method:"POST",
        headers:{ "Authorization":`Bearer ${tokenRef.current}`, "Content-Type":"application/json" },
        body: JSON.stringify({
          properties:{ title:`Finance Dashboard — ${new Date().toLocaleDateString("en-US",{month:"long",year:"numeric"})}` },
          sheets:[{ properties:{ title:"Transactions", sheetId:0 },
            data:[{ rowData:[
              boldRow(["Date","Project/Description","Earned/Received","Saved/Staked","Given/Sent","Category","Wallet Address","Wallet Name"]),
              ...sorted.map(e => ({ values:[
                strCell(e.date), strCell(e.project),
                numCell(e.earned), numCell(e.saved), numCell(e.given),
                strCell(e.givenTo),
                strCell(e.walletAddress||""), strCell(e.walletName||""),
              ]})),
              { values:[] },
              boldRow(["Summary",""]),
              { values:[strCell("Total Earned/Assets"), numCell(totE)] },
              { values:[strCell("Total Saved/Staked"),  numCell(totS)] },
              { values:[strCell("Total Given/Sent"),    numCell(totG)] },
              { values:[strCell("Yearly Goal"),          numCell(goal)] },
            ]}],
          }],
        }),
      });
      const data = await res.json();
      if (data.spreadsheetId) { setSheetUrl(`https://docs.google.com/spreadsheets/d/${data.spreadsheetId}`); setStatus("done"); }
      else throw new Error(data.error?.message || "Failed");
    } catch(e) { setStatus("error"); setErrMsg(String(e)); }
  }, []);

  const pullFromSheets = useCallback(async (sheetId:string): Promise<{ entries: Entry[]; goal: number | null }> => {
    if (!tokenRef.current) return { entries: [], goal: null };
    setStatus("importing");
    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/Transactions!A2:H1000?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`,
        { headers: { Authorization: `Bearer ${tokenRef.current}` } },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || JSON.stringify(data));
      const rows = (data.values ?? []) as Array<Array<string|number>>;
      const imported: Entry[] = [];
      let goalValue: number | null = null;
      for (const row of rows) {
        const first = String(row[0] ?? "").trim();
        if (!first) break;
        const normalized = first.toLowerCase();
        if (normalized === "summary" || normalized.startsWith("total ") || normalized.includes("goal")) {
          if (normalized.includes("goal") && row[1] !== undefined) {
            goalValue = Number(row[1]) || goalValue;
          }
          break;
        }
        imported.push({
          id: uid(),
          date: String(row[0] ?? ""),
          project: String(row[1] ?? ""),
          earned: Number(row[2] ?? 0),
          saved: Number(row[3] ?? 0),
          given: Number(row[4] ?? 0),
          givenTo: String(row[5] ?? ""),
          walletAddress: String(row[6] ?? ""),
          walletName: String(row[7] ?? ""),
          mode: "web2",
        });
      }
      setStatus("done");
      return { entries: imported, goal: goalValue };
    } catch(e) {
      setStatus("error"); setErrMsg(String(e));
      return { entries: [], goal: null };
    }
  }, []);

  const reset = useCallback(() => { setStatus("idle"); setSheetUrl(null); setErrMsg(null); }, []);
  return { status, sheetUrl, errMsg, authorize, pushToSheets, pullFromSheets, reset };
}

/* ─── EXPORT MODAL ──────────────────────────────────────────────────── */

function ExportModal({ entries, goal, onClose, onCsv, onImport, isWeb3, T }: {
  entries:Entry[]; goal:number; onClose:()=>void; onCsv:()=>void; onImport:(entries:Entry[], goal?:number)=>void; isWeb3:boolean; T:typeof DARK;
}) {
  const { status, sheetUrl, errMsg, authorize, pushToSheets, pullFromSheets, reset } = useGSheets();
  const [clientId, setClientId] = useState(() => { try { return localStorage.getItem("goog_cid")||""; } catch { return ""; } });
  const [view, setView] = useState<"choose"|"sheets"|"import">("choose");
  const [sheetAction, setSheetAction] = useState<"export"|"import"|null>(null);
  const [sheetIdInput, setSheetIdInput] = useState("");
  const [importedCount, setImportedCount] = useState<number|null>(null);
  const [importGoal, setImportGoal] = useState<number | null>(null);
  const [pendingSheetId, setPendingSheetId] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authed" || !sheetAction) return;
    if (sheetAction === "export") {
      pushToSheets(entries, goal);
      setSheetAction(null);
      return;
    }
    if (sheetAction === "import" && pendingSheetId) {
      pullFromSheets(pendingSheetId).then(result => {
        if (result.entries.length) {
          const importedMode: Entry["mode"] = isWeb3 ? "web3" : "web2";
          const imported = result.entries.map(e => ({ ...e, mode: importedMode }));
          onImport(imported, result.goal ?? undefined);
          setImportedCount(imported.length);
          setImportGoal(result.goal);
        }
        setSheetAction(null);
      });
    }
  }, [status, sheetAction, pendingSheetId, pullFromSheets, pushToSheets, entries, goal, isWeb3, onImport]);

  const handleConnect = () => {
    if (!clientId.trim()) return;
    try { localStorage.setItem("goog_cid",clientId); } catch {}
    setSheetAction("export");
    authorize(clientId);
  };

  const handleImport = () => {
    const sheetId = getGoogleSheetId(sheetIdInput);
    if (!sheetId) return;
    setPendingSheetId(sheetId);
    setSheetAction("import");
    if (!clientId.trim()) return;
    try { localStorage.setItem("goog_cid",clientId); } catch {}
    authorize(clientId);
  };

  const isLoading = status==="loading"||status==="authed"||status==="exporting"||status==="importing";

  return (
    <Modal onClose={onClose} width={460} T={T}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.5rem" }}>
        <div>
          <h2 style={{ margin:0, color:T.textPri, fontSize:"1.05rem", fontWeight:700 }}>Export Data</h2>
          <p style={{ margin:"4px 0 0", color:T.textMut, fontSize:13 }}>{entries.length} entries ready</p>
        </div>
        <button onClick={onClose} style={{ background:T.btnGhost, border:`1px solid ${T.border}`,
          borderRadius:8, padding:6, cursor:"pointer", color:T.textMut, display:"flex" }}>
          <X size={16} />
        </button>
      </div>

      {view==="choose" && (
        <div style={{ display:"grid", gap:"0.75rem" }}>
          {[
            { label:"Download as CSV", sub:"Works with Excel, Numbers & Google Sheets", icon:FileText, color:T.amber, action:()=>{ onCsv(); onClose(); } },
            { label:"Push to Google Sheets", sub:"Creates a formatted sheet in your Drive via OAuth", icon:FileSpreadsheet, color:T.primary, action:()=>setView("sheets") },
            { label:"Import from Google Sheets", sub:"Load shared data from a spreadsheet to sync devices", icon:Zap, color:T.blue, action:()=>setView("import") },
          ].map(btn => (
            <button key={btn.label} onClick={btn.action}
              style={{ display:"flex", alignItems:"center", gap:"1rem", width:"100%", textAlign:"left",
                background:T.btnGhost, border:`1px solid ${T.border}`,
                borderRadius:14, padding:"1.1rem 1.25rem", cursor:"pointer", transition:"all 0.2s", fontFamily:"inherit" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor=btn.color+"55"; (e.currentTarget as HTMLButtonElement).style.background=`${btn.color}0a`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor=T.border; (e.currentTarget as HTMLButtonElement).style.background=T.btnGhost; }}>
              <div style={{ width:44, height:44, borderRadius:12, background:`${btn.color}18`, border:`1px solid ${btn.color}30`,
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <btn.icon size={20} style={{ color:btn.color }} />
              </div>
              <div>
                <div style={{ color:T.textPri, fontWeight:600, fontSize:14 }}>{btn.label}</div>
                <div style={{ color:T.textMut, fontSize:12, marginTop:2 }}>{btn.sub}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {view==="import" && (
        <div>
          <button onClick={() => { setView("choose"); reset(); }}
            style={{ background:"none", border:"none", color:T.textMut, fontSize:13,
              cursor:"pointer", display:"flex", alignItems:"center", gap:5, marginBottom:"1.25rem", padding:0, fontFamily:"inherit" }}>
            ← Back
          </button>
          <div style={{ background:`${T.blue}0d`, border:`1px solid ${T.blue}30`, borderRadius:12, padding:"1rem", marginBottom:"1.25rem" }}>
            <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
              <AlertCircle size={15} style={{ color:T.blue, flexShrink:0, marginTop:1 }} />
              <div style={{ fontSize:12, color:T.textSec, lineHeight:1.65 }}>
                Paste the Google Sheets spreadsheet URL or ID used for export. This will replace current entries with the data from that sheet.
              </div>
            </div>
          </div>
          <Field label="Spreadsheet URL or ID" value={sheetIdInput}
            onChange={e => setSheetIdInput(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." T={T} />
          {status==="error" && <p style={{ color:T.rose, fontSize:12, marginTop:8 }}>Error: {errMsg}</p>}
          <button onClick={handleImport} disabled={!sheetIdInput.trim() || !clientId.trim()}
            style={{ width:"100%", marginTop:"1rem", background:`linear-gradient(135deg, ${T.primary}, ${T.primary}cc)`,
              border:"none", borderRadius:10, padding:"0.7rem", color:T===DARK?"#021a14":"#fff",
              fontSize:14, fontWeight:700, cursor:sheetIdInput.trim()&&clientId.trim()?"pointer":"not-allowed",
              opacity:sheetIdInput.trim()&&clientId.trim()?1:0.5, display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontFamily:"inherit" }}>
            <Zap size={15} /> Connect & Import
          </button>
          <button onClick={() => setView("sheets")}
            style={{ width:"100%", marginTop:"0.75rem", background:T.btnGhost, border:`1px solid ${T.border}`, borderRadius:10, padding:"0.7rem", color:T.textMut, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            Use Sheets Export Instead
          </button>
          {importedCount !== null && (
            <div style={{ marginTop:"1rem", padding:"0.9rem 1rem", borderRadius:12, background:T.tagBg, color:T.textPri, fontSize:13 }}>
              Imported {importedCount} rows{importGoal ? ` and updated goal to ${importGoal}` : ""}.
            </div>
          )}
        </div>
      )}

      {view==="sheets" && (
        <div>
          <button onClick={() => { setView("choose"); reset(); }}
            style={{ background:"none", border:"none", color:T.textMut, fontSize:13,
              cursor:"pointer", display:"flex", alignItems:"center", gap:5, marginBottom:"1.25rem", padding:0, fontFamily:"inherit" }}>
            ← Back
          </button>
          {(status==="idle"||status==="error") && (
            <div>
              <div style={{ background:`${T.violet}0d`, border:`1px solid ${T.violet}30`, borderRadius:12, padding:"1rem", marginBottom:"1.25rem" }}>
                <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                  <AlertCircle size={15} style={{ color:T.violet, flexShrink:0, marginTop:1 }} />
                  <div style={{ fontSize:12, color:T.textSec, lineHeight:1.65 }}>
                    Enter your Google OAuth 2.0 Client ID. Create one at{" "}
                    <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer"
                      style={{ color:T.primary, textDecoration:"none" }}>Google Cloud Console</a>.
                    {" "}Set <strong>Authorized JS origins</strong> to your domain.
                  </div>
                </div>
              </div>
              <Field label="Google OAuth Client ID" value={clientId}
                onChange={e => setClientId(e.target.value)} placeholder="xxxx.apps.googleusercontent.com" T={T} />
              {status==="error" && <p style={{ color:T.rose, fontSize:12, marginTop:8 }}>Error: {errMsg}</p>}
              <button onClick={handleConnect} disabled={!clientId.trim()}
                style={{ width:"100%", marginTop:"1rem", background:`linear-gradient(135deg, ${T.primary}, ${T.primary}cc)`,
                  border:"none", borderRadius:10, padding:"0.7rem", color:T===DARK?"#021a14":"#fff",
                  fontSize:14, fontWeight:700, cursor:clientId.trim()?"pointer":"not-allowed",
                  opacity:clientId.trim()?1:0.5, display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontFamily:"inherit" }}>
                <Link size={15} /> Connect & Export
              </button>
            </div>
          )}
          {isLoading && (
            <div style={{ textAlign:"center", padding:"2.5rem 1rem" }}>
              <div style={{ width:44, height:44, borderRadius:"50%",
                border:`2px solid ${T.primary}`, borderTopColor:"transparent",
                animation:"spin 0.8s linear infinite", margin:"0 auto 1rem" }} />
              <div style={{ color:T.textSec, fontSize:14 }}>
                {status==="loading" ? "Connecting to Google…" : status==="importing" ? "Importing data from Google Sheets…" : "Creating your spreadsheet…"}
              </div>
            </div>
          )}
          {status==="done" && sheetUrl && (
            <div style={{ textAlign:"center", padding:"1rem 0.5rem" }}>
              <div style={{ width:56, height:56, borderRadius:"50%", background:`${T.primary}18`,
                border:`1px solid ${T.primary}33`, display:"flex", alignItems:"center",
                justifyContent:"center", margin:"0 auto 1.25rem" }}>
                <CheckCircle size={26} style={{ color:T.primary }} />
              </div>
              <div style={{ color:T.textPri, fontWeight:700, fontSize:"1rem", marginBottom:6 }}>Spreadsheet Created!</div>
              <div style={{ color:T.textMut, fontSize:13, marginBottom:"1.5rem" }}>Your data has been exported to Google Sheets.</div>
              <a href={sheetUrl!} target="_blank" rel="noreferrer"
                style={{ display:"inline-flex", alignItems:"center", gap:7,
                  background:`linear-gradient(135deg, ${T.primary}, ${T.primary}cc)`,
                  borderRadius:10, padding:"0.65rem 1.4rem", color:T===DARK?"#021a14":"#fff",
                  fontSize:14, fontWeight:700, textDecoration:"none" }}>
                <ExternalLink size={15} /> Open in Google Sheets
              </a>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

/* ─── GOAL BAR ──────────────────────────────────────────────────────── */

function GoalBar({ goal, totalEarned, T, isWeb3, currency, onEditGoal, formatCurrency }: {
  goal:number; totalEarned:number; T:typeof DARK; isWeb3:boolean; currency:Currency;
  onEditGoal:()=>void; formatCurrency:(n:number)=>string;
}) {
  const progress  = clamp((totalEarned/goal)*100, 0, 100);
  const remaining = Math.max(goal-totalEarned, 0);
  const goalLabel = isWeb3 ? "Portfolio Growth Goal" : "Yearly Earnings Goal";

  return (
    <div style={{ ...glassCard(T, { padding:"1.5rem 2rem", position:"relative", overflow:"hidden" }) }}>
      <div style={{ position:"absolute", inset:0, pointerEvents:"none",
        background:`linear-gradient(90deg, ${T.amber}07 0%, transparent 50%)` }} />
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.25rem", flexWrap:"wrap", gap:"0.75rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Target size={15} style={{ color:T.amber }} />
          <span style={{ color:T.textPri, fontWeight:600, fontSize:14 }}>{goalLabel}</span>
          <span style={{ fontFamily:"'DM Mono','Fira Mono',monospace", fontSize:12, color:T.textMut,
            background:T.tagBg, padding:"2px 10px", borderRadius:999 }}>
            {progress.toFixed(1)}%
          </span>
        </div>
        <button onClick={onEditGoal}
          style={{ display:"flex", alignItems:"center", gap:6, background:`${T.amber}10`,
            border:`1px solid ${T.amber}33`, borderRadius:9, padding:"5px 14px",
            color:T.amber, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
          <Edit2 size={12} /> Set Goal
        </button>
      </div>
      <div style={{ height:8, borderRadius:999, background:T===DARK?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.08)", overflow:"hidden", marginBottom:"0.75rem" }}>
        <div style={{ height:"100%", width:`${progress}%`,
          background:`linear-gradient(90deg, #d97706, ${T.amber})`,
          borderRadius:999, transition:"width 0.9s cubic-bezier(0.22,1,0.36,1)" }} />
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:"0.5rem" }}>
        <span style={{ fontSize:12, color:T.textMut }}>
          {isWeb3 ? "Assets" : "Earned"}: <strong style={{ color:T.textSec }}>{formatCurrency(totalEarned)}</strong>
        </span>
        {remaining>0
          ? <span style={{ fontSize:12, color:T.textMut }}>{formatCurrency(remaining)} remaining · Goal: <strong style={{ color:T.amber }}>{formatCurrency(goal)}</strong></span>
          : <span style={{ fontSize:12, color:T.primary, fontWeight:600 }}>Goal reached! 🎉</span>}
      </div>
      {!isWeb3 && (
        <div style={{ marginTop:"1rem", fontSize:11, color:T.textMut }}>
          Current currency: <strong style={{ color:T.textPri }}>{currency}</strong>
        </div>
      )}
    </div>
  );
}

/* ─── MONTHLY CHART ─────────────────────────────────────────────────── */

function MonthlyChart({ data, T, isWeb3, fmt }: {
  data:{ month:string; earned:number; saved:number; given:number }[];
  T:typeof DARK; isWeb3:boolean; fmt:(n:number)=>string;
}) {
  const [chartType, setChartType] = useState<ChartType>("bar");

  const legend = [
    { c:T.primary, l: isWeb3 ? "Received" : "Earned" },
    { c:T.blue,    l: "Saved" },
    { c:T.rose,    l: isWeb3 ? "Sent"     : "Given"  },
  ];

  const pieData = [
    { name: isWeb3?"Received":"Earned", value: data.reduce((s,d)=>s+d.earned,0) },
    { name: "Saved",    value: data.reduce((s,d)=>s+d.saved,0)  },
    { name: isWeb3?"Sent":"Given",      value: data.reduce((s,d)=>s+d.given,0)  },
  ];
  const pieColors = [T.primary, T.blue, T.rose];
  const axisStyle = { fill:T.textMut, fontSize:10 };
  const gridStroke = T.chartGrid;

  const renderPieLabel = ({ cx,cy,midAngle,innerRadius,outerRadius,percent }: {
    cx:number; cy:number; midAngle?:number; innerRadius:number; outerRadius:number; percent?:number;
  }) => {
    if (!midAngle||!percent||percent<0.05) return null;
    const RADIAN = Math.PI/180;
    const radius = innerRadius+(outerRadius-innerRadius)*0.5;
    const x = cx+radius*Math.cos(-midAngle*RADIAN);
    const y = cy+radius*Math.sin(-midAngle*RADIAN);
    return <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>{`${(percent*100).toFixed(0)}%`}</text>;
  };

  return (
    <div style={{ ...glassCard(T, { padding:"1.5rem" }) }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"1rem", flexWrap:"wrap", gap:"0.75rem" }}>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:T.textPri }}>Monthly Breakdown</div>
          <div style={{ fontSize:12, color:T.textMut, marginTop:3 }}>
            {isWeb3 ? "Received · Saved · Sent" : "Earned · Saved · Given"}
          </div>
        </div>
        <div style={{ display:"flex", gap:4, background:T===DARK?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)",
          borderRadius:10, padding:4, border:`1px solid ${T.border}` }}>
          {CHART_TYPES.map(ct => {
            const active = chartType===ct.id;
            return (
              <button key={ct.id} title={ct.label} onClick={() => setChartType(ct.id)}
                style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px",
                  borderRadius:7, border:"none", cursor:"pointer", fontFamily:"inherit",
                  fontSize:11, fontWeight:600, transition:"all 0.18s",
                  background: active?T.primary:"transparent",
                  color: active?(T===DARK?"#021a14":"#fff"):T.textMut,
                  boxShadow: active?`0 2px 8px ${T.primary}44`:"none" }}>
                <ct.icon size={12} />{ct.label}
              </button>
            );
          })}
        </div>
      </div>

      {(chartType==="bar"||chartType==="line") && (
        <div style={{ display:"flex", gap:"0.85rem", marginBottom:"0.75rem" }}>
          {legend.map(x => (
            <div key={x.l} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:8, height:8, borderRadius:2, background:x.c }} />
              <span style={{ fontSize:11, color:T.textMut, fontWeight:600 }}>{x.l}</span>
            </div>
          ))}
        </div>
      )}

      {chartType==="bar" && (
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={data} barCategoryGap="32%" barGap={2}>
            <CartesianGrid strokeDasharray="2 4" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} width={36} />
            <Tooltip content={<ChartTip T={T} fmt={fmt} />} />
            <Bar dataKey="earned" name={legend[0].l} fill={T.primary} radius={[4,4,0,0]} opacity={0.9} />
            <Bar dataKey="saved"  name={legend[1].l} fill={T.blue}    radius={[4,4,0,0]} opacity={0.9} />
            <Bar dataKey="given"  name={legend[2].l} fill={T.rose}    radius={[4,4,0,0]} opacity={0.9} />
          </BarChart>
        </ResponsiveContainer>
      )}

      {chartType==="line" && (
        <ResponsiveContainer width="100%" height={230}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="2 4" stroke={gridStroke} vertical={false} />
            <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} width={36} />
            <Tooltip content={<ChartTip T={T} fmt={fmt} />} />
            <Line type="monotone" dataKey="earned" name={legend[0].l} stroke={T.primary} strokeWidth={2.5} dot={{ r:3, fill:T.primary, strokeWidth:0 }} activeDot={{ r:5 }} />
            <Line type="monotone" dataKey="saved"  name={legend[1].l} stroke={T.blue}    strokeWidth={2.5} dot={{ r:3, fill:T.blue,    strokeWidth:0 }} activeDot={{ r:5 }} />
            <Line type="monotone" dataKey="given"  name={legend[2].l} stroke={T.rose}    strokeWidth={2.5} dot={{ r:3, fill:T.rose,    strokeWidth:0 }} activeDot={{ r:5 }} />
          </LineChart>
        </ResponsiveContainer>
      )}

      {chartType==="pie" && (
        <ResponsiveContainer width="100%" height={230}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} innerRadius={45}
              dataKey="value" labelLine={false} label={renderPieLabel}>
              {pieData.map((_,i) => <Cell key={i} fill={pieColors[i%pieColors.length]} />)}
            </Pie>
            <Tooltip formatter={(v) => typeof v === 'number' ? fmt(v) : ""} contentStyle={{
              background:T.tooltipBg, border:`1px solid ${T.border}`, borderRadius:10, fontSize:12, color:T.textPri
            }} />
          </PieChart>
        </ResponsiveContainer>
      )}

      {chartType==="radar" && (
        <ResponsiveContainer width="100%" height={230}>
          <RadarChart data={data.filter(d=>d.earned>0||d.saved>0||d.given>0)}>
            <PolarGrid stroke={gridStroke} />
            <PolarAngleAxis dataKey="month" tick={{ fill:T.textMut, fontSize:10 }} />
            <PolarRadiusAxis tick={{ fill:T.textMut, fontSize:9 }} axisLine={false}
              tickFormatter={(v:number)=>`$${(v/1000).toFixed(0)}k`} />
            <Radar name={legend[0].l} dataKey="earned" stroke={T.primary} fill={T.primary} fillOpacity={0.25} />
            <Radar name={legend[1].l} dataKey="saved"  stroke={T.blue}    fill={T.blue}    fillOpacity={0.2}  />
            <Radar name={legend[2].l} dataKey="given"  stroke={T.rose}    fill={T.rose}    fillOpacity={0.2}  />
            <Tooltip formatter={(v) => typeof v === 'number' ? fmt(v) : ""} contentStyle={{
              background:T.tooltipBg, border:`1px solid ${T.border}`, borderRadius:10, fontSize:12, color:T.textPri
            }} />
          </RadarChart>
        </ResponsiveContainer>
      )}

      {(chartType==="pie"||chartType==="radar") && (
        <div style={{ display:"flex", justifyContent:"center", gap:"1.25rem", marginTop:"0.75rem" }}>
          {(chartType==="pie"?pieData.map((d,i)=>({l:d.name,c:pieColors[i]})):legend.map(l=>({l:l.l,c:l.c}))).map(x => (
            <div key={x.l} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <div style={{ width:10, height:10, borderRadius:"50%", background:x.c }} />
              <span style={{ fontSize:11, color:T.textMut, fontWeight:600 }}>{x.l}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── ICON BUTTON ───────────────────────────────────────────────────── */

function IBtn({ icon:Icon, color, onClick, title, T }: {
  icon:React.ElementType; color:string; onClick:()=>void; title:string; T:typeof DARK;
}) {
  const [h, setH] = useState(false);
  return (
    <button title={title} onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background:h?`${color}22`:`${color}0f`,
        border:`1px solid ${h?color+"55":color+"22"}`,
        borderRadius:8, padding:"5px 8px", cursor:"pointer", color, display:"flex", transition:"all 0.15s" }}>
      <Icon size={13} />
    </button>
  );
}

/* ─── TABLE ROW ─────────────────────────────────────────────────────── */

function TableRow({ entry, index, onEdit, onDelete, T, isWeb3, fmt }: {
  entry:Entry; index:number; onEdit:()=>void; onDelete:()=>void; T:typeof DARK; isWeb3:boolean; fmt:(n:number)=>string;
}) {
  const [hov, setHov] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!entry.walletAddress) return;
    navigator.clipboard.writeText(entry.walletAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };

  return (
    <tr onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ borderBottom:`1px solid ${T.border}`,
        background: hov?T.tableHov:index%2===0?T.tableRow:"transparent",
        transition:"background 0.15s" }}>
      <td style={{ padding:"0.9rem 1.25rem", fontSize:12, color:T.textMut,
        fontFamily:"'DM Mono','Fira Mono',monospace", whiteSpace:"nowrap" }}>{entry.date}</td>
      <td style={{ padding:"0.9rem 1.25rem", fontSize:13, color:T.textPri, fontWeight:500,
        maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{entry.project}</td>
      {isWeb3 && (
        <td style={{ padding:"0.9rem 1.25rem" }}>
          {entry.walletAddress ? (
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontFamily:"'DM Mono','Fira Mono',monospace", fontSize:11, color:T.textSec }}>
                {entry.walletName ? (
                  <span title={entry.walletAddress}>
                    <span style={{ color:T.primary, fontWeight:600 }}>{entry.walletName}</span>
                    <span style={{ color:T.textMut, marginLeft:4 }}>({shortAddr(entry.walletAddress)})</span>
                  </span>
                ) : shortAddr(entry.walletAddress)}
              </span>
              <button onClick={copyAddress} title={copied?"Copied!":"Copy address"}
                style={{ background:"none", border:"none", cursor:"pointer", color:copied?T.primary:T.textMut,
                  padding:2, display:"flex", transition:"color 0.2s" }}>
                <Copy size={11} />
              </button>
            </div>
          ) : (
            <span style={{ color:T.textMut, fontSize:12 }}>—</span>
          )}
        </td>
      )}
      <td style={{ padding:"0.9rem 1.25rem", textAlign:"right", fontFamily:"'DM Mono','Fira Mono',monospace",
        fontSize:13, fontWeight:600, color:T.primary, whiteSpace:"nowrap" }}>{fmt(entry.earned)}</td>
      <td style={{ padding:"0.9rem 1.25rem", textAlign:"right", fontFamily:"'DM Mono','Fira Mono',monospace",
        fontSize:13, color:T===DARK?"#93c5fd":T.blue, whiteSpace:"nowrap" }}>{fmt(entry.saved)}</td>
      <td style={{ padding:"0.9rem 1.25rem", textAlign:"right", fontFamily:"'DM Mono','Fira Mono',monospace",
        fontSize:13, color:T===DARK?"#fda4af":T.rose, whiteSpace:"nowrap" }}>{fmt(entry.given)}</td>
      {isWeb3 && (
        <td style={{ padding:"0.9rem 1.25rem", textAlign:"right", fontFamily:"'DM Mono','Fira Mono',monospace",
          fontSize:13, fontWeight:600, whiteSpace:"nowrap" }}>
          {entry.investmentAmount && entry.currentValue !== undefined ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:2 }}>
              <div style={{ color: entry.currentValue >= entry.investmentAmount ? T.primary : T.rose, fontWeight:700 }}>
                {entry.currentValue >= entry.investmentAmount ? "+" : ""}{fmt(entry.currentValue - entry.investmentAmount)}
              </div>
              <div style={{ fontSize:10, color: entry.currentValue >= entry.investmentAmount ? T.primary : T.rose, fontWeight:600, opacity:0.8 }}>
                {((entry.currentValue / entry.investmentAmount - 1) * 100).toFixed(1)}%
              </div>
            </div>
          ) : (
            <span style={{ color:T.textMut }}>—</span>
          )}
        </td>
      )}
      <td style={{ padding:"0.9rem 1.25rem" }}><Pill cat={entry.givenTo} /></td>
      <td style={{ padding:"0.9rem 1.25rem" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          <IBtn icon={Edit2}  color={T.blue} onClick={onEdit}   title="Edit"   T={T} />
          <IBtn icon={Trash2} color={T.rose} onClick={onDelete} title="Delete" T={T} />
        </div>
      </td>
    </tr>
  );
}

/* ─── HEADER BUTTON ─────────────────────────────────────────────────── */

function HeaderBtn({ onClick, label, icon:Icon, T }: {
  onClick:()=>void; label:string; icon:React.ElementType; T:typeof DARK;
}) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display:"flex", alignItems:"center", gap:7,
        background: h?(T===DARK?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.07)"):T.btnGhost,
        border:`1px solid ${h?T.borderHov:T.border}`,
        borderRadius:10, padding:"0.5rem 1rem",
        color: h?T.textPri:T.textSec,
        fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s" }}>
      <Icon size={14} />{label}
    </button>
  );
}

/* ─── ROOT COMPONENT ─────────────────────────────────────────────────── */

export default function FinanceDashboard() {
  const { isWeb3, setMode, mode } = useWeb3();
  const { setCurrentPage, currency, setCurrency, hideBalances, setHideBalances } = useAppSettings();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const currentMode = isWeb3 ? "web3" : "web2";
  const { goal, setGoal: setGoalAndSync } = useGoal(currentMode);
  const { web2Entries, web3Entries, setWeb2Entries, setWeb3Entries, loaded, save: saveEntry, remove: removeEntry } = useEntries(isWeb3);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<Entry | null>(null);
  const [exportModal, setExportModal] = useState(false);
  const [cloudSyncModal, setCloudSyncModal] = useState(false);
  const [cloudSyncId, setCloudSyncId] = useState(() => {
    if (typeof window === "undefined") return "";
    try { return localStorage.getItem("cloud_sync_id") || ""; } catch { return ""; }
  });
  const [cloudSyncMessage, setCloudSyncMessage] = useState<string | null>(null);
  const [cloudSyncLoading, setCloudSyncLoading] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    try { return localStorage.getItem("auto_sync_enabled") === "true"; } catch { return false; }
  });
  const [goalInput, setGoalInput] = useState(String(goal));
  const [goalCurrency, setGoalCurrency] = useState<Currency>(currency);
  const [goalError, setGoalError] = useState("");

  const T = isDark ? DARK : LIGHT;

  // Currency-aware formatter
  const fmt = (n: number) => {
    const exchangeRates: Record<string, number> = {
      USD: 1, EUR: 0.92, GBP: 0.80, JPY: 145, AUD: 1.55,
      CAD: 1.35, CHF: 0.92, CNY: 7.28, INR: 83,
    };
    const convertedValue = isWeb3 ? n : n * (exchangeRates[currency] ?? 1);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: isWeb3 ? "USD" : currency,
      maximumFractionDigits: 0,
    }).format(convertedValue ?? 0);
  };

  /* ── hydration effect ── */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ledger_theme");
      setIsDark(saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
    } catch {
      setIsDark(true);
    }
    setIsHydrated(true);
  }, []);

  /* ── update the page indicator for floating window ── */
  useEffect(() => {
    setCurrentPage("home");
  }, [setCurrentPage]);

  const openGoalModal = () => {
    setGoalInput(String(goal));
    setGoalCurrency(currency);
    setGoalError("");
    setShowGoalModal(true);
  };

  const handleGoalSave = () => {
    const parsed = parseFloat(goalInput.replace(/[^0-9.]/g, ""));
    if (!parsed || parsed <= 0) {
      setGoalError("Enter a valid yearly goal");
      return;
    }
    setGoalAndSync(parsed, goalCurrency);
    setCurrency(goalCurrency);
    setShowGoalModal(false);
    setGoalError("");
  };

  const exchangeRates: Record<string, number> = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.80,
    JPY: 145,
    AUD: 1.55,
    CAD: 1.35,
    CHF: 0.92,
    CNY: 7.28,
    INR: 83,
  };

  const convertCurrency = (value: number) => value * (exchangeRates[currency] ?? 1);
  const formatCurrency = (value: number) => {
    if (hideBalances) return "****";
    const formattedValue = isWeb3 ? value : convertCurrency(value);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: isWeb3 ? "USD" : currency,
      maximumFractionDigits: 0,
    }).format(formattedValue);
  };

  /* ── theme persistence ── */
  useEffect(() => {
    try { localStorage.setItem("ledger_theme", isDark ? "dark" : "light"); } catch {}
  }, [isDark]);

  /* ── data load/save ── */
  const entries = isWeb3 ? web3Entries : web2Entries;


  const save = useCallback((entry: Entry) => {
    saveEntry(entry);
    setAddModal(false);
    setEditEntry(null);
  }, [saveEntry]);
  const remove = useCallback((id: string) => {
    removeEntry(id);
    setDeleteEntry(null);
  }, [removeEntry]);

  const exportCsv = useCallback(() => {
    const hdr  = ["Date","Project/Description","Earned/Received","Saved/Staked","Given/Sent","Category","Wallet Address","Wallet Name"];
    const rows = [...entries].sort((a,b) => new Date(a.date).getTime()-new Date(b.date).getTime())
      .map(e => [e.date, `"${e.project}"`, e.earned, e.saved, e.given, e.givenTo, e.walletAddress||"", `"${e.walletName||""}"`]);
    const csv = [hdr, ...rows].map(r => r.join(",")).join("\n");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type:"text/csv" })),
      download: `ledger-${new Date().toISOString().slice(0,10)}.csv`,
    });
    a.click();
  }, [entries]);

  const generateCloudSyncId = useCallback(() => `${uid()}${uid()}`, []);

  const saveCloudSync = useCallback(async (id:string) => {
    if (!id) return;
    setCloudSyncLoading(true);
    setCloudSyncMessage("Syncing...");
    try {
      const payload = {
        entries: [...web2Entries, ...web3Entries],
        goal,
        currency,
        hideBalances,
        mode,
      };
      await saveDashboardState(id, payload);
      try { localStorage.setItem("cloud_sync_id", id); } catch {}
      setCloudSyncId(id);
      setCloudSyncMessage(`Synced dashboard to cloud ID: ${id}`);
    } catch (error) {
      setCloudSyncMessage(`Failed to sync cloud. ${String(error)}`);
    } finally {
      setCloudSyncLoading(false);
    }
  }, [currency, goal, hideBalances, mode, web2Entries, web3Entries]);

  const loadCloudSync = useCallback(async (id:string) => {
    if (!id) return;
    setCloudSyncLoading(true);
    setCloudSyncMessage("Syncing...");
    try {
      const data = await loadDashboardState(id);
      if (!data) {
        setCloudSyncMessage("No dashboard found for that sync ID.");
        return;
      }
      const loadedEntries = Array.isArray(data.entries) ? data.entries : [];
      const web2 = loadedEntries.filter((entry): entry is Entry =>
        typeof entry === "object" && entry !== null && "mode" in entry && (entry as any).mode === "web2"
      );
      const web3 = loadedEntries.filter((entry): entry is Entry =>
        typeof entry === "object" && entry !== null && "mode" in entry && (entry as any).mode === "web3"
      );
      setWeb2Entries(web2);
      setWeb3Entries(web3);
      setGoal(typeof data.goal === "number" ? data.goal : 60000);
      setCurrency((data.currency as Currency) || "USD");
      setHideBalances(Boolean(data.hideBalances));
      setMode(data.mode === "web3" ? "web3" : "web2");
      try { localStorage.setItem("cloud_sync_id", id); } catch {}
      setCloudSyncId(id);
      setCloudSyncMessage(`Synced dashboard from cloud ID: ${id}`);
    } catch (error) {
      setCloudSyncMessage(`Failed to sync cloud. ${String(error)}`);
    } finally {
      setCloudSyncLoading(false);
    }
  }, [setCurrency, setHideBalances, setMode]);

  // Auto-sync every 1 minute if enabled and sync ID exists
  useEffect(() => {
    if (!autoSyncEnabled || !cloudSyncId) return;
    const interval = setInterval(() => {
      // Save current state to cloud
      saveCloudSync(cloudSyncId);
      // Load latest state from cloud (will only update if data exists)
      loadCloudSync(cloudSyncId);
    }, 60000); // 1 minute
    return () => clearInterval(interval);
  }, [autoSyncEnabled, cloudSyncId, saveCloudSync, loadCloudSync]);

  const handleImportEntries = useCallback((importedEntries: Entry[], importedGoal?: number) => {
    const setter = isWeb3 ? setWeb3Entries : setWeb2Entries;
    setter(importedEntries);
    if (importedGoal && importedGoal > 0) setGoal(importedGoal);
    setExportModal(false);
  }, [isWeb3]);

  /* ── computed ── */
  const totalEarned = entries.reduce((s,e) => s+e.earned, 0);
  const totalSaved  = entries.reduce((s,e) => s+e.saved,  0);
  const totalGiven  = entries.reduce((s,e) => s+e.given,  0);
  const progress    = clamp((totalEarned/goal)*100, 0, 100);
  const monthly     = buildMonthly(entries);
  const cumulative  = buildCumulative(entries);
  const sorted      = [...entries].sort((a,b) => new Date(b.date).getTime()-new Date(a.date).getTime());

  const KPI = isWeb3
    ? [
        { icon:Coins,    label:"Total Assets",    rawValue:totalEarned, sub:`${formatCurrency(totalEarned)} of ${formatCurrency(goal)}`, accent:T.primary },
        { icon:Wallet,   label:"Total Saved",    rawValue:totalSaved,  sub:`${pct(totalSaved,totalEarned)}% save rate`,             accent:T.blue    },
        { icon:Send,     label:"Total Sent",      rawValue:totalGiven,  sub:`${pct(totalGiven,totalEarned)}% sent rate`,             accent:T.rose    },
        { icon:Target,   label:"Portfolio Goal",  rawValue:Math.round(progress), isPercent:true, sub:`${formatCurrency(totalEarned)} of ${formatCurrency(goal)}`, accent:T.amber   },
      ]
    : [
        { icon:DollarSign, label:"Total Earned",   rawValue:totalEarned, sub:`${entries.length} projects tracked`,              accent:T.primary },
        { icon:PiggyBank,  label:"Total Saved",    rawValue:totalSaved,  sub:`${pct(totalSaved,totalEarned)}% save rate`,      accent:T.blue    },
        { icon:HandHeart,  label:"Total Given",    rawValue:totalGiven,  sub:`${pct(totalGiven,totalEarned)}% give rate`,      accent:T.rose    },
        { icon:Target,     label:"Goal Progress",  rawValue:Math.round(progress), isPercent:true, sub:`${formatCurrency(totalEarned)} of ${formatCurrency(goal)}`, accent:T.amber   },
      ];

  /* ── bg gradient ── */
  const bgStyle: React.CSSProperties = {
    background: isDark
      ? `radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,201,167,0.07) 0%, transparent 55%), radial-gradient(ellipse 60% 45% at 85% 90%, rgba(139,92,246,0.06) 0%, transparent 55%), ${T.bg}`
      : `radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,157,130,0.08) 0%, transparent 55%), radial-gradient(ellipse 60% 45% at 85% 90%, rgba(124,58,237,0.05) 0%, transparent 55%), ${T.bg}`,
  };

  const tableHeaders = isWeb3
    ? ["Date","Description","Wallet","Received","Saved","Sent","P&L","Category",""]
    : ["Date","Project","Earned","Saved","Given","Category",""];

  return (
    <MasterPasscodeGuard isDark={isDark}>
      <>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&family=Geist:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes slideUp { from { opacity:0; transform:translateY(18px) scale(0.975); } to { opacity:1; transform:none; } }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(128,128,128,0.25); border-radius:99px; }
        input[type=number]::-webkit-inner-spin-button { opacity:.4; }
        input[type=date]::-webkit-calendar-picker-indicator { filter:${isDark?"invert(.5)":"none"}; cursor:pointer; }
        input::placeholder, textarea::placeholder { color: ${T.textMut}; }
        option { background: ${T.selectBg}; color: ${T.textPri}; }
      `}</style>

      <div style={{ minHeight:"100vh", ...bgStyle,
        fontFamily:"'Geist','Segoe UI',sans-serif", color:T.textPri,
        animation:"fadeIn 0.35s ease", transition:"background 0.4s ease" }}>

        {/* ── HEADER ── */}
        <header style={{ position:"sticky", top:0, zIndex:40,
          borderBottom:`1px solid ${T.border}`,
          background:T.headerBg, backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
          overflowX:"auto", transition:"background 0.4s, border-color 0.4s" }}>
          <div style={{ maxWidth:1380, margin:"0 auto", padding:"0 max(0.75rem, 2vw)", minHeight:64,
            display:"flex", alignItems:"center", justifyContent:"space-between", gap:"0.75rem" }}>

            {/* Logo + nav */}
            <div style={{ display:"flex", alignItems:"center", gap:"max(0.75rem, 3vw)", minWidth:0, flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <img src="/brand/logo.png" alt="Ledger logo" width={34} height={34}
                  style={{ width:34, height:34, borderRadius:10, objectFit:"contain", background:T.card, padding:6, flexShrink:0 }} />
                <div style={{ display:"flex" }}>
                  <div style={{ fontSize:15, fontWeight:800, color:T.textPri, letterSpacing:"-0.03em",
                    fontFamily:"'Syne',sans-serif" }}>Ledger</div>
                  <div style={{ fontSize:9, color:T.textMut, letterSpacing:"0.1em",
                    textTransform:"uppercase", fontWeight:600 }}>Personal Finance</div>
                </div>
              </div>
              {/* Page links - hidden on mobile */}
              <div style={{ display:"flex", gap:2 }}>
                {[
                  { href:"/",            icon:LayoutDashboard, label:"Dashboard" },
                  { href:"/cards",       icon:CreditCard, label:"Cards" },
                  { href:"/performance", icon:TrendingUp, label:"Performance" },
                ].map(link => (
                  <a key={link.href} href={link.href}
                    style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px",
                      borderRadius:8, textDecoration:"none", fontSize:13, fontWeight:600,
                      color: link.href==="/"?T.primary:T.textMut,
                      background: link.href==="/"?`${T.primary}12`:"transparent",
                      transition:"all 0.2s", whiteSpace:"nowrap" }}
                    onMouseEnter={e => { if(link.href!=="/") (e.currentTarget as HTMLAnchorElement).style.color=T.textPri; }}
                    onMouseLeave={e => { if(link.href!=="/") (e.currentTarget as HTMLAnchorElement).style.color=T.textMut; }}>
                    <link.icon size={14} />{link.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display:"flex", alignItems:"center", gap:4, flexWrap:"nowrap", overflowX:"auto", scrollBehavior:"smooth" }}>
              {/* Web2/Web3 toggle - hidden on mobile */}
              <button onClick={() => setMode(isWeb3?"web2":"web3")}
                style={{ display:"flex", alignItems:"center", gap:7,
                  background: isWeb3
                    ? "rgba(139,92,246,0.12)"
                    : T===DARK?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.05)",
                  border:`1px solid ${isWeb3?T.violet+"55":T.border}`,
                  borderRadius:10, padding:"0.5rem 1rem",
                  color: isWeb3?T.violet:T.textSec,
                  fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all 0.25s", whiteSpace:"nowrap" }}>
                {isHydrated&&isWeb3
                  ? <><Wallet size={14} /> Web3</>
                  : <><CreditCard size={14} /> Web2</>}
              </button>

              {/* Theme toggle - hidden on mobile */}
              <button onClick={() => setIsDark(d => !d)}
                title={isDark?"Switch to light mode":"Switch to dark mode"}
                style={{ display:"flex", alignItems:"center", gap:7,
                  background: isDark?"rgba(245,158,11,0.1)":"rgba(139,92,246,0.1)",
                  border:`1px solid ${isDark?T.amber+"44":T.violet+"44"}`,
                  borderRadius:10, padding:"0.5rem 1rem",
                  color: isDark?T.amber:T.violet,
                  fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all 0.25s" }}>
                {isDark?<Sun size={14}/>:<Moon size={14}/>}
                {isDark?"Light":"Dark"}
              </button>

              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <HeaderBtn onClick={() => setCloudSyncModal(true)} label="Sync" icon={Zap} T={T} />
                {autoSyncEnabled && cloudSyncId && (
                  <span style={{ fontSize:10, color:T.textMut, fontWeight:600, letterSpacing:"0.05em", textTransform:"uppercase" }}>
                    Auto • 1min
                  </span>
                )}
              </div>
              <HeaderBtn onClick={() => setExportModal(true)} label="Export" icon={Download} T={T} />

              <button onClick={() => setAddModal(true)}
                style={{ display:"flex", alignItems:"center", gap:4,
                  background:`linear-gradient(135deg, ${T.primary}, ${T.primary}bb)`,
                  border:"none", borderRadius:10, padding:"0.5rem 0.85rem",
                  color:isDark?"#021a14":"#fff",
                  fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
                <Plus size={14} /> Add
              </button>
            </div>
          </div>
        </header>

        {/* ── MAIN ── */}
        <main style={{ maxWidth:1380, margin:"0 auto", padding:"2rem 2rem 6rem 2rem" }}>

          {/* Mode banner */}
          {isWeb3 && (
            <div style={{ marginBottom:"1rem", padding:"0.75rem 1.25rem",
              background:`${T.violet}0d`, border:`1px solid ${T.violet}22`,
              borderRadius:12, display:"flex", alignItems:"center", gap:10 }}>
              <Wallet size={15} style={{ color:T.violet }} />
              <span style={{ fontSize:13, color:T.textSec }}>
                <strong style={{ color:T.violet }}>Web3 Mode</strong> — tracking crypto assets, staking & transfers.
                Go to <a href="/cards" style={{ color:T.primary, textDecoration:"none", fontWeight:600 }}>Wallets</a> to manage addresses.
              </span>
            </div>
          )}

          {/* KPI Row */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(210px, 1fr))", gap:"1rem", marginBottom:"1.1rem" }}>
            {KPI.map((k,i) => <MetricCard key={k.label} {...k} index={i} T={T} fmt={fmt} />)}
          </div>

          {/* Goal Bar */}
          <div style={{ marginBottom:"1.1rem" }}>
            <GoalBar
              goal={goal}
              totalEarned={totalEarned}
              T={T}
              isWeb3={isWeb3}
              currency={currency}
              onEditGoal={openGoalModal}
              formatCurrency={formatCurrency}
            />
          </div>

          {/* Charts */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(360px, 1fr))", gap:"1rem", marginBottom:"1.1rem" }}>

            <MonthlyChart data={monthly} T={T} isWeb3={isWeb3} fmt={fmt} />

            {/* Cumulative area */}
            <div style={{ ...glassCard(T, { padding:"1.5rem" }) }}>
              <div style={{ marginBottom:"1rem" }}>
                <div style={{ fontSize:14, fontWeight:700, color:T.textPri }}>
                  {isWeb3 ? "Cumulative Assets" : "Cumulative Earnings"}
                </div>
                <div style={{ fontSize:12, color:T.textMut, marginTop:3 }}>
                  {isWeb3 ? "Running total across all transactions" : "Running total across all projects"}
                </div>
              </div>
              <div style={{ fontFamily:"'DM Mono','Fira Mono',monospace", fontSize:"1.6rem",
                fontWeight:700, color:T.primary, letterSpacing:"-0.03em", marginBottom:"1rem" }}>
                {fmt(totalEarned)}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={cumulative}>
                  <defs>
                    <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={T.primary} stopOpacity={0.22} />
                      <stop offset="100%" stopColor={T.primary} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke={T.chartGrid} vertical={false} />
                  <XAxis dataKey="date" tick={{ fill:T.textMut, fontSize:9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:T.textMut, fontSize:10 }} axisLine={false} tickLine={false}
                    tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} width={36} />
                  <Tooltip content={<ChartTip T={T} fmt={fmt} />} />
                  <Area type="monotone" dataKey="cumulative" name={isWeb3?"Total Assets":"Total"} stroke={T.primary} strokeWidth={2.5}
                    fill="url(#ag)" dot={false}
                    activeDot={{ r:5, fill:T.primary, strokeWidth:2, stroke:isDark?"#06080f":"#f0f4f8" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div style={{ ...glassCard(T, { padding:0, overflow:"hidden" }) }}>
            <div style={{ padding:"1.25rem 1.75rem", borderBottom:`1px solid ${T.border}`,
              display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem" }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:T.textPri }}>
                  Recent Transactions
                </div>
                <div style={{ fontSize:12, color:T.textMut, marginTop:2 }}>{entries.length} transactions</div>
              </div>
              <div style={{ display:"flex", gap:"1.5rem" }}>
                {[
                  { l:isWeb3?"Received":"Earned", v:totalEarned, c:T.primary },
                  { l:"Saved",    v:totalSaved,  c:T.blue    },
                  { l:isWeb3?"Sent":"Given",      v:totalGiven,  c:T.rose    },
                ].map(s => (
                  <div key={s.l} style={{ textAlign:"right" }}>
                    <div style={{ fontSize:10, color:T.textMut, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em" }}>{s.l}</div>
                    <div style={{ fontFamily:"'DM Mono','Fira Mono',monospace", fontSize:13, fontWeight:600, color:s.c, marginTop:2 }}>{fmt(s.v)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", minWidth: isWeb3?780:680 }}>
                <thead>
                  <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                    {tableHeaders.map((h,i) => (
                      <th key={i} style={{ padding:"0.75rem 1.25rem",
                        textAlign: i>=3&&i<=5?"right":i===tableHeaders.length-1?"center":"left",
                        fontSize:10, fontWeight:700, letterSpacing:"0.09em", textTransform:"uppercase",
                        color:T.textMut,
                        background:T===DARK?"rgba(255,255,255,0.015)":"rgba(0,0,0,0.02)",
                        whiteSpace:"nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((e,i) => (
                    <TableRow key={e.id} entry={e} index={i}
                      onEdit={() => setEditEntry(e)}
                      onDelete={() => setDeleteEntry(e)}
                      T={T} isWeb3={isWeb3} fmt={fmt} />
                  ))}
                  {entries.length===0 && (
                    <tr><td colSpan={tableHeaders.length} style={{ padding:"4rem", textAlign:"center", color:T.textMut, fontSize:14 }}>
                      No entries yet —{" "}
                      <button onClick={() => setAddModal(true)} style={{ background:"none", border:"none",
                        color:T.primary, cursor:"pointer", fontWeight:600, fontSize:14, fontFamily:"inherit" }}>
                        Add your first entry
                      </button>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* ── Modals ── */}
      {addModal    && <EntryModal onSave={save} onClose={() => setAddModal(false)} T={T} isWeb3={isWeb3} />}
      {editEntry   && <EntryModal initial={{ ...editEntry, earned: String(editEntry.earned), saved: String(editEntry.saved), given: String(editEntry.given), investmentAmount: editEntry.investmentAmount ? String(editEntry.investmentAmount) : "", currentValue: editEntry.currentValue ? String(editEntry.currentValue) : "" }} onSave={save} onClose={() => setEditEntry(null)} T={T} isWeb3={isWeb3} />}
      {deleteEntry && <DeleteModal entry={deleteEntry} onConfirm={() => remove(deleteEntry.id)} onClose={() => setDeleteEntry(null)} T={T} />}
      {exportModal && <ExportModal entries={entries} goal={goal} onClose={() => setExportModal(false)} onCsv={exportCsv} onImport={handleImportEntries} isWeb3={isWeb3} T={T} />}
      {cloudSyncModal && (
        <CloudSyncModal
          cloudSyncId={cloudSyncId}
          onClose={() => setCloudSyncModal(false)}
          onGenerateId={generateCloudSyncId}
          onSave={saveCloudSync}
          onLoad={loadCloudSync}
          loading={cloudSyncLoading}
          message={cloudSyncMessage}
          autoSyncEnabled={autoSyncEnabled}
          setAutoSyncEnabled={setAutoSyncEnabled}
          T={T}
        />
      )}
      {showGoalModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "1rem",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 460,
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 20,
              padding: "2rem",
              boxShadow: T.shadow,
            }}
          >
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Target size={20} style={{ color: T.amber }} />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: T.textPri }}>Set your yearly goal</div>
                  <div style={{ fontSize: 12, color: T.textMut }}>Choose the target amount and currency for Web2 goals.</div>
                </div>
              </div>
              <div style={{ display: "grid", gap: 14 }}>
                <label style={{ display: "grid", gap: 6, fontSize: 12, color: T.textMut }}>
                  Yearly goal
                  <input
                    type="number"
                    value={goalInput}
                    onChange={(e) => {
                      setGoalInput(e.target.value);
                      setGoalError("");
                    }}
                    style={{
                      width: "100%",
                      border: `1px solid ${T.border}`,
                      borderRadius: 12,
                      padding: "0.9rem 1rem",
                      background: T.inputBg,
                      color: T.textPri,
                      fontSize: 14,
                      fontFamily: "inherit",
                    }}
                  />
                </label>
                {!isWeb3 && (
                  <label style={{ display: "grid", gap: 6, fontSize: 12, color: T.textMut }}>
                    Currency
                    <select
                      value={goalCurrency}
                      onChange={(e) => setGoalCurrency(e.target.value as Currency)}
                      style={{
                        width: "100%",
                        border: `1px solid ${T.border}`,
                        borderRadius: 12,
                        padding: "0.9rem 1rem",
                        background: T.inputBg,
                        color: T.textPri,
                        fontSize: 14,
                        fontFamily: "inherit",
                      }}
                    >
                      {GOAL_CURRENCIES.map((curr) => (
                        <option key={curr} value={curr}>{curr} {CURRENCY_SYMBOLS[curr]}</option>
                      ))}
                    </select>
                  </label>
                )}
                {goalError && (
                  <div style={{ color: T.rose, fontSize: 12, fontWeight: 600 }}>{goalError}</div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
              <button
                onClick={() => setShowGoalModal(false)}
                style={{
                  background: T.btnGhost,
                  border: `1px solid ${T.border}`,
                  borderRadius: 12,
                  padding: "0.9rem 1.25rem",
                  color: T.textMut,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleGoalSave}
                style={{
                  background: `linear-gradient(135deg, ${T.primary}, ${T.primary}cc)`,
                  border: "none",
                  borderRadius: 12,
                  padding: "0.9rem 1.25rem",
                  color: isDark ? "#021a14" : "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Save Goal
              </button>
            </div>
          </div>
        </div>
      )}
      <BottomToolsBar isDark={isDark} setIsDark={setIsDark} />
      </>
    </MasterPasscodeGuard>
  );
}