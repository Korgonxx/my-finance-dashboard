"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownLeft, ArrowUpRight, ChevronRight, CircleDollarSign, Plus, ShieldCheck, Sparkles, Target, TrendingUp, Wallet, X } from "lucide-react";
import { AppChrome } from "./components/AppChrome";
import { useWeb3 } from "./context/Web3Context";
import { useAppSettings } from "./context/AppSettingsContext";
import { apiFetch } from "./lib/apiClient";
import { useEntries, useGoal, type Entry as LedgerEntry } from "../lib/hooks/useEntries";
import { useWallets } from "../lib/hooks/useWallets";

const COLORS = { sky: "#8edcff", coral: "#ff9a9a", mint: "#76f0c1", grid: "rgba(183,224,255,0.1)" };
const PREVIEW_SERIES = [
  { month: "Nov", income: 0, expense: 0, balance: 0 },
  { month: "Dec", income: 0, expense: 0, balance: 0 },
  { month: "Jan", income: 0, expense: 0, balance: 0 },
  { month: "Feb", income: 0, expense: 0, balance: 0 },
  { month: "Mar", income: 0, expense: 0, balance: 0 },
  { month: "Apr", income: 0, expense: 0, balance: 0 },
];

type ViewEntry = LedgerEntry & { kind: "income" | "expense" | "asset"; amount: number; label: string };
type BankCard = { id: string; name: string; last4: string; holder: string; expiry: string; balance: number };

function money(value: number, hidden = false) {
  if (hidden) return "••••••";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
}

function exactMoney(value: number, hidden = false) {
  if (hidden) return "••••••";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value || 0);
}

function dateLabel(value: string) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function inferEntries(raw: LedgerEntry[], crypto: boolean): ViewEntry[] {
  return raw.map((entry) => {
    if (crypto) {
      const amount = Number(entry.currentValue || entry.investmentAmount || 0);
      const kind = Number(entry.currentValue || 0) >= Number(entry.investmentAmount || 0) ? "asset" : "expense";
      return { ...entry, kind, amount, label: entry.project || entry.walletName || "Crypto position" };
    }
    const income = Number(entry.earned || 0);
    const expense = Number(entry.given || 0);
    return { ...entry, kind: income > 0 ? "income" : "expense", amount: income || expense, label: entry.project || entry.givenTo || "Transaction" };
  });
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ border: "1px solid var(--line-strong)", borderRadius: 12, background: "var(--panel-strong)", padding: "10px 12px", boxShadow: "var(--shadow)" }}>
      <p style={{ margin: "0 0 7px", color: "var(--text)", fontSize: 11, fontWeight: 800 }}>{label}</p>
      {payload.map((item) => <div key={item.name} style={{ display: "flex", gap: 7, alignItems: "center", color: "var(--text-soft)", fontFamily: "var(--font-mono)", fontSize: 10 }}><i style={{ width: 6, height: 6, borderRadius: 2, background: item.color, display: "inline-block" }} />{item.name}: <strong style={{ color: "var(--text)" }}>{money(Number(item.value))}</strong></div>)}
    </div>
  );
}

function EntryModal({ onClose, onSave, crypto }: { onClose: () => void; onSave: (entry: LedgerEntry) => Promise<void>; crypto: boolean }) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [project, setProject] = useState("");
  const [category, setCategory] = useState("General");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const numeric = Number(amount);
    if (!numeric || numeric <= 0 || !project.trim()) { setError("Add a name and a positive amount."); return; }
    setBusy(true);
    try {
      await onSave({
        id: `local-${Date.now()}`,
        date,
        project: project.trim(),
        earned: crypto ? numeric : type === "income" ? numeric : 0,
        saved: crypto ? numeric : 0,
        given: crypto ? 0 : type === "expense" ? numeric : 0,
        givenTo: crypto ? category : category,
        mode: crypto ? "web3" : "web2",
        investmentAmount: crypto ? numeric : undefined,
        currentValue: crypto ? numeric : undefined,
      });
      onClose();
    } catch { setError("Could not save this transaction."); }
    finally { setBusy(false); }
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="entry-modal-title">
        <div className="modal__header"><div><p className="eyebrow">Ledger input / 01</p><h2 id="entry-modal-title">Add transaction</h2><p>{crypto ? "Track a position or portfolio movement." : "Keep your cash picture current."}</p></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={16} /></button></div>
        <form className="modal__body" onSubmit={submit}>
          <div className="mode-switch" style={{ width: "100%", marginBottom: 18 }}><button type="button" style={{ flex: 1 }} className={type === "expense" ? "is-active" : ""} onClick={() => setType("expense")}>{crypto ? "Position" : "Expense"}</button><button type="button" style={{ flex: 1 }} className={type === "income" ? "is-active" : ""} onClick={() => setType("income")}>{crypto ? "Gain" : "Income"}</button></div>
          <div className="form-grid">
            <label className="field"><span className="field-label">Name</span><input value={project} onChange={(event) => setProject(event.target.value)} placeholder={crypto ? "Ethereum position" : "Rent, salary, groceries"} /></label>
            <label className="field"><span className="field-label">Amount</span><input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /></label>
            <label className="field"><span className="field-label">Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option>General</option><option>Housing</option><option>Food</option><option>Transport</option><option>Shopping</option><option>Salary</option><option>Investment</option></select></label>
            <label className="field"><span className="field-label">Date</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button" disabled={busy}>{busy ? "Saving…" : "Save transaction"}<ChevronRight size={15} /></button></div>
        </form>
      </div>
    </div>
  );
}

function Dashboard() {
  const { isWeb3 } = useWeb3();
  const { hideBalances } = useAppSettings();
  const { web2Entries, web3Entries, save, loaded } = useEntries(isWeb3);
  const { wallets } = useWallets();
  const { goal } = useGoal(isWeb3 ? "web3" : "web2");
  const [cards, setCards] = useState<BankCard[]>([]);
  const [name, setName] = useState("Korgon");
  const [showEntry, setShowEntry] = useState(false);

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((data) => { if (data?.firstName) setName(data.firstName); }).catch(() => {});
    apiFetch("/api/cards").then((response) => response.ok ? response.json() : []).then((data) => setCards(Array.isArray(data) ? data : [])).catch(() => setCards([]));
  }, []);

  const rawEntries = isWeb3 ? web3Entries : web2Entries;
  const entries = useMemo(() => inferEntries(rawEntries, isWeb3).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [rawEntries, isWeb3]);
  const totals = useMemo(() => {
    const income = entries.filter((entry) => entry.kind === "income" || entry.kind === "asset").reduce((sum, entry) => sum + entry.amount, 0);
    const expense = entries.filter((entry) => entry.kind === "expense").reduce((sum, entry) => sum + entry.amount, 0);
    const accountBalance = isWeb3 ? wallets.reduce((sum, wallet) => sum + Number(wallet.balance || 0), 0) : cards.reduce((sum, card) => sum + Number(card.balance || 0), 0);
    return { income, expense, accountBalance: accountBalance || Math.max(0, income - expense), net: income - expense };
  }, [entries, wallets, cards, isWeb3]);
  const chartSeries = useMemo(() => {
    const now = new Date();
    const series = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const month = date.toLocaleDateString("en-US", { month: "short" });
      const monthEntries = entries.filter((entry) => { const entryDate = new Date(entry.date); return entryDate.getFullYear() === date.getFullYear() && entryDate.getMonth() === date.getMonth(); });
      return { month, income: monthEntries.filter((entry) => entry.kind === "income" || entry.kind === "asset").reduce((sum, entry) => sum + entry.amount, 0), expense: monthEntries.filter((entry) => entry.kind === "expense").reduce((sum, entry) => sum + entry.amount, 0), balance: monthEntries.reduce((sum, entry) => sum + (entry.kind === "expense" ? -entry.amount : entry.amount), 0) };
    });
    return series.some((point) => point.income || point.expense) ? series : PREVIEW_SERIES;
  }, [entries]);
  const goalPercent = goal > 0 ? Math.min(100, Math.round((Math.min(totals.accountBalance, goal) / goal) * 100)) : 0;
  const periodLabel = isWeb3 ? "Portfolio value" : "Cash position";

  const saveEntry = async (entry: LedgerEntry) => {
    const response = await apiFetch("/api/entries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry) });
    if (!response.ok) throw new Error("Save failed");
    save(entry);
  };

  return (
    <AppChrome title="Overview">
      <div className="page-heading"><div><p className="eyebrow">Good morning, {name}</p><h1>Make every move<br />count.</h1><p>A quieter view of your money: one signal for today, the context behind it, and fewer things competing for attention.</p></div><div className="page-heading__actions"><button className="secondary-button" onClick={() => setShowEntry(true)}><Plus size={15} /> Quick add</button><button className="primary-button" onClick={() => setShowEntry(true)}><Sparkles size={15} /> New transaction</button></div></div>
      <div className="dashboard-grid dashboard-grid--top">
        <section className="panel balance-panel"><div className="panel__content"><div className="panel-title-row"><div><span className="glyph-label">{isWeb3 ? "Crypto / active" : "Bank / active"}</span><p className="panel-subtitle">Last synced just now · USD base</p></div><div className="status-dot" /></div><div className="balance-hero"><p className={`balance-hero__value ${hideBalances ? "is-hidden" : ""}`}>{money(totals.accountBalance, hideBalances)}</p><div className="balance-hero__delta"><TrendingUp size={13} /> +{totals.income ? Math.round((totals.net / Math.max(totals.income, 1)) * 100) : 0}% net flow</div></div><div className="balance-footer"><div className="balance-footer__meta"><strong>{periodLabel}</strong>{isWeb3 ? `${wallets.length} linked wallet${wallets.length === 1 ? "" : "s"}` : `${cards.length} connected card${cards.length === 1 ? "" : "s"}`}</div><div className="sparkline" aria-label="Balance trend">{chartSeries.map((point, index) => <span key={`${point.month}-${index}`} style={{ height: `${Math.max(12, Math.min(44, (point.income + point.expense) / Math.max(totals.income, 1) * 44))}px` }} />)}</div></div></div></section>
        <section className="panel"><div className="panel__content"><div className="panel-title-row"><div><span className="glyph-label">Signal stack</span><h2 className="panel-title" style={{ marginTop: 10 }}>This month</h2></div><CircleDollarSign size={18} color="var(--sky)" /></div><div className="metric-stack"><div className="metric-row"><div className="metric-row__label">Incoming<span>earned / received</span></div><strong className="metric-row__value is-positive">+{money(totals.income, hideBalances)}</strong></div><div className="metric-row"><div className="metric-row__label">Outgoing<span>spent / allocated</span></div><strong className="metric-row__value is-negative">−{money(totals.expense, hideBalances)}</strong></div><div className="metric-row"><div className="metric-row__label">Net movement<span>after outgoing</span></div><strong className={`metric-row__value ${totals.net >= 0 ? "is-positive" : "is-negative"}`}>{totals.net >= 0 ? "+" : "−"}{money(Math.abs(totals.net), hideBalances)}</strong></div></div></div></section>
      </div>
      <section className="panel chart-panel"><div className="panel__content"><div className="panel-title-row"><div><span className="glyph-label">Flow / six month readout</span><h2 className="panel-title" style={{ marginTop: 10 }}>Money in motion</h2><p className="panel-subtitle">{chartSeries === PREVIEW_SERIES ? "Add a transaction to activate your live trend line." : "Income and outgoing activity, normalized to USD."}</p></div><span className="eyebrow">{loaded ? "Live data" : "Syncing"}</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartSeries} margin={{ top: 12, right: 4, left: -25, bottom: 0 }}><defs><linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COLORS.sky} stopOpacity={0.34} /><stop offset="100%" stopColor={COLORS.sky} stopOpacity={0} /></linearGradient><linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COLORS.coral} stopOpacity={0.25} /><stop offset="100%" stopColor={COLORS.coral} stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke={COLORS.grid} strokeDasharray="3 7" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--text-faint)", fontSize: 10 }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--text-faint)", fontSize: 10 }} tickFormatter={(value) => `$${Math.round(value / 1000)}k`} /><Tooltip content={<ChartTooltip />} /><Area type="monotone" dataKey="income" name="Income" stroke={COLORS.sky} strokeWidth={2.5} fill="url(#incomeGradient)" /><Area type="monotone" dataKey="expense" name="Outgoing" stroke={COLORS.coral} strokeWidth={2} fill="url(#expenseGradient)" /></AreaChart></ResponsiveContainer></div><div className="chart-legend"><span className="legend-item"><i />Income / asset inflow</span><span className="legend-item"><i className="coral" />Outgoing / spend</span><span className="legend-item"><i className="mint" />Protected session</span></div></div></section>
      <div className="grid-two"><section className="panel"><div className="panel__content"><div className="panel-title-row"><div><span className="glyph-label">Recent activity</span><h2 className="panel-title" style={{ marginTop: 10 }}>Latest moves</h2></div><button className="secondary-button" onClick={() => setShowEntry(true)}><Plus size={14} /> Add</button></div><div className="activity-list">{entries.slice(0, 5).map((entry) => <div className="activity-item" key={entry.id}><div className="activity-icon">{entry.kind === "expense" ? <ArrowUpRight size={15} /> : <ArrowDownLeft size={15} />}</div><div className="activity-copy"><strong>{entry.label}</strong><span>{entry.givenTo || (isWeb3 ? "Portfolio" : "General")} · {dateLabel(entry.date)}</span></div><span className={`activity-amount ${entry.kind === "expense" ? "is-negative" : "is-positive"}`}>{entry.kind === "expense" ? "−" : "+"}{exactMoney(entry.amount, hideBalances)}</span></div>)}{entries.length === 0 && <div className="empty-state"><div><Wallet size={21} /><p>No transactions yet</p><span>Your first signal will appear here.</span></div></div>}</div></div></section><section className="panel security-card"><div className="panel__content"><div className="panel-title-row"><div><span className="glyph-label">Security posture</span><h2 className="panel-title" style={{ marginTop: 10 }}>Quietly protected</h2></div><ShieldCheck size={18} color="var(--mint)" /></div><div className="security-card__score"><div className="security-card__copy"><strong>All systems nominal</strong><p>Passcode verification and write access are enforced server-side.</p></div><div className="score-ring">100%</div></div><div className="check-list"><div className="check-list__item"><ShieldCheck size={14} /> HttpOnly session cookie</div><div className="check-list__item"><ShieldCheck size={14} /> Rate-limited unlock attempts</div><div className="check-list__item"><ShieldCheck size={14} /> Balances {hideBalances ? "hidden" : "visible"} on this device</div></div></div></section></div>
      <section className="panel" style={{ marginTop: 18 }}><div className="panel__content"><div className="panel-title-row"><div><span className="glyph-label">North star</span><h2 className="panel-title" style={{ marginTop: 10 }}>{isWeb3 ? "Portfolio target" : "Savings target"}</h2><p className="panel-subtitle">Your current balance against the goal you set.</p></div><Target size={18} color="var(--gold)" /></div><div className="goal-progress"><span style={{ width: `${goalPercent}%` }} /></div><div className="goal-meta"><span><strong>{goal ? money(totals.accountBalance, hideBalances) : "No target set"}</strong> tracked</span><span>{goal ? `${goalPercent}% of ${money(goal, hideBalances)}` : "Add a target in settings"}</span></div></div></section>
      {showEntry && <EntryModal onClose={() => setShowEntry(false)} onSave={saveEntry} crypto={isWeb3} />}
    </AppChrome>
  );
}

export default function FinanceDashboard() {
  return <Dashboard />;
}
