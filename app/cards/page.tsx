"use client";
import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../context/Web3Context";
import { useWallets } from "@/lib/hooks/useWallets";
import { apiFetch } from "../lib/apiClient";
import {
  Plus, Trash2, Copy, Check, Lock, Unlock, Wallet,
  CreditCard, Globe, Zap, Shield, ArrowUpRight, X
} from "lucide-react";

const BRAND = "#C8FF00";

interface CryptoWallet {
  id: string; name: string; address: string; network: string;
  balance: number; createdAt: string; isEncrypted?: boolean;
}
interface BankCard {
  id: string; name: string; last4: string; holder: string;
  expiry: string; type: "physical" | "virtual"; balance: number;
}

function shortAddr(a: string) { return a ? `${a.slice(0,6)}…${a.slice(-4)}` : ""; }

function ModalShell({ onClose, title, subtitle, children }: { onClose: ()=>void; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-md">
      <div className="bg-[#0E0E11] border border-white/8 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${BRAND}, transparent)` }} />
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">{title}</h2>
              {subtitle && <p className="text-sm text-white/35 mt-1">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
              <X size={16} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-white/30 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#C8FF00]/50 transition-all ${props.className||''}`} />;
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#C8FF00]/50 appearance-none cursor-pointer transition-all">{children}</select>;
}

function ConfirmDelete({ title, subtitle, onConfirm, onClose }: { title: string; subtitle: string; onConfirm: ()=>void; onClose: ()=>void }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-[#0E0E11] border border-white/8 max-w-sm w-full rounded-2xl p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4"><Trash2 size={22} className="text-red-400"/></div>
        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        <p className="text-sm text-white/35 mb-6">{subtitle}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-white/5 text-white/50 rounded-xl text-sm font-medium hover:bg-white/8 transition-all">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-red-500 hover:bg-red-400 text-white rounded-xl text-sm font-bold transition-all">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function CardsPage() {
  const { mode } = useWeb3();
  const [cards, setCards] = useState<BankCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [cardForm, setCardForm] = useState({ name:"", last4:"", expiry:"", type:"virtual" as "physical"|"virtual" });
  const [walletForm, setWalletForm] = useState({ name:"", address:"", network:"Ethereum", balance:"" });
  const [formError, setFormError] = useState("");
  const [deletingCardId, setDeletingCardId] = useState<string|null>(null);
  const [deletingWalletId, setDeletingWalletId] = useState<string|null>(null);
  const [copySuccess, setCopySuccess] = useState<string|null>(null);

  const { wallets, loading: wLoading, addWallet, removeWallet } = useWallets();

  useEffect(() => { fetchCards(); }, []);

  async function fetchCards() {
    setLoadingCards(true);
    try { const r = await apiFetch("/api/cards"); if (r.ok) { const d = await r.json(); if (Array.isArray(d)) setCards(d); } } catch {}
    setLoadingCards(false);
  }

  const handleDeleteCard = async (id: string) => {
    const prev = [...cards];
    setCards(p => p.filter(c => c.id !== id));
    setDeletingCardId(null);
    try { await apiFetch(`/api/cards/${id}`, { method: "DELETE" }); }
    catch { setCards(prev); }
  };

  const handleAddCard = async () => {
    setFormError("");
    if (!cardForm.name.trim()) { setFormError("Card name is required."); return; }
    if (cardForm.last4.length !== 4) { setFormError("Last 4 digits required."); return; }
    if (!cardForm.expiry.match(/^\d{2}\/\d{2}$/)) { setFormError("Use MM/YY format."); return; }
    try {
      const r = await apiFetch("/api/cards", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ name: cardForm.name.trim(), last4: cardForm.last4, holder: "Account Holder", expiry: cardForm.expiry, type: cardForm.type, balance: 0 }) });
      if (r.ok) { const d = await r.json(); setCards(p => [...p, d]); setShowAddCard(false); setCardForm({ name:"", last4:"", expiry:"", type:"virtual" }); }
      else { const d = await r.json(); setFormError(d.error || "Failed to add card."); }
    } catch { setFormError("Network error."); }
  };

  const handleAddWallet = async () => {
    setFormError("");
    if (!walletForm.name.trim()) { setFormError("Name required."); return; }
    if (!walletForm.address.trim()) { setFormError("Address required."); return; }
    try {
      const ok = await addWallet({ name: walletForm.name.trim(), address: walletForm.address.trim(), network: walletForm.network, balance: parseFloat(walletForm.balance) || 0 });
      if (ok) { setShowAddWallet(false); setWalletForm({ name:"", address:"", network:"Ethereum", balance:"" }); }
      else setFormError("Failed to add wallet.");
    } catch { setFormError("Network error."); }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopySuccess(id); setTimeout(() => setCopySuccess(null), 2000); });
  };

  const networks: Record<string, string> = { Ethereum:"#627EEA", Solana:"#9945FF", Bitcoin:"#F7931A", Polygon:"#8247E5", Arbitrum:"#2D374B", Base:"#0052FF", Other:"#888" };

  return (
    <div className="bg-[#080809] min-h-screen text-white font-sans">
      {/* Header */}
      <div className="border-b border-white/5 px-4 md:px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">{mode === 'banks' ? 'Bank Cards' : 'Crypto Wallets'}</h1>
          <p className="text-xs text-white/25 mt-0.5">{mode === 'banks' ? `${cards.length} cards` : `${wallets.length} wallets`}</p>
        </div>
        <button onClick={() => mode === 'banks' ? setShowAddCard(true) : setShowAddWallet(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90" style={{ background: BRAND }}>
          <Plus size={15} /> {mode === 'banks' ? 'Add Card' : 'Add Wallet'}
        </button>
      </div>

      <div className="p-4 md:p-8">
        {/* ── BANK CARDS ── */}
        {mode === 'banks' && (
          loadingCards ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-48 rounded-2xl bg-white/3 animate-pulse"/>)}
            </div>
          ) : cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-white/20">
              <CreditCard size={40} className="mb-4"/>
              <p className="text-base font-semibold mb-2">No cards yet</p>
              <p className="text-sm mb-6">Add your first bank card to get started</p>
              <button onClick={() => setShowAddCard(true)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-black" style={{ background: BRAND }}>Add Card</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {cards.map((card, i) => (
                <div key={card.id} className="rounded-2xl p-6 relative overflow-hidden group transition-transform hover:-translate-y-0.5"
                  style={{ background: i === 0 ? `linear-gradient(135deg, ${BRAND} 0%, #8AC800 100%)` : 'linear-gradient(135deg, #111116 0%, #0D0D10 100%)', border: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
                  {/* Chip */}
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setDeletingCardId(card.id)} className={`w-7 h-7 rounded-lg flex items-center justify-center ${i===0?'bg-black/10 text-black/50 hover:text-red-700':'bg-white/5 text-white/25 hover:text-red-400'} transition-colors`}>
                      <Trash2 size={13}/>
                    </button>
                  </div>
                  <div className="flex items-start justify-between mb-8">
                    <span className={`font-bold text-base ${i===0?'text-black':'text-white'}`}>{card.name}</span>
                    <Globe size={18} className={i===0?'text-black/30':'text-white/15'}/>
                  </div>
                  <p className={`text-2xl font-bold tracking-tight mb-1 ${i===0?'text-black':'text-white'}`}>
                    ${card.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className={`text-sm font-mono mb-5 ${i===0?'text-black/50':'text-white/25'}`}>···· ···· ···· {card.last4}</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className={`text-[10px] uppercase tracking-widest font-semibold mb-0.5 ${i===0?'text-black/40':'text-white/20'}`}>Holder</p>
                      <p className={`text-sm font-semibold ${i===0?'text-black':'text-white/60'}`}>{card.holder}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[10px] uppercase tracking-widest font-semibold mb-0.5 ${i===0?'text-black/40':'text-white/20'}`}>Expires</p>
                      <p className={`text-sm font-semibold ${i===0?'text-black':'text-white/60'}`}>{card.expiry}</p>
                    </div>
                  </div>
                </div>
              ))}
              {/* Add card placeholder */}
              <button onClick={() => setShowAddCard(true)} className="rounded-2xl border border-dashed border-white/10 h-48 flex flex-col items-center justify-center gap-2 text-white/20 hover:text-white/40 hover:border-white/20 transition-all">
                <Plus size={24}/><span className="text-sm font-medium">Add Card</span>
              </button>
            </div>
          )
        )}

        {/* ── WALLETS ── */}
        {mode === 'crypto' && (
          wLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-40 rounded-2xl bg-white/3 animate-pulse"/>)}
            </div>
          ) : wallets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-white/20">
              <Wallet size={40} className="mb-4"/>
              <p className="text-base font-semibold mb-2">No wallets yet</p>
              <p className="text-sm mb-6">Connect your first crypto wallet</p>
              <button onClick={() => setShowAddWallet(true)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-black" style={{ background: BRAND }}>Add Wallet</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wallets.map(w => (
                <div key={w.id} className="bg-[#0E0E11] border border-white/5 rounded-2xl p-5 group hover:border-white/10 transition-all">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${networks[w.network]||'#888'}15`, border: `1px solid ${networks[w.network]||'#888'}30` }}>
                        <Wallet size={18} style={{ color: networks[w.network]||'#888' }}/>
                      </div>
                      <div>
                        <p className="font-bold text-white">{w.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-xs text-white/25 font-mono">{shortAddr(w.address)}</p>
                          <button onClick={() => copyToClipboard(w.address, w.id)} className="text-white/20 hover:text-white/50 transition-colors">
                            {copySuccess === w.id ? <Check size={11} className="text-green-400"/> : <Copy size={11}/>}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {w.isEncrypted ? <Lock size={14} className="text-amber-400"/> : <Unlock size={14} className="text-white/20"/>}
                      <button onClick={() => setDeletingWalletId(w.id)} className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-white/4 flex items-center justify-center text-white/25 hover:text-red-400 transition-all">
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </div>

                  <p className="text-2xl font-bold text-white mb-1">${w.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs text-white/25">USD equivalent</p>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: networks[w.network]||'#888' }}/>
                      <span className="text-sm text-white/40 font-medium">{w.network}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${w.isEncrypted?'text-amber-400 bg-amber-400/10':'text-emerald-400 bg-emerald-400/10'}`}>
                      {w.isEncrypted ? '🔒 Encrypted' : 'Unencrypted'}
                    </span>
                  </div>
                </div>
              ))}
              <button onClick={() => setShowAddWallet(true)} className="rounded-2xl border border-dashed border-white/10 h-40 flex flex-col items-center justify-center gap-2 text-white/20 hover:text-white/40 hover:border-white/20 transition-all">
                <Plus size={24}/><span className="text-sm font-medium">Add Wallet</span>
              </button>
            </div>
          )
        )}
      </div>

      {/* ── ADD CARD MODAL ── */}
      {showAddCard && (
        <ModalShell onClose={() => { setShowAddCard(false); setFormError(""); }} title="Add Bank Card">
          <div className="space-y-4">
            {formError && <div className="px-4 py-3 rounded-xl text-sm bg-red-400/8 text-red-400 border border-red-400/20">{formError}</div>}
            <Field label="Card Name"><Input value={cardForm.name} onChange={e => setCardForm(p=>({...p, name:e.target.value}))} placeholder="e.g. Chase Debit"/></Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Last 4"><Input maxLength={4} value={cardForm.last4} onChange={e=>setCardForm(p=>({...p,last4:e.target.value.replace(/\D/g,'')}))} placeholder="4209" className="font-mono text-center"/></Field>
              <Field label="Expiry"><Input maxLength={5} value={cardForm.expiry} onChange={e=>setCardForm(p=>({...p,expiry:e.target.value}))} placeholder="MM/YY" className="font-mono"/></Field>
              <Field label="Type"><Select value={cardForm.type} onChange={e=>setCardForm(p=>({...p,type:e.target.value as any}))}><option value="virtual">Virtual</option><option value="physical">Physical</option></Select></Field>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowAddCard(false); setFormError(""); }} className="flex-1 py-3 bg-white/5 text-white/50 rounded-xl text-sm hover:bg-white/8 transition-all">Cancel</button>
              <button onClick={handleAddCard} className="flex-[2] py-3 rounded-xl font-bold text-sm text-black transition-all hover:opacity-90" style={{ background: BRAND }}>Add Card</button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* ── ADD WALLET MODAL ── */}
      {showAddWallet && (
        <ModalShell onClose={() => { setShowAddWallet(false); setFormError(""); }} title="Add Wallet" subtitle="Connect a crypto wallet to track balance">
          <div className="space-y-4">
            {formError && <div className="px-4 py-3 rounded-xl text-sm bg-red-400/8 text-red-400 border border-red-400/20">{formError}</div>}
            <Field label="Wallet Name"><Input value={walletForm.name} onChange={e=>setWalletForm(p=>({...p,name:e.target.value}))} placeholder="e.g. MetaMask"/></Field>
            <Field label="Address"><Input value={walletForm.address} onChange={e=>setWalletForm(p=>({...p,address:e.target.value}))} placeholder="0x…" className="font-mono text-xs"/></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Network">
                <Select value={walletForm.network} onChange={e=>setWalletForm(p=>({...p,network:e.target.value}))}>
                  {Object.keys(networks).map(n => <option key={n}>{n}</option>)}
                </Select>
              </Field>
              <Field label="Balance (USD)"><Input type="number" step="0.01" value={walletForm.balance} onChange={e=>setWalletForm(p=>({...p,balance:e.target.value}))} placeholder="0.00"/></Field>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowAddWallet(false); setFormError(""); }} className="flex-1 py-3 bg-white/5 text-white/50 rounded-xl text-sm hover:bg-white/8 transition-all">Cancel</button>
              <button onClick={handleAddWallet} className="flex-[2] py-3 rounded-xl font-bold text-sm text-black transition-all hover:opacity-90" style={{ background: BRAND }}>Add Wallet</button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Confirm deletes */}
      {deletingCardId && <ConfirmDelete title="Delete Card?" subtitle="This will permanently remove this card." onClose={()=>setDeletingCardId(null)} onConfirm={()=>handleDeleteCard(deletingCardId)}/>}
      {deletingWalletId && (
        <ConfirmDelete title="Delete Wallet?" subtitle="This will permanently remove this wallet." onClose={()=>setDeletingWalletId(null)}
          onConfirm={async()=>{ const id=deletingWalletId; setDeletingWalletId(null); removeWallet(id); }}/>
      )}
    </div>
  );
}