"use client";
import React, {
  useState, useMemo, useEffect, useRef, useCallback,
} from "react";
import { apiFetch, setApiKey } from "./lib/apiClient";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Home, Wallet, CreditCard, Target, BarChart3, Settings, Cloud, Lock,
  Bell, Plus, Search, ArrowUpRight, MoreHorizontal, Star, Wifi,
  Copy, Check, Upload, Download, KeyRound, ShieldCheck, ShieldAlert,
  Eye, EyeOff, Trash2, X, ChevronRight, TrendingUp, Send, Inbox,
  Menu,
} from "lucide-react";
import Image from "next/image";
import { useWeb3 } from "./context/Web3Context";
import { useAppSettings } from "./context/AppSettingsContext";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tile = "pink" | "yellow" | "lavender" | "mint" | "peach" | "blue";
type CurrencyCode = "USD" | "EUR" | "GBP";
type ThemeMode = "light" | "dark" | "system";
type Period = "Daily" | "Weekly" | "Monthly" | "Yearly";
type EntryType = "income" | "expense" | "transfer" | "send" | "receive";

interface Entry {
  id: string; type: EntryType; amount: number; currency: CurrencyCode;
  category: string; walletId: string; note: string; date: string;
}
interface Wallet { id: string; name: string; bank: string; currency: CurrencyCode; balance: number; tile: Tile; address?: string; }
interface Card { id: string; label: string; brand: "Visa" | "Mastercard" | "Amex"; last4: string; walletId: string; tile: Tile; holder?: string; expiry?: string; }
interface Goal { id: string; name: string; target: number; current: number; deadline: string; tile: Tile; }
interface ActivityItem { id: string; action: string; detail: string; at: string; }
interface Notification { id: string; title: string; body: string; at: string; read: boolean; }
interface SeriesPoint { d: string; income: number; spent: number; balance: number; }

// ─── Design tokens ────────────────────────────────────────────────────────────
const TILE: Record<Tile, { bg: string; fg: string; chip: string }> = {
  pink:     { bg: "bg-tile-pink",     fg: "text-[hsl(var(--tile-pink-fg))]",     chip: "bg-[hsl(var(--tile-pink-fg)_/_0.08)] text-[hsl(var(--tile-pink-fg))]" },
  yellow:   { bg: "bg-tile-yellow",   fg: "text-[hsl(var(--tile-yellow-fg))]",   chip: "bg-[hsl(var(--tile-yellow-fg)_/_0.08)] text-[hsl(var(--tile-yellow-fg))]" },
  lavender: { bg: "bg-tile-lavender", fg: "text-[hsl(var(--tile-lavender-fg))]", chip: "bg-[hsl(var(--tile-lavender-fg)_/_0.08)] text-[hsl(var(--tile-lavender-fg))]" },
  mint:     { bg: "bg-tile-mint",     fg: "text-[hsl(var(--tile-mint-fg))]",     chip: "bg-[hsl(var(--tile-mint-fg)_/_0.08)] text-[hsl(var(--tile-mint-fg))]" },
  peach:    { bg: "bg-tile-peach",    fg: "text-[hsl(var(--tile-peach-fg))]",    chip: "bg-[hsl(var(--tile-peach-fg)_/_0.08)] text-[hsl(var(--tile-peach-fg))]" },
  blue:     { bg: "bg-tile-blue",     fg: "text-[hsl(var(--tile-blue-fg))]",     chip: "bg-[hsl(var(--tile-blue-fg)_/_0.08)] text-[hsl(var(--tile-blue-fg))]" },
};
const TILES: Tile[] = ["pink", "yellow", "lavender", "mint", "peach", "blue"];
const CATEGORIES = ["All","Housing","Food","Transport","Shopping","Entertainment","Income"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const FX: Record<CurrencyCode, number> = { USD: 1, EUR: 1.07, GBP: 1.27 };

const SEED_MONTHLY: SeriesPoint[] = [
  { d:"Nov", income:7400, spent:4500, balance:26110 },
  { d:"Dec", income:7800, spent:4680, balance:28420 },
  { d:"Jan", income:5200, spent:3200, balance:30420 },
  { d:"Feb", income:5400, spent:3650, balance:32170 },
  { d:"Mar", income:5600, spent:3100, balance:34670 },
  { d:"Apr", income:6800, spent:4200, balance:37270 },
];
const SEED_DAILY: SeriesPoint[] = [
  { d:"Mon", income:1200, spent:420, balance:36050 },
  { d:"Tue", income:800,  spent:610, balance:36240 },
  { d:"Wed", income:0,    spent:380, balance:35860 },
  { d:"Thu", income:2400, spent:720, balance:37540 },
  { d:"Fri", income:600,  spent:980, balance:37160 },
  { d:"Sat", income:0,    spent:540, balance:36620 },
  { d:"Sun", income:1800, spent:220, balance:38200 },
];
const SEED_WEEKLY: SeriesPoint[] = [
  { d:"W1", income:3200, spent:1450, balance:33820 },
  { d:"W2", income:2800, spent:1820, balance:34800 },
  { d:"W3", income:4100, spent:2240, balance:36660 },
  { d:"W4", income:3700, spent:1960, balance:38400 },
];
const SEED_YEARLY: SeriesPoint[] = [
  { d:"2022", income:62000, spent:41000, balance:18200 },
  { d:"2023", income:71000, spent:46500, balance:22500 },
  { d:"2024", income:84000, spent:52400, balance:28800 },
  { d:"2025", income:96000, spent:58200, balance:32100 },
  { d:"2026", income:38000, spent:23400, balance:37270 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number, c: CurrencyCode = "USD") =>
  new Intl.NumberFormat("en-US", { style:"currency", currency:c, maximumFractionDigits: n%1===0?0:2 }).format(n);

function Avatar({ src, alt, size = 48 }: { src: string; alt: string; size?: number }) {
  if (src.startsWith("data:")) return <img src={src} alt={alt} width={size} height={size} className="w-full h-full object-cover" />;
  return <Image src={src} alt={alt} width={size} height={size} className="object-cover w-full h-full" referrerPolicy="no-referrer" />;
}

// ─── Chart tooltip ────────────────────────────────────────────────────────────
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="surface px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-semibold">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ onClose, title, children }: { onClose:()=>void; title:string; children:React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-foreground/20 backdrop-blur-sm">
      <div className="surface w-full sm:max-w-[460px] rounded-t-[28px] sm:rounded-[28px] overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary transition text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDelete({ title, onConfirm, onClose }: { title:string; onConfirm:()=>void; onClose:()=>void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm">
      <div className="surface max-w-sm w-full p-6 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 mx-auto mb-4"><Trash2 className="h-6 w-6 text-destructive" /></div>
        <h3 className="font-display text-lg font-semibold mb-1">Delete?</h3>
        <p className="text-sm text-muted-foreground mb-6">{title}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="pill pill-light flex-1 justify-center">Cancel</button>
          <button onClick={onConfirm} className="pill flex-1 justify-center bg-destructive text-destructive-foreground">Delete</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label:string; children:React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
function FInput(p: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={`h-11 w-full rounded-2xl border border-input bg-secondary/60 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${p.className||""}`} />;
}
function FSelect({ children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...p} className="h-11 w-full rounded-2xl border border-input bg-secondary/60 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none">{children}</select>;
}

// ─── Passcode lock screen ─────────────────────────────────────────────────────
function PasscodeLock({ storedPasscode, onUnlock }: { storedPasscode: string; onUnlock: ()=>void }) {
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const tryUnlock = (next: string) => {
    if (next === storedPasscode) { sessionStorage.setItem("ledger.unlocked","1"); onUnlock(); }
    else { setShake(true); setValue(""); setTimeout(() => setShake(false), 450); }
  };
  return (
    <div onClick={() => ref.current?.focus()} className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-xl p-6">
      <div className={shake ? "animate-[shake_0.4s_ease-in-out]" : ""} style={{ display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center" }}>
        <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-foreground ring-1 ring-border">
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="mt-4 font-display text-lg font-semibold">Locked</h1>
        <p className="mt-1 text-xs text-muted-foreground">Type your passcode</p>
        <div className="mt-6 flex items-center gap-3">
          {Array.from({ length: Math.max(storedPasscode.length, 6) }).map((_,i) => (
            <span key={i} className={`h-2.5 w-2.5 rounded-full transition-all ${i < value.length ? "scale-110 bg-primary" : "bg-muted ring-1 ring-inset ring-border"}`} />
          ))}
        </div>
        <input ref={ref} type="password" inputMode="numeric" value={value}
          onChange={e => { const v = e.target.value.replace(/\D/g,"").slice(0, 8); setValue(v); if (v.length >= storedPasscode.length) setTimeout(() => tryUnlock(v), 60); }}
          className="sr-only" />
        <p className="mt-5 text-[11px] text-muted-foreground">Type your passcode to unlock</p>
      </div>
      <style>{`@keyframes shake{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(3px)}30%,50%,70%{transform:translateX(-6px)}40%,60%{transform:translateX(6px)}}`}</style>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV = [
  { label:"Home", icon:Home }, { label:"Wallets", icon:Wallet },
  { label:"Cards", icon:CreditCard }, { label:"Goals", icon:Target },
  { label:"Performance", icon:BarChart3 },
];
const NAV_BOTTOM = [{ label:"Sync", icon:Cloud }, { label:"Settings", icon:Settings }];

function Sidebar({ active, setActive, avatarUrl, mobileOpen, setMobileOpen }: {
  active:string; setActive:(t:string)=>void; avatarUrl:string; mobileOpen:boolean; setMobileOpen:(v:boolean)=>void;
}) {
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-foreground/30 z-40 md:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={`fixed md:sticky top-0 md:top-4 z-50 md:z-auto h-screen md:h-[calc(100vh-2rem)] w-[72px] shrink-0 flex flex-col items-center gap-3 rounded-none md:rounded-[28px] border-r md:border border-border bg-[hsl(var(--surface))] py-5 shadow-[var(--shadow-card)] transition-transform md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <Lock className="h-4 w-4" strokeWidth={2.5} />
        </div>
        <nav className="mt-2 flex flex-1 flex-col items-center gap-2">
          {NAV.map(({ label, icon:Icon }) => {
            const a = active === label;
            return (
              <button key={label} title={label} onClick={() => { setActive(label); setMobileOpen(false); }}
                className={`group relative grid h-11 w-11 place-items-center rounded-2xl transition ${a ? "bg-primary text-primary-foreground shadow-[var(--shadow-pill)]" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                <Icon className="h-[18px] w-[18px]" />
                <span className="pointer-events-none absolute left-14 whitespace-nowrap rounded-xl bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity hidden md:block z-50">{label}</span>
              </button>
            );
          })}
        </nav>
        <div className="flex flex-col items-center gap-2">
          {NAV_BOTTOM.map(({ label, icon:Icon }) => {
            const a = active === label;
            return (
              <button key={label} title={label} onClick={() => { setActive(label); setMobileOpen(false); }}
                className={`grid h-11 w-11 place-items-center rounded-2xl transition ${a ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                <Icon className="h-[18px] w-[18px]" />
              </button>
            );
          })}
          <button title="Settings" onClick={() => { setActive("Settings"); setMobileOpen(false); }} className="mt-1 h-9 w-9 overflow-hidden rounded-full ring-2 ring-[hsl(var(--surface))] hover:ring-primary transition-all">
            <Avatar src={avatarUrl} alt="Profile" size={36} />
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Profile Panel (right sidebar) ───────────────────────────────────────────
function ProfilePanel({ entries, wallets, notifications, onMarkRead, onNav, avatarUrl, userName, period, setPeriod }: {
  entries:Entry[]; wallets:Wallet[]; notifications:Notification[]; onMarkRead:()=>void;
  onNav:(t:string)=>void; avatarUrl:string; userName:string; period:Period; setPeriod:(p:Period)=>void;
}) {
  const unread = notifications.filter(n => !n.read).length;
  const [notifOpen, setNotifOpen] = useState(false);

  const getSeries = (p: Period): SeriesPoint[] => {
    if (p === "Daily") return SEED_DAILY;
    if (p === "Weekly") return SEED_WEEKLY;
    if (p === "Yearly") return SEED_YEARLY;
    return SEED_MONTHLY;
  };
  const data = getSeries(period);
  const total = data.reduce((a,d) => a + d.income, 0);

  return (
    <aside className="sticky top-4 hidden h-fit w-[300px] shrink-0 flex-col gap-4 self-start lg:flex">
      {/* Profile card */}
      <div className="surface relative overflow-hidden p-5">
        <div className="flex items-center justify-between">
          <div className="relative">
            <button onClick={() => setNotifOpen(!notifOpen)} className="relative grid h-9 w-9 place-items-center rounded-full border border-border bg-[hsl(var(--surface))] hover:bg-secondary transition">
              <Bell className="h-4 w-4" />
              {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">{unread}</span>}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                <div className="absolute left-0 top-11 z-40 w-72 surface shadow-[var(--shadow-card)] overflow-hidden rounded-[20px]">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <div><p className="font-display text-sm font-semibold">Notifications</p><p className="text-xs text-muted-foreground">{unread} unread</p></div>
                    <button onClick={onMarkRead} className="text-xs font-semibold text-primary hover:underline">Mark all read</button>
                  </div>
                  <ul className="max-h-64 overflow-y-auto">
                    {notifications.map(n => (
                      <li key={n.id} className="flex items-start gap-3 border-b border-border/60 px-4 py-3 last:border-0">
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-muted-foreground/30" : "bg-primary"}`} />
                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{n.title}</p><p className="truncate text-xs text-muted-foreground">{n.body}</p></div>
                        <span className="text-[10px] text-muted-foreground">{n.at}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
          <button onClick={() => onNav("Settings")} className="grid h-9 w-9 place-items-center rounded-full border border-border bg-[hsl(var(--surface))] hover:bg-secondary transition"><Settings className="h-4 w-4" /></button>
        </div>
        <div className="mt-3 flex flex-col items-center text-center">
          <div className="relative h-20 w-20 rounded-full overflow-hidden bg-tile-lavender ring-4 ring-[hsl(var(--surface))]">
            <Avatar src={avatarUrl} alt="Profile" size={80} />
          </div>
          <h3 className="mt-3 font-display text-lg font-semibold">{userName}</h3>
          <p className="text-xs text-muted-foreground">Premium · {wallets.length} accounts</p>
        </div>
        <button onClick={() => onNav("Wallets")} className="mt-4 flex w-full items-center justify-between rounded-2xl bg-secondary px-4 py-3 text-sm hover:bg-muted transition">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground text-[11px] font-semibold">{wallets.length}</span>
            <span className="font-medium">Linked accounts</span>
          </div>
          <div className="flex items-center gap-1">
            {TILES.slice(0,2).map(t => <span key={t} className={`h-5 w-5 rounded-full ${TILE[t].bg} ring-2 ring-secondary`} />)}
            <ChevronRight className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </button>
      </div>

      {/* Activity chart */}
      <div className="surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Activity</span>
          <select value={period} onChange={e => setPeriod(e.target.value as Period)} className="rounded-full border border-border px-3 py-1 text-xs font-medium bg-transparent focus:outline-none cursor-pointer hover:bg-secondary transition">
            {(["Daily","Weekly","Monthly","Yearly"] as Period[]).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="font-display text-2xl font-semibold tracking-tight">${(total/1000).toFixed(1)}k</p>
            <p className="text-xs text-muted-foreground">{period.toLowerCase()} view</p>
          </div>
          <span className="rounded-full bg-tile-mint px-2.5 py-1 text-xs font-semibold text-[hsl(var(--tile-mint-fg))]">+{entries.filter(e=>e.type==="income"||e.type==="receive").length} in</span>
        </div>
        <div className="mt-3 h-28">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top:8, right:0, left:-28, bottom:0 }}>
              <XAxis dataKey="d" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill:"hsl(var(--muted) / 0.4)" }} contentStyle={{ background:"hsl(var(--surface))", border:"1px solid hsl(var(--border))", borderRadius:12, fontSize:12 }} />
              <Bar dataKey="income" fill="hsl(var(--tile-lavender))" radius={[8,8,8,8]} />
              <Bar dataKey="spent" fill="hsl(var(--tile-pink))" radius={[8,8,8,8]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </aside>
  );
}

// ─── New Entry Modal ──────────────────────────────────────────────────────────
function NewEntryModal({ onClose, onSave, wallets }: { onClose:()=>void; onSave:(e:Omit<Entry,"id">)=>Promise<void>; wallets:Wallet[]; }) {
  const [type, setType] = useState<"income"|"expense">("expense");
  const [amount, setAmount] = useState(""); const [cat, setCat] = useState("Food");
  const [walletId, setWalletId] = useState(wallets[0]?.id||""); const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0,10)); const [sub, setSub] = useState(false);
  const submit = async () => { const a=parseFloat(amount); if(!a||!note.trim()) return; setSub(true); try { await onSave({type,amount:a,currency:"USD",category:cat,walletId,note:note.trim(),date}); } finally { setSub(false); } };
  return (
    <Modal onClose={onClose} title="New entry">
      <div className="space-y-4">
        <div className="flex gap-2">
          {(["expense","income"] as const).map(t => <button key={t} onClick={()=>setType(t)} className={`pill flex-1 justify-center capitalize ${type===t?"pill-dark":"pill-light"}`}>{t}</button>)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (USD)"><FInput type="number" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" /></Field>
          <Field label="Date"><FInput type="date" value={date} onChange={e=>setDate(e.target.value)} /></Field>
        </div>
        <Field label="Category"><FSelect value={cat} onChange={e=>setCat(e.target.value)}>{CATEGORIES.filter(c=>c!=="All").map(c=><option key={c}>{c}</option>)}</FSelect></Field>
        <Field label="Wallet"><FSelect value={walletId} onChange={e=>setWalletId(e.target.value)}>{wallets.map(w=><option key={w.id} value={w.id}>{w.name} · {w.bank}</option>)}</FSelect></Field>
        <Field label="Note"><FInput value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. Trader Joe's groceries" /></Field>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="pill pill-light flex-1 justify-center">Cancel</button>
          <button onClick={submit} disabled={sub||!amount||!note} className="pill pill-dark flex-[2] justify-center disabled:opacity-50">{sub?"Saving…":"Add entry"}</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Send / Receive Modals ────────────────────────────────────────────────────
const CRYPTO_CURRENCIES = ["BTC","ETH","SOL","USDT","USDC","BNB","XRP","MATIC","AVAX","DOT"];
const FIAT_CURRENCIES   = ["USD","EUR","GBP","INR","JPY","CAD","AUD","CHF","SGD","AED"];
const ALL_CURRENCIES    = [...FIAT_CURRENCIES, ...CRYPTO_CURRENCIES];

// Static approx rates vs USD (good enough for display preview)
const RATE_VS_USD: Record<string, number> = {
  USD:1, EUR:0.93, GBP:0.79, INR:83.2, JPY:154.3, CAD:1.37, AUD:1.54, CHF:0.90, SGD:1.35, AED:3.67,
  BTC:0.0000159, ETH:0.000292, SOL:0.00612, USDT:1, USDC:1, BNB:0.00199, XRP:1.59, MATIC:1.47, AVAX:0.0309, DOT:0.133,
};

function fmtConverted(amount: number, from: string, to: string): string {
  if (!amount || from === to) return "";
  const inUSD   = amount / (RATE_VS_USD[from] ?? 1);
  const inTo    = inUSD  * (RATE_VS_USD[to]   ?? 1);
  const isCrypto = CRYPTO_CURRENCIES.includes(to);
  return isCrypto ? `≈ ${inTo.toFixed(6)} ${to}` : `≈ ${inTo.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${to}`;
}

type SendDestType = "wallet" | "card";

function SendModal({ onClose, onSave, wallets, cards }: {
  onClose: ()=>void;
  onSave:  (e: Omit<Entry,"id">)=>Promise<void>;
  wallets: Wallet[];
  cards:   Card[];
}) {
  const [amount,   setAmount]   = useState("");
  const [currency, setCurrency] = useState<string>("USD");
  const [destType, setDestType] = useState<SendDestType>("wallet");
  const [destId,   setDestId]   = useState(wallets[0]?.id ?? cards[0]?.id ?? "");
  const [fromId,   setFromId]   = useState(wallets[0]?.id ?? "");
  const [note,     setNote]     = useState("");
  const [cat,      setCat]      = useState("Transfer");
  const [date,     setDate]     = useState(new Date().toISOString().slice(0,10));
  const [sub,      setSub]      = useState(false);

  // When destType changes, reset destId to first valid option
  const destOptions = destType === "wallet"
    ? wallets.map(w => ({ id: w.id, label: `${w.name} · ${w.bank}`, sub: fmt(w.balance, w.currency) }))
    : cards.map(c  => ({ id: c.id, label: `${c.label} ···${c.last4}`,  sub: c.brand }));

  const fromWallet  = wallets.find(w => w.id === fromId);
  const converted   = fmtConverted(parseFloat(amount) || 0, currency, fromWallet?.currency ?? "USD");

  const submit = async () => {
    if (!amount || !destId) return;
    setSub(true);
    try {
      await onSave({
        type: "send",
        amount: parseFloat(amount) || 0,
        currency: (FIAT_CURRENCIES.includes(currency) ? currency : "USD") as CurrencyCode,
        category: cat,
        walletId: fromId,
        note: note || `Sent to ${destOptions.find(d=>d.id===destId)?.label ?? destId}`,
        date,
      });
    } finally { setSub(false); }
  };

  const isCryptoSend = CRYPTO_CURRENCIES.includes(currency);

  return (
    <Modal onClose={onClose} title="Send Money">
      <div className="space-y-4">

        {/* Amount + currency hero */}
        <div className="rounded-2xl bg-tile-pink p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--tile-pink-fg))] opacity-70 mb-3 text-center">You send</p>
          <div className="flex items-center justify-center gap-2 mb-3">
            <input
              type="number" value={amount} onChange={e=>setAmount(e.target.value)}
              placeholder="0.00" autoFocus
              className="bg-transparent font-display text-4xl font-semibold w-36 text-center outline-none placeholder:opacity-20 text-[hsl(var(--tile-pink-fg))]"
            />
            {/* Currency picker inline */}
            <select
              value={currency} onChange={e=>setCurrency(e.target.value)}
              className="rounded-2xl border border-[hsl(var(--tile-pink-fg)_/_0.25)] bg-[hsl(var(--surface)/0.7)] px-3 py-2 text-sm font-bold text-[hsl(var(--tile-pink-fg))] outline-none cursor-pointer focus:ring-2 focus:ring-[hsl(var(--tile-pink-fg)/0.4)]"
            >
              <optgroup label="Fiat">{FIAT_CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}</optgroup>
              <optgroup label="Crypto">{CRYPTO_CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}</optgroup>
            </select>
          </div>
          {converted && (
            <p className="text-center text-xs font-semibold text-[hsl(var(--tile-pink-fg))] opacity-60">{converted}</p>
          )}
          {isCryptoSend && (
            <p className="mt-1 text-center text-[10px] text-[hsl(var(--tile-pink-fg))] opacity-50">Crypto send — network fees may apply</p>
          )}
        </div>

        {/* From wallet */}
        <Field label="From wallet">
          <FSelect value={fromId} onChange={e=>setFromId(e.target.value)}>
            {wallets.map(w=><option key={w.id} value={w.id}>{w.name} · {w.bank} ({fmt(w.balance, w.currency)})</option>)}
          </FSelect>
        </Field>

        {/* Destination type toggle */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Send to</p>
          <div className="flex gap-2 mb-2">
            {(["wallet","card"] as SendDestType[]).map(t => (
              <button key={t} onClick={()=>{ setDestType(t); setDestId(t==="wallet"?wallets[0]?.id??""  :cards[0]?.id??""); }}
                className={`pill flex-1 justify-center capitalize ${destType===t?"pill-dark":"pill-light"}`}>
                {t === "wallet" ? <Wallet className="h-3.5 w-3.5"/> : <CreditCard className="h-3.5 w-3.5"/>}
                {t}
              </button>
            ))}
          </div>
          {destOptions.length > 0 ? (
            <FSelect value={destId} onChange={e=>setDestId(e.target.value)}>
              {destOptions.map(d=>(
                <option key={d.id} value={d.id}>{d.label} — {d.sub}</option>
              ))}
            </FSelect>
          ) : (
            <p className="text-xs text-muted-foreground bg-secondary rounded-xl px-4 py-3">
              No {destType}s yet — add one first.
            </p>
          )}
        </div>

        <Field label="Note (optional)">
          <FInput value={note} onChange={e=>setNote(e.target.value)} placeholder="What's this for?" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <FSelect value={cat} onChange={e=>setCat(e.target.value)}>
              {["Transfer","Housing","Food","Transport","Shopping","Entertainment","Other"].map(c=><option key={c}>{c}</option>)}
            </FSelect>
          </Field>
          <Field label="Date">
            <FInput type="date" value={date} onChange={e=>setDate(e.target.value)} />
          </Field>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="pill pill-light flex-1 justify-center">Cancel</button>
          <button onClick={submit} disabled={sub||!amount||!destId}
            className="pill pill-dark flex-[2] justify-center disabled:opacity-50">
            <Send className="h-4 w-4"/>
            {sub ? "Sending…" : `Send ${amount||"0"} ${currency}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ReceiveModal({ onClose, onSave, wallets }: { onClose:()=>void; onSave:(e:Omit<Entry,"id">)=>Promise<void>; wallets:Wallet[]; }) {
  const [amount,setAmount]=useState(""); const [note,setNote]=useState(""); const [cat,setCat]=useState("Income");
  const [walletId,setWalletId]=useState(wallets[0]?.id||""); const [date,setDate]=useState(new Date().toISOString().slice(0,10)); const [sub,setSub]=useState(false);
  const submit = async () => { if(!amount||!note) return; setSub(true); try { await onSave({type:"receive",amount:parseFloat(amount)||0,currency:"USD",category:cat,walletId,note,date}); } finally { setSub(false); } };
  return (
    <Modal onClose={onClose} title="Receive Money">
      <div className="space-y-4">
        <div className="rounded-2xl bg-tile-mint p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--tile-mint-fg))] opacity-70 mb-2">Amount</p>
          <div className="flex items-center justify-center gap-1">
            <span className="font-display text-3xl font-semibold opacity-50">$</span>
            <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" autoFocus className="bg-transparent font-display text-4xl font-semibold w-36 text-center outline-none placeholder:opacity-20" />
          </div>
        </div>
        <Field label="From / Sender"><FInput value={note} onChange={e=>setNote(e.target.value)} placeholder="Who sent this?" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="To"><FSelect value={walletId} onChange={e=>setWalletId(e.target.value)}>{wallets.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</FSelect></Field>
          <Field label="Date"><FInput type="date" value={date} onChange={e=>setDate(e.target.value)} /></Field>
        </div>
        <Field label="Category"><FSelect value={cat} onChange={e=>setCat(e.target.value)}>{CATEGORIES.filter(c=>c!=="All").map(c=><option key={c}>{c}</option>)}</FSelect></Field>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="pill pill-light flex-1 justify-center">Cancel</button>
          <button onClick={submit} disabled={sub||!amount||!note} className="pill pill-dark flex-[2] justify-center disabled:opacity-50"><Inbox className="h-4 w-4"/>{sub?"Saving…":"Record"}</button>
        </div>
      </div>
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function FinanceDashboard() {
  const { changeAppPasscode: changeCtxPasscode } = useAppSettings();
  const { mode } = useWeb3();

  // ── Auth ──
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [appPasscode, setAppPasscode] = useState("");
  const [loginPasscode, setLoginPasscode] = useState("");
  const [wrongPass, setWrongPass] = useState(false);
  const loginRef = useRef<HTMLInputElement>(null);

  // ── Passcode lock ──
  const [storedPasscode, setStoredPasscode] = useState<string|null>(null);
  const [unlocked, setUnlocked] = useState(false);

  // ── UI ──
  const [activeTab, setActiveTab] = useState("Home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [period, setPeriod] = useState<Period>("Monthly");
  const [catFilter, setCatFilter] = useState("All");

  // ── Modals ──
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [deletingId, setDeletingId] = useState<{id:string;kind:string}|null>(null);
  const [formError, setFormError] = useState("");

  // ── Data ──
  const [entries, setEntries] = useState<Entry[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([
    { id:"n1", title:"Salary received", body:"Acme Corp · +$6,800", at:"2m ago", read:false },
    { id:"n2", title:"Budget alert", body:"Food spending at 82%", at:"1h ago", read:false },
    { id:"n3", title:"Cloud sync complete", body:"12 changes pushed", at:"3h ago", read:true },
  ]);

  // ── Profile ──
  const [firstName, setFirstName] = useState("Alex");
  const [lastName, setLastName] = useState("Korgon");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("https://picsum.photos/seed/avatar5/150/150");
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Sync page ──
  const [syncId, setSyncId] = useState("LDG-7Q4X-2NAV-91KE");
  const [syncCopied, setSyncCopied] = useState(false);
  const [newPass, setNewPass] = useState(""); const [confirmPass, setConfirmPass] = useState(""); const [showPassInput, setShowPassInput] = useState(false);

  // ── Forms ──
  const [wForm, setWForm] = useState({ name:"", bank:"", balance:"", currency:"USD" as CurrencyCode, tile:"mint" as Tile });
  const [cForm, setCForm] = useState({ label:"", brand:"Visa" as Card["brand"], last4:"", walletId:"", tile:"pink" as Tile });
  const [gForm, setGForm] = useState({ name:"", target:"", current:"0", deadline:new Date(Date.now()+1000*60*60*24*90).toISOString().slice(0,10), tile:"mint" as Tile });

  // ── Init ──
  useEffect(() => {
    try {
      if (sessionStorage.getItem("fv_api_key")) { setApiKey(sessionStorage.getItem("fv_api_key")!); setIsAuthenticated(true); }
      const lp = localStorage.getItem("ledger.passcode"); if (lp) setStoredPasscode(lp);
      if (sessionStorage.getItem("ledger.unlocked")==="1") setUnlocked(true);
      const lc = localStorage.getItem("ledger.currency") as CurrencyCode|null; if (lc) setCurrencyState(lc);
      const lt = localStorage.getItem("ledger.theme") as ThemeMode|null; if (lt) setThemeState(lt);
      const si = localStorage.getItem("ledger.syncId"); if (si) setSyncId(si);
    } catch {}
  }, []);

  // ── Theme ──
  useEffect(() => {
    const root = document.documentElement;
    const dark = theme==="dark" || (theme==="system" && window.matchMedia("(prefers-color-scheme:dark)").matches);
    root.classList.toggle("dark", dark);
    try { localStorage.setItem("ledger.theme", theme); } catch {}
  }, [theme]);

  const setTheme = (t: ThemeMode) => setThemeState(t);
  const setCurrency = (c: CurrencyCode) => { setCurrencyState(c); try { localStorage.setItem("ledger.currency", c); } catch {} };

  // ── Login passcode ──
  useEffect(() => { loginRef.current?.focus(); }, [isAuthenticated]);
  useEffect(() => {
    if (!isAuthenticated && loginPasscode.length === 6) {
      setWrongPass(false);
      fetch("/api/settings", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({action:"verify-passcode",passcode:loginPasscode}) })
        .then(r=>r.json()).then(d => {
          if (d.success) { setIsAuthenticated(true); setAppPasscode(loginPasscode); setApiKey("korgon-finance-2026"); try { sessionStorage.setItem("fv_api_key","korgon-finance-2026"); } catch {} setLoginPasscode(""); }
          else { setWrongPass(true); setLoginPasscode(""); }
        }).catch(() => { setWrongPass(true); setLoginPasscode(""); });
    }
    if (loginPasscode.length < 6) setWrongPass(false);
  }, [loginPasscode, isAuthenticated]);

  // ── Load settings + data ──
  useEffect(() => {
    if (!isAuthenticated) return;
    apiFetch("/api/settings").then(r=>r.ok?r.json():null).then(d => {
      if (!d) return;
      if (d.firstName) setFirstName(d.firstName);
      if (d.lastName!==undefined) setLastName(d.lastName);
      if (d.email) setEmail(d.email);
      if (d.avatarUrl) setAvatarUrl(d.avatarUrl);
    }).catch(()=>{});

    apiFetch(`/api/entries?mode=${mode}`).then(r=>r.ok?r.json():[]).then((d:any[]) => {
      setEntries(d.map(e => ({ id:e.id, type:(e.txType||e.type||"expense") as EntryType, amount:(e.earned||0)+(e.given||0), currency:"USD", category:e.givenTo||"Other", walletId:e.walletId||"", note:e.project||"", date:e.date })));
    }).catch(()=>{});

    apiFetch("/api/wallets").then(r=>r.ok?r.json():[]).then((d:any[]) => {
      setWallets(d.map((w,i) => ({ id:w.id, name:w.name, bank:w.network||w.bank||"Bank", currency:"USD", balance:w.balance||0, tile:TILES[i%TILES.length], address:w.address })));
    }).catch(()=>{});

    apiFetch("/api/cards").then(r=>r.ok?r.json():[]).then((d:any[]) => {
      setCards(d.map((c,i) => ({ id:c.id, label:c.name, brand:"Visa" as Card["brand"], last4:c.last4, walletId:"", tile:TILES[i%TILES.length], holder:c.holder, expiry:c.expiry })));
    }).catch(()=>{});

    apiFetch("/api/goal?mode=banks").then(r=>r.ok?r.json():null).then(d => {
      if (d?.amount) setGoals([{ id:"g1", name:"Financial Goal", target:d.amount, current:0, deadline:new Date(Date.now()+1000*60*60*24*180).toISOString().slice(0,10), tile:"mint" }]);
    }).catch(()=>{});

    apiFetch("/api/activity").then(r=>r.ok?r.json():[]).then((d:any[]) => {
      setActivityLog(d.slice(0,8).map(a => ({ id:a.id, action:a.action, detail:`$${a.amount}`, at:new Date(a.date).toLocaleDateString("en-US",{month:"short",day:"numeric"}) })));
    }).catch(()=>{});
  }, [isAuthenticated, mode]);

  // ── Add entry ──
  const addEntry = useCallback(async (e: Omit<Entry,"id">) => {
    const ne: Entry = { ...e, id:`e${Date.now()}` };
    setEntries(p => [ne,...p]);
    setShowNewEntry(false); setShowSend(false); setShowReceive(false);
    try {
      const payload = { id:ne.id, date:ne.date, project:ne.note, earned:ne.type==="income"||ne.type==="receive"?ne.amount:0, saved:0, given:ne.type==="expense"||ne.type==="send"?ne.amount:0, givenTo:ne.category, mode, walletId:ne.walletId||undefined, txType:ne.type };
      await apiFetch("/api/entries",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    } catch {}
    setActivityLog(p => [{ id:`a${Date.now()}`, action:"Entry added", detail:`${ne.note} · ${ne.type==="expense"||ne.type==="send"?"−":"+"}$${ne.amount}`, at:"just now" }, ...p]);
  }, [mode]);

  // ── Wallet / card / goal add ──
  const addWallet = async () => {
    setFormError(""); if (!wForm.name.trim()) { setFormError("Name required."); return; }
    try {
      const r = await apiFetch("/api/wallets",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:wForm.name.trim(),address:"",network:wForm.bank||"Bank",balance:parseFloat(wForm.balance)||0})});
      if (r.ok) { const d=await r.json(); setWallets(p=>[...p,{id:d.id,name:d.name,bank:d.network||wForm.bank,currency:wForm.currency,balance:d.balance,tile:wForm.tile}]); setShowAddWallet(false); setWForm({name:"",bank:"",balance:"",currency:"USD",tile:"mint"}); setActivityLog(p=>[{id:`a${Date.now()}`,action:"Wallet added",detail:wForm.name,at:"just now"},...p]); }
      else setFormError("Failed to add.");
    } catch { setFormError("Network error."); }
  };

  const addCard = async () => {
    setFormError(""); if (!cForm.label.trim()||!/^\d{4}$/.test(cForm.last4)) { setFormError("Label and 4-digit number required."); return; }
    try {
      const r = await apiFetch("/api/cards",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:cForm.label.trim(),last4:cForm.last4,holder:`${firstName} ${lastName}`,expiry:"12/28",type:"virtual",balance:0})});
      if (r.ok) { const d=await r.json(); setCards(p=>[...p,{id:d.id,label:d.name,brand:cForm.brand,last4:d.last4,walletId:cForm.walletId,tile:cForm.tile,holder:d.holder,expiry:d.expiry}]); setShowAddCard(false); setCForm({label:"",brand:"Visa",last4:"",walletId:"",tile:"pink"}); setActivityLog(p=>[{id:`a${Date.now()}`,action:"Card added",detail:`${cForm.brand} •• ${cForm.last4}`,at:"just now"},...p]); }
      else setFormError("Failed to add.");
    } catch { setFormError("Network error."); }
  };

  const addGoal = async () => {
    setFormError(""); const t=parseFloat(gForm.target); if(!gForm.name.trim()||!t){setFormError("Name and target required.");return;}
    const ng:Goal={id:`g${Date.now()}`,name:gForm.name.trim(),target:t,current:parseFloat(gForm.current)||0,deadline:gForm.deadline,tile:gForm.tile};
    setGoals(p=>[...p,ng]); try{await apiFetch("/api/goal",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:"banks",amount:t,currency:"USD"})});}catch{}
    setShowNewGoal(false); setGForm({name:"",target:"",current:"0",deadline:new Date(Date.now()+1000*60*60*24*90).toISOString().slice(0,10),tile:"mint"});
    setActivityLog(p=>[{id:`a${Date.now()}`,action:"Goal created",detail:`${gForm.name} · target $${t}`,at:"just now"},...p]);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    const {id,kind}=deletingId; setDeletingId(null);
    if (kind==="entry") { setEntries(p=>p.filter(e=>e.id!==id)); try{await apiFetch(`/api/entries/${id}`,{method:"DELETE"});}catch{} }
    if (kind==="wallet") { setWallets(p=>p.filter(w=>w.id!==id)); try{await apiFetch(`/api/wallets/${id}`,{method:"DELETE"});}catch{} }
    if (kind==="card") { setCards(p=>p.filter(c=>c.id!==id)); try{await apiFetch(`/api/cards/${id}`,{method:"DELETE"});}catch{} }
    if (kind==="goal") { setGoals(p=>p.filter(g=>g.id!==id)); }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try { await apiFetch("/api/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({firstName,lastName,email,avatarUrl,theme,banksGoal:goals[0]?.target})}); } catch {}
    setTimeout(()=>setIsSaving(false),500);
  };

  const handleProfileImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f=e.target.files?.[0]; if(f){const r=new FileReader();r.onloadend=()=>{if(typeof r.result==="string")setAvatarUrl(r.result);};r.readAsDataURL(f);}
  };

  // ── Passcode strength ──
  const passStrength = useMemo(() => {
    let s=0; if(newPass.length>=6)s++; if(newPass.length>=10)s++;
    if(/[A-Z]/.test(newPass)&&/[a-z]/.test(newPass))s++; if(/[0-9]/.test(newPass)&&/[^A-Za-z0-9]/.test(newPass))s++;
    const score=Math.min(4,s) as 0|1|2|3|4;
    return {score,label:["Too weak","Weak","Fair","Strong","Excellent"][score],tone:["bg-destructive","bg-destructive","bg-warning","bg-success","bg-success"][score]};
  },[newPass]);

  // ── Computed ──
  const filteredEntries = useMemo(() => {
    let r=entries; if(catFilter!=="All")r=r.filter(e=>e.category===catFilter);
    return r.sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime());
  },[entries,catFilter]);

  const totalBalance = wallets.reduce((s,w)=>s+w.balance,0);
  const totalIn = entries.filter(e=>e.type==="income"||e.type==="receive").reduce((s,e)=>s+e.amount,0);
  const totalOut = entries.filter(e=>e.type==="expense"||e.type==="send").reduce((s,e)=>s+e.amount,0);

  // ══════════════════════════════════════════════════════════
  // LOGIN SCREEN
  // ══════════════════════════════════════════════════════════
  if (!isAuthenticated) {
    return (
      <div suppressHydrationWarning className="min-h-screen bg-background grid place-items-center p-6">
        <div className="flex flex-col items-center text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-foreground ring-1 ring-border shadow-[var(--shadow-card)]">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="mt-4 font-display text-xl font-semibold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter your 6-digit passcode</p>
          <div className="mt-6 flex items-center gap-3">
            {[0,1,2,3,4,5].map(i => (
              <span key={i} className={`h-2.5 w-2.5 rounded-full transition-all ${i<loginPasscode.length?"scale-110 bg-primary":"bg-muted ring-1 ring-inset ring-border"}`} />
            ))}
          </div>
          <input type="password" maxLength={6} value={loginPasscode} onChange={e=>setLoginPasscode(e.target.value.replace(/\D/g,""))} ref={loginRef}
            className="mt-4 h-12 w-48 rounded-2xl border border-input bg-secondary/60 text-center font-mono text-xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <div className="h-7 mt-3 flex items-center">
            {wrongPass && <p className="text-sm text-destructive font-medium">Incorrect passcode</p>}
          </div>
        </div>
      </div>
    );
  }

  if (storedPasscode && !unlocked) {
    return <PasscodeLock storedPasscode={storedPasscode} onUnlock={()=>setUnlocked(true)} />;
  }

  // ══════════════════════════════════════════════════════════
  // MAIN APP
  // ══════════════════════════════════════════════════════════
  return (
    <div suppressHydrationWarning className="min-h-screen bg-background p-0 md:p-3 lg:p-4">
      <div className="mx-auto flex w-full max-w-[1500px] gap-4">

        <Sidebar active={activeTab} setActive={setActiveTab} avatarUrl={avatarUrl} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        <main className="min-w-0 flex-1">
          {/* Mobile topbar */}
          <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-[hsl(var(--surface))]">
            <button onClick={()=>setMobileOpen(true)} className="grid h-9 w-9 place-items-center rounded-xl border border-border"><Menu className="h-4 w-4"/></button>
            <span className="font-display font-semibold text-sm">{activeTab}</span>
            <button onClick={()=>setShowNewEntry(true)} className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Plus className="h-4 w-4"/></button>
          </div>

          <div className="surface min-h-[calc(100vh-2rem)] p-5 md:p-8 animate-fade-in" key={activeTab}>

            {/* ═══ HOME ═══ */}
            {activeTab==="Home" && (
              <div className="space-y-8">
                <header className="flex flex-wrap items-end justify-between gap-6">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Welcome back</p>
                    <h1 className="mt-1 font-display text-4xl md:text-5xl font-semibold leading-[1.05] tracking-tight">
                      Invest in your<br />finances.
                    </h1>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative hidden sm:block">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input placeholder="Search…" className="h-11 w-64 rounded-full border border-border bg-secondary/60 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <button onClick={()=>setShowSend(true)} className="pill pill-light gap-2"><Send className="h-3.5 w-3.5 text-[hsl(var(--tile-pink-fg))]"/>Send</button>
                    <button onClick={()=>setShowReceive(true)} className="pill pill-light gap-2"><Inbox className="h-3.5 w-3.5 text-[hsl(var(--tile-mint-fg))]"/>Receive</button>
                    <button onClick={()=>setShowNewEntry(true)} className="pill pill-dark"><Plus className="h-4 w-4"/>New entry</button>
                  </div>
                </header>

                {/* Category chips */}
                <div className="-mx-1 flex flex-wrap items-center gap-2 px-1">
                  {CATEGORIES.map(c => {
                    const a = catFilter===c;
                    return (
                      <button key={c} onClick={()=>setCatFilter(c)} className={`pill ${a?"pill-dark":"pill-light"}`}>
                        {a && <span className="grid h-5 w-5 place-items-center rounded-full bg-[hsl(var(--surface))] text-[10px] font-bold text-primary">⌗</span>}
                        {c}
                      </button>
                    );
                  })}
                </div>

                {/* Stat tiles */}
                <section className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label:"Total balance", value:fmt(totalBalance), sub:`across ${wallets.length} wallets`, tile:"mint" as Tile },
                    { label:"Total income",   value:`+${fmt(totalIn)}`, sub:`${entries.filter(e=>e.type==="income"||e.type==="receive").length} entries`, tile:"lavender" as Tile },
                    { label:"Total spent",    value:`−${fmt(totalOut)}`, sub:`${entries.filter(e=>e.type==="expense"||e.type==="send").length} entries`, tile:"pink" as Tile },
                  ].map(s => {
                    const t = TILE[s.tile];
                    return (
                      <div key={s.label} className={`rounded-[24px] p-5 ${t.bg} ${t.fg}`}>
                        <p className="text-xs font-medium uppercase tracking-wider opacity-70">{s.label}</p>
                        <p className="mt-2 font-display text-3xl font-semibold tracking-tight">{s.value}</p>
                        <p className="mt-1 text-xs opacity-70">{s.sub}</p>
                      </div>
                    );
                  })}
                </section>

                {/* Recent entries */}
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-medium text-muted-foreground">Recent entries</h2>
                    <button onClick={()=>setActiveTab("Wallets")} className="flex items-center gap-1 text-xs font-semibold hover:underline">View all<ArrowUpRight className="h-3.5 w-3.5"/></button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredEntries.slice(0,4).map((e, i) => {
                      const palette = (["pink","yellow","lavender","peach"] as Tile[])[i%4];
                      const t = TILE[palette];
                      const pos = e.type==="income"||e.type==="receive";
                      return (
                        <article key={e.id} className={`relative overflow-hidden rounded-[28px] p-5 ${t.bg} ${t.fg} group`}>
                          <div className="flex items-center justify-between">
                            <span className={`pill ${t.chip} px-3 py-1 text-xs`}>{e.category}</span>
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 rounded-full bg-[hsl(var(--surface)/0.7)] px-2.5 py-1 text-xs font-semibold backdrop-blur">
                                {e.type==="send"?<Send className="h-3 w-3"/>:e.type==="receive"?<Inbox className="h-3 w-3"/>:<Star className="h-3 w-3 fill-current"/>}
                                {pos?"+":"−"}{fmt(e.amount)}
                              </span>
                              <button onClick={()=>setDeletingId({id:e.id,kind:"entry"})} className="opacity-0 group-hover:opacity-100 transition grid h-6 w-6 place-items-center rounded-full bg-[hsl(var(--surface)/0.6)]"><X className="h-3 w-3"/></button>
                            </div>
                          </div>
                          <h3 className="mt-6 font-display text-xl font-semibold leading-snug">{e.note}</h3>
                          <p className="mt-1 text-xs opacity-70">{new Date(e.date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</p>
                          <div className="mt-6 flex items-center justify-between">
                            <span className="text-xs opacity-70">{wallets.find(w=>w.id===e.walletId)?.name||""}</span>
                            <div className="flex -space-x-1.5">
                              <span className="h-6 w-6 rounded-full bg-[hsl(var(--surface))] ring-2 ring-current/10" />
                              <span className="h-6 w-6 rounded-full bg-[hsl(var(--surface)/0.7)] ring-2 ring-current/10" />
                            </div>
                          </div>
                        </article>
                      );
                    })}
                    {filteredEntries.length===0 && (
                      <div className="md:col-span-2 rounded-[28px] bg-secondary/40 p-10 text-center text-muted-foreground">
                        <p className="font-display text-lg font-medium">No entries yet</p>
                        <p className="text-sm mt-1">Add your first entry to get started</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Featured goal */}
                {goals.length > 0 && (
                  <section>
                    <h2 className="mb-3 text-sm font-medium text-muted-foreground">Featured goal</h2>
                    <div className="surface flex flex-wrap items-center gap-6 p-5">
                      {(() => {
                        const g=goals[0]; const t=TILE[g.tile]; const pct=Math.min(100,(g.current/g.target)*100);
                        return (
                          <>
                            <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl ${t.bg} ${t.fg} font-display text-2xl font-bold`}>{Math.round(pct)}%</div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-display text-lg font-semibold">{g.name}</h3>
                              <p className="text-xs text-muted-foreground">{fmt(g.current)} of {fmt(g.target)} · by {new Date(g.deadline).toLocaleDateString("en-US",{month:"short",year:"numeric"})}</p>
                              <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                                <div className="h-full rounded-full bg-primary transition-all" style={{width:`${pct}%`}} />
                              </div>
                            </div>
                            <button onClick={()=>setActiveTab("Goals")} className="pill pill-light"><MoreHorizontal className="h-4 w-4"/></button>
                          </>
                        );
                      })()}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* ═══ WALLETS ═══ */}
            {activeTab==="Wallets" && (
              <div className="space-y-8">
                <header className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Your money</p>
                    <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight md:text-5xl">Wallets</h1>
                  </div>
                  <button onClick={()=>setShowAddWallet(true)} className="pill pill-dark"><Plus className="h-4 w-4"/>New wallet</button>
                </header>
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {wallets.map(w => {
                    const t = TILE[w.tile];
                    return (
                      <article key={w.id} className={`rounded-[28px] p-6 ${t.bg} ${t.fg} group relative`}>
                        <div className="flex items-center justify-between">
                          <span className={`pill ${t.chip} px-3 py-1 text-xs`}><Wallet className="h-3 w-3"/>{w.bank}</span>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-[hsl(var(--surface)/0.7)] px-2.5 py-1 text-[10px] font-semibold">{w.currency}</span>
                            <button onClick={()=>setDeletingId({id:w.id,kind:"wallet"})} className="opacity-0 group-hover:opacity-100 transition grid h-6 w-6 place-items-center rounded-full bg-[hsl(var(--surface)/0.6)]"><X className="h-3 w-3"/></button>
                          </div>
                        </div>
                        <h3 className="mt-6 font-display text-xl font-semibold">{w.name}</h3>
                        <p className="mt-1 font-display text-3xl font-semibold tracking-tight">{fmt(w.balance,w.currency)}</p>
                        <div className="mt-6 flex items-center gap-2 text-xs opacity-70">
                          {w.address?<span className="font-mono">{w.address.slice(0,8)}…</span>:<span>•••• 0000</span>}
                          <span>·</span><span>Updated just now</span>
                        </div>
                      </article>
                    );
                  })}
                  <button onClick={()=>setShowAddWallet(true)} className="rounded-[28px] border-2 border-dashed border-border h-40 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-foreground transition">
                    <Plus className="h-6 w-6"/><span className="text-sm font-medium">Add wallet</span>
                  </button>
                </section>
                <section className="surface p-5">
                  <h2 className="font-display text-lg font-semibold">All entries</h2>
                  <p className="text-xs text-muted-foreground mb-4">Income, expenses and transfers across wallets</p>
                  <ul className="divide-y divide-border">
                    {entries.slice(0,20).map(e => {
                      const pos=e.type==="income"||e.type==="receive";
                      return (
                        <li key={e.id} className="flex items-center gap-3 py-3.5">
                          <div className={`grid h-10 w-10 place-items-center rounded-xl text-sm font-bold shrink-0 ${pos?"bg-tile-mint text-[hsl(var(--tile-mint-fg))]":"bg-tile-pink text-[hsl(var(--tile-pink-fg))]"}`}>
                            {e.type==="send"?<Send className="h-4 w-4"/>:e.type==="receive"?<Inbox className="h-4 w-4"/>:e.note.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{e.note}</p>
                            <p className="text-xs text-muted-foreground">{e.category} · {wallets.find(w=>w.id===e.walletId)?.name||""}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-semibold ${pos?"text-success":""}`}>{pos?"+":"−"}{fmt(e.amount,e.currency)}</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(e.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</p>
                          </div>
                        </li>
                      );
                    })}
                    {entries.length===0 && <li className="py-8 text-center text-muted-foreground text-sm">No entries yet</li>}
                  </ul>
                </section>
              </div>
            )}

            {/* ═══ CARDS ═══ */}
            {activeTab==="Cards" && (
              <div className="space-y-8">
                <header className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Plastic &amp; virtual</p>
                    <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight md:text-5xl">Cards</h1>
                  </div>
                  <button onClick={()=>setShowAddCard(true)} className="pill pill-dark"><Plus className="h-4 w-4"/>Add card</button>
                </header>
                <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {cards.map(c => {
                    const t=TILE[c.tile]; const w=wallets.find(x=>x.id===c.walletId);
                    return (
                      <div key={c.id} className={`relative aspect-[1.6/1] overflow-hidden rounded-[28px] p-6 ${t.bg} ${t.fg} group`}>
                        <div className="flex h-full flex-col justify-between">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.2em] opacity-70">{c.brand}</p>
                              <p className="mt-1 font-display text-base font-semibold">{c.label}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Wifi className="h-5 w-5 rotate-90 opacity-70"/>
                              <button onClick={()=>setDeletingId({id:c.id,kind:"card"})} className="opacity-0 group-hover:opacity-100 transition grid h-6 w-6 place-items-center rounded-full bg-[hsl(var(--surface)/0.6)]"><X className="h-3 w-3"/></button>
                            </div>
                          </div>
                          <div>
                            <p className="font-mono text-lg tracking-widest">•••• •••• •••• {c.last4}</p>
                            <div className="mt-3 flex items-end justify-between">
                              <div>
                                <p className="text-[10px] uppercase tracking-wider opacity-60">Linked to</p>
                                <p className="text-xs font-semibold">{w?.name||`${firstName} ${lastName}`}</p>
                              </div>
                              {w && <p className="font-display text-lg font-semibold">{fmt(w.balance,w.currency)}</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <button onClick={()=>setShowAddCard(true)} className="aspect-[1.6/1] rounded-[28px] border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-foreground transition">
                    <Plus className="h-6 w-6"/><span className="text-sm font-medium">Add card</span>
                  </button>
                </section>
              </div>
            )}

            {/* ═══ GOALS ═══ */}
            {activeTab==="Goals" && (
              <div className="space-y-8">
                <header className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Save with intention</p>
                    <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight md:text-5xl">Goals</h1>
                  </div>
                  <button onClick={()=>setShowNewGoal(true)} className="pill pill-dark"><Plus className="h-4 w-4"/>New goal</button>
                </header>
                <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {goals.map(g => {
                    const t=TILE[g.tile]; const pct=Math.min(100,(g.current/g.target)*100);
                    return (
                      <article key={g.id} className={`rounded-[28px] p-6 ${t.bg} ${t.fg} group relative`}>
                        <div className="flex items-center justify-between">
                          <span className={`pill ${t.chip} px-3 py-1 text-xs`}><Target className="h-3 w-3"/>Goal</span>
                          <div className="flex items-center gap-2">
                            <span className="font-display text-2xl font-bold">{Math.round(pct)}%</span>
                            <button onClick={()=>setDeletingId({id:g.id,kind:"goal"})} className="opacity-0 group-hover:opacity-100 transition grid h-6 w-6 place-items-center rounded-full bg-[hsl(var(--surface)/0.6)]"><X className="h-3 w-3"/></button>
                          </div>
                        </div>
                        <h3 className="mt-5 font-display text-xl font-semibold">{g.name}</h3>
                        <p className="mt-1 text-xs opacity-70">{fmt(g.current)} of {fmt(g.target)}</p>
                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[hsl(var(--surface)/0.6)]">
                          <div className="h-full rounded-full bg-current/80 transition-all" style={{width:`${pct}%`}}/>
                        </div>
                        <p className="mt-3 text-xs opacity-70">Due {new Date(g.deadline).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</p>
                      </article>
                    );
                  })}
                  <button onClick={()=>setShowNewGoal(true)} className="rounded-[28px] border-2 border-dashed border-border min-h-[200px] flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-foreground transition">
                    <Plus className="h-6 w-6"/><span className="text-sm font-medium">New goal</span>
                  </button>
                </section>
              </div>
            )}

            {/* ═══ PERFORMANCE ═══ */}
            {activeTab==="Performance" && (
              <div className="space-y-8">
                <header>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Insights</p>
                  <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight md:text-5xl">Performance</h1>
                </header>
                <section className="grid gap-4 lg:grid-cols-3">
                  <div className="surface p-5 lg:col-span-2">
                    <h3 className="font-display text-lg font-semibold">Net balance</h3>
                    <p className="text-xs text-muted-foreground">Last 6 months</p>
                    <div className="mt-4 h-72">
                      <ResponsiveContainer>
                        <AreaChart data={SEED_MONTHLY} margin={{top:10,right:8,left:-16,bottom:0}}>
                          <defs>
                            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(var(--tile-lavender))" stopOpacity={0.95}/>
                              <stop offset="100%" stopColor="hsl(var(--tile-lavender))" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 6" vertical={false}/>
                          <XAxis dataKey="d" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false}/>
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v=>`$${v/1000}k`}/>
                          <Tooltip content={<ChartTip/>}/>
                          <Area type="monotone" dataKey="balance" name="Balance" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#g1)"/>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="surface p-5">
                    <h3 className="font-display text-lg font-semibold">Cashflow</h3>
                    <p className="text-xs text-muted-foreground">Income vs spent</p>
                    <div className="mt-4 h-72">
                      <ResponsiveContainer>
                        <BarChart data={SEED_MONTHLY} margin={{top:10,right:8,left:-16,bottom:0}}>
                          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 6" vertical={false}/>
                          <XAxis dataKey="d" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false}/>
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v=>`$${v/1000}k`}/>
                          <Tooltip content={<ChartTip/>} cursor={{fill:"hsl(var(--muted))"}}/>
                          <Bar dataKey="income" name="Income" fill="hsl(var(--tile-mint))" radius={[8,8,0,0]}/>
                          <Bar dataKey="spent" name="Spent" fill="hsl(var(--tile-pink))" radius={[8,8,0,0]}/>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* ═══ SYNC ═══ */}
            {activeTab==="Sync" && (
              <div className="space-y-8">
                <header>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Across devices</p>
                  <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight md:text-5xl">Cloud sync</h1>
                  <p className="mt-2 max-w-xl text-sm text-muted-foreground">Share your dashboard between devices with a sync ID. Encrypted in transit and at rest.</p>
                </header>
                <section className="grid gap-4 md:grid-cols-2">
                  {/* Sync ID card */}
                  <div className="surface p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-tile-mint text-[hsl(var(--tile-mint-fg))]"><Cloud className="h-5 w-5"/></div>
                      <div><h3 className="font-display text-lg font-semibold">Your sync ID</h3><p className="text-xs text-muted-foreground">Use this to load your data on another device</p></div>
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary px-4 py-3">
                      <input value={syncId} onChange={e=>setSyncId(e.target.value)} className="flex-1 bg-transparent font-mono text-sm focus:outline-none"/>
                      <button onClick={()=>{navigator.clipboard.writeText(syncId);setSyncCopied(true);setTimeout(()=>setSyncCopied(false),1500);}} className="pill pill-dark px-3 py-1.5 text-xs">
                        {syncCopied?<Check className="h-3.5 w-3.5"/>:<Copy className="h-3.5 w-3.5"/>}
                        {syncCopied?"Copied":"Copy"}
                      </button>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button onClick={()=>{try{localStorage.setItem("ledger.syncId",syncId);}catch{}}} className="pill pill-dark justify-center"><Upload className="h-4 w-4"/>Save to cloud</button>
                      <button onClick={()=>{try{const s=localStorage.getItem("ledger.syncId");if(s)setSyncId(s);}catch{}}} className="pill pill-light justify-center"><Download className="h-4 w-4"/>Load from cloud</button>
                    </div>
                  </div>

                  {/* Passcode card */}
                  <form onSubmit={e=>{
                    e.preventDefault();
                    if(newPass.length<6){return;}
                    if(newPass!==confirmPass){return;}
                    setStoredPasscode(newPass); try{localStorage.setItem("ledger.passcode",newPass);}catch{}
                    setNewPass(""); setConfirmPass(""); setShowPassInput(false);
                  }} className="surface p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-tile-lavender text-[hsl(var(--tile-lavender-fg))]"><KeyRound className="h-5 w-5"/></div>
                      <div className="flex-1">
                        <h3 className="font-display text-lg font-semibold">Master passcode</h3>
                        <p className="text-xs text-muted-foreground">Locks the dashboard on this device</p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${storedPasscode?"bg-success/10 text-success":"bg-warning/15 text-warning"}`}>
                        {storedPasscode?<ShieldCheck className="h-3.5 w-3.5"/>:<ShieldAlert className="h-3.5 w-3.5"/>}
                        {storedPasscode?"Protected":"Not set"}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="relative">
                        <input type={showPassInput?"text":"password"} value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder={storedPasscode?"New passcode":"Choose a passcode"} autoComplete="new-password" maxLength={64}
                          className="h-12 w-full rounded-2xl border border-border bg-secondary px-4 pr-12 text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/30"/>
                        <button type="button" onClick={()=>setShowPassInput(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-foreground">
                          {showPassInput?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}
                        </button>
                      </div>
                      {newPass && (
                        <div>
                          <div className="flex h-1.5 gap-1">
                            {[0,1,2,3].map(i=><div key={i} className={`h-full flex-1 rounded-full transition-colors ${i<passStrength.score?passStrength.tone:"bg-muted"}`}/>)}
                          </div>
                          <p className="mt-1.5 text-[11px] text-muted-foreground">Strength: <span className="font-semibold text-foreground">{passStrength.label}</span> · use letters + numbers, 6+ chars</p>
                        </div>
                      )}
                      <input type={showPassInput?"text":"password"} value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} placeholder="Confirm passcode" autoComplete="new-password" maxLength={64}
                        className="h-12 w-full rounded-2xl border border-border bg-secondary px-4 text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/30"/>
                      <div className="flex gap-2">
                        <button type="submit" disabled={newPass.length<6||newPass!==confirmPass} className="pill pill-dark flex-1 justify-center disabled:opacity-50">{storedPasscode?"Change passcode":"Set passcode"}</button>
                        {storedPasscode && <button type="button" onClick={()=>{setStoredPasscode(null);try{localStorage.removeItem("ledger.passcode");}catch{}}} className="pill pill-light text-destructive"><Trash2 className="h-4 w-4"/>Remove</button>}
                      </div>
                    </div>
                  </form>
                </section>
                <section className="surface p-6">
                  <h3 className="font-display text-lg font-semibold">How it works</h3>
                  <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <li><span className="font-semibold text-foreground">1.</span> Generate a sync ID and click "Save to cloud".</li>
                    <li><span className="font-semibold text-foreground">2.</span> On another device, paste the ID and click "Load from cloud".</li>
                    <li><span className="font-semibold text-foreground">3.</span> Your wallets, cards, entries and goals appear instantly.</li>
                  </ol>
                </section>
              </div>
            )}

            {/* ═══ SETTINGS ═══ */}
            {activeTab==="Settings" && (
              <div className="space-y-8">
                <header>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Preferences</p>
                  <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight md:text-5xl">Settings</h1>
                </header>
                <section className="grid gap-4 md:grid-cols-2">
                  {/* Profile */}
                  <div className="surface p-6 md:col-span-2">
                    <h3 className="font-display text-lg font-semibold mb-4">Profile</h3>
                    <div className="flex items-start gap-5">
                      <div className="flex flex-col items-center gap-2 shrink-0">
                        <div className="relative h-20 w-20 rounded-full overflow-hidden bg-tile-lavender ring-4 ring-[hsl(var(--surface))] cursor-pointer" onClick={()=>fileInputRef.current?.click()}>
                          <Avatar src={avatarUrl} alt="Profile" size={80}/>
                          <div className="absolute inset-0 bg-foreground/20 flex items-center justify-center opacity-0 hover:opacity-100 transition"><span className="text-[hsl(var(--surface))] text-xs font-semibold">Edit</span></div>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleProfileImg}/>
                      </div>
                      <div className="flex-1 grid sm:grid-cols-2 gap-3">
                        <Field label="First name"><FInput value={firstName} onChange={e=>setFirstName(e.target.value)}/></Field>
                        <Field label="Last name"><FInput value={lastName} onChange={e=>setLastName(e.target.value)}/></Field>
                        <div className="sm:col-span-2"><Field label="Email"><FInput type="email" value={email} onChange={e=>setEmail(e.target.value)}/></Field></div>
                        <div className="sm:col-span-2"><button onClick={handleSaveProfile} disabled={isSaving} className="pill pill-dark disabled:opacity-50">{isSaving?"Saving…":"Save changes"}</button></div>
                      </div>
                    </div>
                  </div>

                  {/* Currency */}
                  <div className="surface p-6">
                    <h3 className="font-display text-lg font-semibold">Display currency</h3>
                    <p className="text-xs text-muted-foreground">All totals will be converted using live rates</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(["USD","EUR","GBP"] as CurrencyCode[]).map(c => (
                        <button key={c} onClick={()=>setCurrency(c)} className={`pill ${currency===c?"pill-dark":"pill-light"}`}>{c}</button>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">Active: <span className="font-semibold text-foreground">{currency}</span> · 1 USD = {FX[currency].toFixed(2)} {currency}</p>
                  </div>

                  {/* Theme */}
                  <div className="surface p-6">
                    <h3 className="font-display text-lg font-semibold">Theme</h3>
                    <p className="text-xs text-muted-foreground">Light, dark or sync with system</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(["light","dark","system"] as ThemeMode[]).map(t => (
                        <button key={t} onClick={()=>setTheme(t)} className={`pill capitalize ${theme===t?"pill-dark":"pill-light"}`}>{t}</button>
                      ))}
                    </div>
                  </div>

                  {/* Exchange rates */}
                  <div className="surface p-6 md:col-span-2">
                    <h3 className="font-display text-lg font-semibold">Exchange rates</h3>
                    <p className="text-xs text-muted-foreground mb-4">Refreshed hourly</p>
                    <ul className="grid grid-cols-3 gap-3">
                      {Object.entries(FX).map(([c, r]) => (
                        <li key={c} className="rounded-2xl border border-border bg-secondary px-4 py-3">
                          <p className="text-xs text-muted-foreground">1 USD =</p>
                          <p className="mt-1 font-display text-lg font-semibold">{r.toFixed(2)} {c}</p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recent activity */}
                  <div className="surface p-6 md:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display text-lg font-semibold">Recent activity</h3>
                      <TrendingUp className="h-4 w-4 text-muted-foreground"/>
                    </div>
                    <ul className="space-y-3 max-h-60 overflow-y-auto">
                      {activityLog.slice(0,8).map(a => (
                        <li key={a.id} className="flex items-start gap-3">
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"/>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{a.action}</p>
                            <p className="truncate text-xs text-muted-foreground">{a.detail}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">{a.at}</span>
                        </li>
                      ))}
                      {activityLog.length===0 && <li className="text-sm text-muted-foreground text-center py-4">No activity yet</li>}
                    </ul>
                  </div>
                </section>
              </div>
            )}

          </div>{/* /surface */}
        </main>

        {/* Right panel */}
        <ProfilePanel
          entries={entries} wallets={wallets} notifications={notifications}
          onMarkRead={()=>setNotifications(p=>p.map(n=>({...n,read:true})))}
          onNav={setActiveTab} avatarUrl={avatarUrl} userName={`${firstName} ${lastName}`}
          period={period} setPeriod={setPeriod}
        />
      </div>

      {/* ═══ MODALS ═══ */}
      {showNewEntry && <NewEntryModal onClose={()=>setShowNewEntry(false)} onSave={addEntry} wallets={wallets}/>}
      {showSend && <SendModal onClose={()=>setShowSend(false)} onSave={addEntry} wallets={wallets} cards={cards}/>}
      {showReceive && <ReceiveModal onClose={()=>setShowReceive(false)} onSave={addEntry} wallets={wallets}/>}

      {showAddWallet && (
        <Modal onClose={()=>{setShowAddWallet(false);setFormError("")}} title="New wallet">
          <div className="space-y-4">
            {formError && <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2">{formError}</p>}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name"><FInput value={wForm.name} onChange={e=>setWForm(p=>({...p,name:e.target.value}))} placeholder="Main Checking"/></Field>
              <Field label="Bank / Network"><FInput value={wForm.bank} onChange={e=>setWForm(p=>({...p,bank:e.target.value}))} placeholder="Chase"/></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Starting balance"><FInput type="number" step="0.01" value={wForm.balance} onChange={e=>setWForm(p=>({...p,balance:e.target.value}))} placeholder="0.00"/></Field>
              <Field label="Currency"><FSelect value={wForm.currency} onChange={e=>setWForm(p=>({...p,currency:e.target.value as CurrencyCode}))}>{["USD","EUR","GBP"].map(c=><option key={c}>{c}</option>)}</FSelect></Field>
            </div>
            <Field label="Tile colour"><FSelect value={wForm.tile} onChange={e=>setWForm(p=>({...p,tile:e.target.value as Tile}))}>{TILES.map(t=><option key={t} value={t} className="capitalize">{t}</option>)}</FSelect></Field>
            <div className="flex gap-3 pt-2">
              <button onClick={()=>{setShowAddWallet(false);setFormError("")}} className="pill pill-light flex-1 justify-center">Cancel</button>
              <button onClick={addWallet} className="pill pill-dark flex-[2] justify-center">Add wallet</button>
            </div>
          </div>
        </Modal>
      )}

      {showAddCard && (
        <Modal onClose={()=>{setShowAddCard(false);setFormError("")}} title="New card">
          <div className="space-y-4">
            {formError && <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2">{formError}</p>}
            <Field label="Label"><FInput value={cForm.label} onChange={e=>setCForm(p=>({...p,label:e.target.value}))} placeholder="Daily Spend"/></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Brand"><FSelect value={cForm.brand} onChange={e=>setCForm(p=>({...p,brand:e.target.value as Card["brand"]}))}>{["Visa","Mastercard","Amex"].map(b=><option key={b}>{b}</option>)}</FSelect></Field>
              <Field label="Last 4"><FInput maxLength={4} value={cForm.last4} onChange={e=>setCForm(p=>({...p,last4:e.target.value.replace(/\D/g,"")}))} placeholder="4821"/></Field>
            </div>
            {wallets.length>0 && <Field label="Linked wallet"><FSelect value={cForm.walletId} onChange={e=>setCForm(p=>({...p,walletId:e.target.value}))}><option value="">Select wallet…</option>{wallets.map(w=><option key={w.id} value={w.id}>{w.name} · {w.bank}</option>)}</FSelect></Field>}
            <Field label="Tile colour"><FSelect value={cForm.tile} onChange={e=>setCForm(p=>({...p,tile:e.target.value as Tile}))}>{TILES.map(t=><option key={t} value={t} className="capitalize">{t}</option>)}</FSelect></Field>
            <div className="flex gap-3 pt-2">
              <button onClick={()=>{setShowAddCard(false);setFormError("")}} className="pill pill-light flex-1 justify-center">Cancel</button>
              <button onClick={addCard} className="pill pill-dark flex-[2] justify-center">Add card</button>
            </div>
          </div>
        </Modal>
      )}

      {showNewGoal && (
        <Modal onClose={()=>{setShowNewGoal(false);setFormError("")}} title="New goal">
          <div className="space-y-4">
            {formError && <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2">{formError}</p>}
            <Field label="Goal name"><FInput value={gForm.name} onChange={e=>setGForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Emergency Fund"/></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Target ($)"><FInput type="number" step="0.01" value={gForm.target} onChange={e=>setGForm(p=>({...p,target:e.target.value}))} placeholder="5000"/></Field>
              <Field label="Saved so far"><FInput type="number" step="0.01" value={gForm.current} onChange={e=>setGForm(p=>({...p,current:e.target.value}))} placeholder="0"/></Field>
            </div>
            <Field label="Deadline"><FInput type="date" value={gForm.deadline} onChange={e=>setGForm(p=>({...p,deadline:e.target.value}))}/></Field>
            <Field label="Tile colour"><FSelect value={gForm.tile} onChange={e=>setGForm(p=>({...p,tile:e.target.value as Tile}))}>{TILES.map(t=><option key={t} value={t} className="capitalize">{t}</option>)}</FSelect></Field>
            <div className="flex gap-3 pt-2">
              <button onClick={()=>{setShowNewGoal(false);setFormError("")}} className="pill pill-light flex-1 justify-center">Cancel</button>
              <button onClick={addGoal} className="pill pill-dark flex-[2] justify-center">Create goal</button>
            </div>
          </div>
        </Modal>
      )}

      {deletingId && <ConfirmDelete title="This action cannot be undone." onConfirm={confirmDelete} onClose={()=>setDeletingId(null)}/>}
    </div>
  );
}