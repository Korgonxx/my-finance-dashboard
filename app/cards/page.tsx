"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, Copy, CreditCard, Globe2, Lock, Plus, Trash2, Unlock, Wallet, X } from "lucide-react";
import { AppChrome } from "../components/AppChrome";
import { useWeb3 } from "../context/Web3Context";
import { apiFetch } from "../lib/apiClient";
import { useWallets } from "../../lib/hooks/useWallets";

 type Card = { id: string; name: string; last4: string; holder: string; expiry: string; type: string; balance: number };
const networkColor: Record<string, string> = { Ethereum: "#9fb7ff", Solana: "#c8a4ff", Bitcoin: "#ffbf68", Polygon: "#a88bff", Arbitrum: "#91a7c5", Base: "#6ca8ff" };

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="modal-backdrop"><div className="modal"><div className="modal__header"><div><p className="eyebrow">Account registry</p><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={16} /></button></div><div className="modal__body">{children}</div></div></div>;
}

export default function AccountsPage() {
  const { isWeb3 } = useWeb3();
  const { wallets, loading: walletsLoading, addWallet, removeWallet } = useWallets();
  const [cards, setCards] = useState<Card[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", address: "", network: "Ethereum", balance: "", last4: "", expiry: "12/28", type: "virtual" });

  useEffect(() => { apiFetch("/api/cards").then((response) => response.ok ? response.json() : []).then((data) => setCards(Array.isArray(data) ? data : [])).catch(() => setCards([])).finally(() => setLoadingCards(false)); }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    try {
      if (isWeb3) {
        if (!form.name.trim() || !form.address.trim()) { setError("Name and wallet address are required."); return; }
        const created = await addWallet({ name: form.name.trim(), address: form.address.trim(), network: form.network, balance: Number(form.balance) || 0 });
        if (!created) throw new Error("Could not create wallet");
      } else {
        if (!form.name.trim() || !/^\d{4}$/.test(form.last4) || !/^\d{2}\/\d{2}$/.test(form.expiry)) { setError("Add a name, last four digits, and MM/YY expiry."); return; }
        const response = await apiFetch("/api/cards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name.trim(), last4: form.last4, holder: "Account Holder", expiry: form.expiry, type: form.type, balance: 0 }) });
        if (!response.ok) throw new Error("Could not create card");
        const created = await response.json();
        setCards((current) => [...current, created]);
      }
      setForm({ name: "", address: "", network: "Ethereum", balance: "", last4: "", expiry: "12/28", type: "virtual" }); setShowModal(false);
    } catch { setError("The account could not be saved. Check the connection and try again."); }
  };

  const copyAddress = (address: string, id: string) => { navigator.clipboard?.writeText(address).then(() => { setCopied(id); window.setTimeout(() => setCopied(null), 1600); }); };
  const removeCard = async (id: string) => { setCards((current) => current.filter((card) => card.id !== id)); await apiFetch(`/api/cards/${id}`, { method: "DELETE" }).catch(() => {}); };

  return <AppChrome title="Accounts"><div className="page-heading"><div><p className="eyebrow">Registry / {isWeb3 ? "Web3" : "Web2"}</p><h1>{isWeb3 ? "Wallets" : "Cards"}</h1><p>{isWeb3 ? "Keep addresses, networks, and balances in one clean control surface." : "See every connected card without the clutter of a banking portal."}</p></div><button className="primary-button" onClick={() => setShowModal(true)}><Plus size={15} /> Add {isWeb3 ? "wallet" : "card"}</button></div>
    {isWeb3 ? <div className="page-grid">{wallets.map((wallet) => <article className="account-card" key={wallet.id}><div className="account-card__head"><div className="account-card__name"><div className="account-card__icon" style={{ color: networkColor[wallet.network] || "var(--sky)" }}><Wallet size={16} /></div><div><strong>{wallet.name}</strong><span>{wallet.network}</span></div></div><div style={{ display: "flex", gap: 7 }}><span className="glyph-label"><span className="status-dot" style={{ width: 5, height: 5 }} />{wallet.isEncrypted ? "Encrypted" : "Watch only"}</span><button className="icon-button" onClick={() => removeWallet(wallet.id)} aria-label={`Delete ${wallet.name}`}><Trash2 size={14} /></button></div></div><div className="account-card__balance">${Number(wallet.balance || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}</div><div className="account-card__foot"><span>{wallet.address ? `${wallet.address.slice(0, 8)}…${wallet.address.slice(-6)}` : "No address"}</span><button className="icon-button" onClick={() => copyAddress(wallet.address, wallet.id)} aria-label="Copy address">{copied === wallet.id ? <Check size={14} /> : <Copy size={14} />}</button></div></article>)}{!walletsLoading && <button className="empty-state" onClick={() => setShowModal(true)}><div><Plus size={22} /><p>Add another wallet</p><span>Track a new network without sharing keys.</span></div></button>}</div> : <div className="card-grid">{cards.map((card) => <article className="bank-card" key={card.id}><div className="bank-card__top"><div><div className="bank-card__type">{card.type || "virtual"} / {card.name}</div><div className="bank-card__label">Korgon Finance</div></div><div><CreditCard size={22} /></div></div><div className="bank-card__number">•••• •••• •••• {card.last4}</div><div className="bank-card__bottom"><div><p>Card holder</p><strong>{card.holder || "Account Holder"}</strong></div><div><p>Expires</p><strong>{card.expiry}</strong></div><button className="icon-button" style={{ color: "#04131e", borderColor: "rgba(4,19,30,0.24)", background: "rgba(255,255,255,0.18)" }} onClick={() => removeCard(card.id)} aria-label={`Delete ${card.name}`}><Trash2 size={14} /></button></div></article>)}{!loadingCards && <button className="empty-state" onClick={() => setShowModal(true)}><div><Plus size={22} /><p>Add another card</p><span>Only the last four digits are stored.</span></div></button>}</div>}
    <section className="panel table-panel"><div className="panel__content"><div className="panel-title-row"><div><span className="glyph-label">Control notes</span><h2 className="panel-title" style={{ marginTop: 10 }}>Account hygiene</h2></div><Lock size={17} color="var(--mint)" /></div><div className="activity-list"><div className="activity-item"><div className="activity-icon"><Lock size={15} /></div><div className="activity-copy"><strong>Write access is session protected</strong><span>All create and delete actions require the signed HttpOnly session.</span></div><span className="activity-amount is-positive">PASS</span></div><div className="activity-item"><div className="activity-icon"><Globe2 size={15} /></div><div className="activity-copy"><strong>Minimal account data</strong><span>Cards show last four digits; wallets show public addresses only.</span></div><span className="activity-amount is-positive">PASS</span></div><div className="activity-item"><div className="activity-icon"><Unlock size={15} /></div><div className="activity-copy"><strong>Balance privacy toggle</strong><span>Use the eye control in the top bar for a clean share-safe view.</span></div><span className="activity-amount is-positive">READY</span></div></div></div></section>
    {showModal && <Modal title={`Add ${isWeb3 ? "wallet" : "card"}`} subtitle={isWeb3 ? "Public address only. Never paste private keys here." : "Store only the minimum card details needed for recognition."} onClose={() => { setShowModal(false); setError(""); }}><form onSubmit={submit}><div className="form-grid"><label className="field span-2"><span className="field-label">Name</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder={isWeb3 ? "Main wallet" : "Daily spending"} /></label>{isWeb3 ? <><label className="field span-2"><span className="field-label">Public address</span><input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="0x… or public address" className="font-mono" /></label><label className="field"><span className="field-label">Network</span><select value={form.network} onChange={(event) => setForm({ ...form, network: event.target.value })}>{Object.keys(networkColor).map((network) => <option key={network}>{network}</option>)}</select></label><label className="field"><span className="field-label">USD balance</span><input type="number" min="0" step="0.01" value={form.balance} onChange={(event) => setForm({ ...form, balance: event.target.value })} placeholder="0.00" /></label></> : <><label className="field"><span className="field-label">Last four</span><input value={form.last4} onChange={(event) => setForm({ ...form, last4: event.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="4209" inputMode="numeric" /></label><label className="field"><span className="field-label">Expiry</span><input value={form.expiry} onChange={(event) => setForm({ ...form, expiry: event.target.value })} placeholder="MM/YY" /></label></>}</div>{error && <p className="form-error">{error}</p>}<div className="form-actions"><button type="button" className="secondary-button" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="primary-button">Save account <Plus size={15} /></button></div></form></Modal>}
  </AppChrome>;
}
