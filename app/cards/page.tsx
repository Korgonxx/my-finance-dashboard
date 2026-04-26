"use client";
import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../context/Web3Context";
import { useAppSettings } from "../context/AppSettingsContext";
import { encryptData, decryptData, maskData } from "../utils/encryption";
import { MasterPasscodeGuard } from "../components/MasterPasscodeGuard";
import { Sidebar, THEME, type ThemeType } from "../components/Sidebar";
import { PageTransition } from "../components/PageTransition";
import { useWallets } from "@/lib/hooks/useWallets";
import {
  Plus, Trash2, Copy, X, Shield, Wallet, CreditCard,
  Check, AlertCircle, Lock, Unlock, Activity, ArrowUpRight
} from "lucide-react";

interface CryptoWallet {
  id: string;
  name: string;
  address: string;
  network: string;
  balance: number;
  createdAt: string;
  isEncrypted?: boolean;
}

interface BankCard {
  id: string;
  name: string;
  last4: string;
  holder: string;
  expiry: string;
  type: "physical" | "virtual";
  balance: number;
}

function shortAddr(a: string) { return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : " "; }

export default function CardsPage() {
  const { isWeb3, mode, setMode } = useWeb3();
  const { setCurrentPage, isDark, setIsDark } = useAppSettings();
  const T = isDark ? THEME.dark : THEME.light;

  const [hydrated, setHydrated] = useState(false);
  const [cards, setCards] = useState<BankCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [cardForm, setCardForm] = useState({ name: "", last4: "", expiry: "", type: "virtual" as "physical" | "virtual" });
  const [walletForm, setWalletForm] = useState({ name: "", address: "", network: "Ethereum", balance: "" });
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const { wallets, loading: wLoading, addWallet, removeWallet } = useWallets();

  useEffect(() => {
    setHydrated(true);
    setCurrentPage("cards");
    fetchCards();
  }, [setCurrentPage]);

  async function fetchCards() {
    setLoadingCards(true);
    try {
      const r = await fetch("/api/cards");
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data)) setCards(data);
      }
    } catch {}
    setLoadingCards(false);
  }

  // FIX: card deletion now calls the API
  const handleDeleteCard = async (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
    setDeletingId(null);
    try {
      await fetch(`/api/cards/${id}`, { method: "DELETE" });
    } catch {
      // Restore on failure
      fetchCards();
    }
  };

  const handleDeleteWallet = async (id: string) => {
    setDeletingId(null);
    await removeWallet(id);
  };

  const handleAddCard = async () => {
    setFormError("");
    if (!cardForm.name.trim()) { setFormError("Card name is required."); return; }
    if (cardForm.last4.length !== 4) { setFormError("Last 4 digits must be exactly 4 numbers."); return; }
    if (!cardForm.expiry.match(/^\d{2}\/\d{2}$/)) { setFormError("Expiry must be MM/YY format."); return; }
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...cardForm, holder: "Korgon", balance: 0 }),
      });
      if (res.ok) {
        const saved = await res.json();
        setCards(prev => [...prev, saved]);
        setShowAddCard(false);
        setCardForm({ name: "", last4: "", expiry: "", type: "virtual" });
      } else {
        setFormError("Failed to add card.");
      }
    } catch {
      setFormError("Network error.");
    }
  };

  const handleAddWallet = async () => {
    setFormError("");
    if (!walletForm.name.trim()) { setFormError("Wallet name is required."); return; }
    if (!walletForm.address.trim()) { setFormError("Wallet address is required."); return; }
    const result = await addWallet({
      name: walletForm.name.trim(),
      address: walletForm.address.trim(),
      network: walletForm.network,
      balance: parseFloat(walletForm.balance) || 0,
    });
    if (result) {
      setShowAddWallet(false);
      setWalletForm({ name: "", address: "", network: "Ethereum", balance: "" });
    } else {
      setFormError("Failed to add wallet.");
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(id);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  if (!hydrated) return null;

  const assets = mode === "crypto" ? wallets : cards;
  const totalBalance = assets.reduce((s: number, c: any) => s + (c.balance || 0), 0);

  return (
    <MasterPasscodeGuard isDark={isDark}>
      <PageTransition>
        <style>{`
          .bento-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
          .bento-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
          .card-chip { width: 40px; height: 30px; background: linear-gradient(135deg, #ffd700, #b8860b); border-radius: 6px; margin-bottom: 20px; }
        `}</style>

        <div style={{ display: "flex", minHeight: "100vh", background: T.bg, fontFamily: "'Outfit', sans-serif", color: T.textPri }}>
          <Sidebar isDark={isDark} setIsDark={setIsDark} />

          <main style={{ marginLeft: 80, flex: 1, padding: "2.5rem 3rem", maxWidth: 1400, margin: "0 auto", width: "calc(100% - 80px)" }}>

            {/* Header */}
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem" }}>
              <div>
                <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 8 }}>
                  {mode === "crypto" ? "Wallets" : "Bank Cards"}
                </h1>
                <div style={{ display: "flex", gap: 12 }}>
                  {["banks", "crypto"].map(m => (
                    <button key={m} onClick={() => setMode(m as any)}
                      style={{
                        padding: "8px 20px", borderRadius: 99, border: "none", fontSize: 13, fontWeight: 700,
                        background: mode === m ? T.textPri : T.pill, color: mode === m ? T.bg : T.textSec,
                        cursor: "pointer", transition: "all 0.2s"
                      }}>
                      {m.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => mode === "crypto" ? setShowAddWallet(true) : setShowAddCard(true)}
                style={{
                  padding: "0 24px", height: 48, borderRadius: 16, background: T.yellow,
                  border: "none", cursor: "pointer", fontSize: 14, fontWeight: 800, color: "#000",
                  display: "flex", alignItems: "center", gap: 8, boxShadow: `0 8px 20px ${T.yellow}40`
                }}>
                <Plus size={20} strokeWidth={3} /> Add {mode === "crypto" ? "Wallet" : "Card"}
              </button>
            </header>

            {/* Bento Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "1.5rem" }}>

              {/* Stats Column */}
              <div style={{ gridColumn: "span 4", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div className="bento-card" style={{ background: T.card, borderRadius: 32, padding: "2rem", border: `1px solid ${T.border}` }}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: `${T.blue}20`, display: "flex", alignItems: "center", justifyContent: "center", color: T.blue, marginBottom: "1.5rem" }}>
                    <Shield size={24} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.textSec, textTransform: "uppercase", marginBottom: 4 }}>Security Status</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: T.green }}>Fully Encrypted</div>
                  <p style={{ fontSize: 13, color: T.textMut, marginTop: 8 }}>All sensitive data is protected with AES-256 encryption.</p>
                </div>

                <div className="bento-card" style={{ background: T.yellow + "15", borderRadius: 32, padding: "2rem", border: `1px solid ${T.yellow}30` }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.textSec, textTransform: "uppercase", marginBottom: 4 }}>Total Balance</div>
                  <div style={{ fontSize: 32, fontWeight: 800 }}>${totalBalance.toLocaleString()}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, color: T.green }}>
                    <Activity size={14} />
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{assets.length} Active Assets</span>
                  </div>
                </div>
              </div>

              {/* Assets Grid */}
              <div style={{ gridColumn: "span 8", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.5rem" }}>
                {(wLoading || loadingCards) ? (
                  <div style={{ gridColumn: "span 2", display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
                    <div style={{ width: 32, height: 32, border: `3px solid ${T.yellow}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  </div>
                ) : assets.length === 0 ? (
                  <div style={{ gridColumn: "span 2", background: T.pill, borderRadius: 32, padding: "4rem", border: `1px dashed ${T.border}`, textAlign: "center", color: T.textMut }}>
                    <Plus size={48} style={{ marginBottom: 16, opacity: 0.2 }} />
                    <div style={{ fontSize: 16, fontWeight: 700 }}>No {mode === "crypto" ? "wallets" : "cards"} added yet</div>
                    <p style={{ fontSize: 13, marginTop: 4 }}>Click the button above to add your first asset.</p>
                  </div>
                ) : assets.map((asset: any) => (
                  <div key={asset.id} className="bento-card" style={{ background: T.card, borderRadius: 32, padding: "2rem", border: `1px solid ${T.border}`, position: "relative", overflow: "hidden" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: T.pill, display: "flex", alignItems: "center", justifyContent: "center", color: T.textSec }}>
                          {mode === "crypto" ? <Wallet size={20} /> : <CreditCard size={20} />}
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800 }}>{asset.name}</div>
                          <div style={{ fontSize: 12, color: T.textMut }}>{mode === "crypto" ? asset.network : (asset.holder || "Card")}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setDeletingId(asset.id)}
                        style={{ width: 36, height: 36, borderRadius: 10, background: T.pill, border: "none", cursor: "pointer", color: T.red, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {mode === "banks" && <div className="card-chip" />}

                    <div style={{ marginBottom: "1.5rem" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: "uppercase", marginBottom: 4 }}>Balance</div>
                      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>${(asset.balance || 0).toLocaleString()}</div>
                    </div>

                    <div
                      onClick={() => handleCopy(mode === "crypto" ? asset.address : asset.last4, asset.id)}
                      style={{ background: T.pill, borderRadius: 16, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                      <span style={{ fontSize: 13, color: T.textSec, fontFamily: "monospace" }}>
                        {mode === "crypto" ? shortAddr(asset.address) : `**** **** **** ${asset.last4}`}
                      </span>
                      {copySuccess === asset.id ? <Check size={14} color={T.green} /> : <Copy size={14} color={T.textMut} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>

        {/* Delete Confirmation Modal */}
        {deletingId && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}>
            <div style={{ background: T.card, borderRadius: 24, padding: "2rem", maxWidth: 360, width: "90%", border: `1px solid ${T.border}`, textAlign: "center" }}>
              <Trash2 size={40} color={T.red} style={{ margin: "0 auto 1rem" }} />
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Delete {mode === "crypto" ? "Wallet" : "Card"}?</h3>
              <p style={{ color: T.textSec, fontSize: 14, marginBottom: "1.5rem" }}>This action cannot be undone.</p>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setDeletingId(null)}
                  style={{ flex: 1, padding: "12px", borderRadius: 14, background: T.pill, border: `1px solid ${T.border}`, color: T.textSec, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
                  Cancel
                </button>
                <button onClick={() => mode === "crypto" ? handleDeleteWallet(deletingId) : handleDeleteCard(deletingId)}
                  style={{ flex: 1, padding: "12px", borderRadius: 14, background: T.red + "22", border: `1px solid ${T.red}44`, color: T.red, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Card Modal */}
        {showAddCard && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}>
            <div style={{ background: T.card, borderRadius: 28, padding: "2rem", maxWidth: 420, width: "90%", border: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: 20, fontWeight: 800 }}>Add Card</h3>
                <button onClick={() => { setShowAddCard(false); setFormError(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: T.textSec }}><X size={20} /></button>
              </div>
              {formError && <div style={{ background: T.red + "15", border: `1px solid ${T.red}30`, borderRadius: 12, padding: "10px 14px", color: T.red, fontSize: 13, marginBottom: 16 }}>{formError}</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: T.textSec, display: "block", marginBottom: 6 }}>Card Name</label>
                  <input value={cardForm.name} onChange={e => setCardForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Chase Debit"
                    style={{ width: "100%", background: T.pill, border: `1px solid ${T.border}`, borderRadius: 12, padding: "10px 14px", color: T.textPri, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: T.textSec, display: "block", marginBottom: 6 }}>Last 4 Digits</label>
                    <input value={cardForm.last4} maxLength={4} onChange={e => setCardForm(p => ({ ...p, last4: e.target.value.replace(/\D/g, "") }))}
                      placeholder="4209"
                      style={{ width: "100%", background: T.pill, border: `1px solid ${T.border}`, borderRadius: 12, padding: "10px 14px", color: T.textPri, fontSize: 14, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: T.textSec, display: "block", marginBottom: 6 }}>Expiry (MM/YY)</label>
                    <input value={cardForm.expiry} maxLength={5} onChange={e => setCardForm(p => ({ ...p, expiry: e.target.value }))}
                      placeholder="12/28"
                      style={{ width: "100%", background: T.pill, border: `1px solid ${T.border}`, borderRadius: 12, padding: "10px 14px", color: T.textPri, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: T.textSec, display: "block", marginBottom: 6 }}>Type</label>
                  <select value={cardForm.type} onChange={e => setCardForm(p => ({ ...p, type: e.target.value as any }))}
                    style={{ width: "100%", background: T.pill, border: `1px solid ${T.border}`, borderRadius: 12, padding: "10px 14px", color: T.textPri, fontSize: 14, outline: "none" }}>
                    <option value="physical">Physical</option>
                    <option value="virtual">Virtual</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: "1.5rem" }}>
                <button onClick={() => { setShowAddCard(false); setFormError(""); }}
                  style={{ flex: 1, padding: "12px", borderRadius: 14, background: T.pill, border: `1px solid ${T.border}`, color: T.textSec, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
                  Cancel
                </button>
                <button onClick={handleAddCard}
                  style={{ flex: 2, padding: "12px", borderRadius: 14, background: T.yellow, border: "none", color: "#000", cursor: "pointer", fontSize: 14, fontWeight: 800 }}>
                  Add Card
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Wallet Modal */}
        {showAddWallet && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}>
            <div style={{ background: T.card, borderRadius: 28, padding: "2rem", maxWidth: 420, width: "90%", border: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: 20, fontWeight: 800 }}>Add Wallet</h3>
                <button onClick={() => { setShowAddWallet(false); setFormError(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: T.textSec }}><X size={20} /></button>
              </div>
              {formError && <div style={{ background: T.red + "15", border: `1px solid ${T.red}30`, borderRadius: 12, padding: "10px 14px", color: T.red, fontSize: 13, marginBottom: 16 }}>{formError}</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: T.textSec, display: "block", marginBottom: 6 }}>Wallet Name</label>
                  <input value={walletForm.name} onChange={e => setWalletForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. MetaMask, Ledger"
                    style={{ width: "100%", background: T.pill, border: `1px solid ${T.border}`, borderRadius: 12, padding: "10px 14px", color: T.textPri, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: T.textSec, display: "block", marginBottom: 6 }}>Wallet Address</label>
                  <input value={walletForm.address} onChange={e => setWalletForm(p => ({ ...p, address: e.target.value }))}
                    placeholder="0x... or Solana address"
                    style={{ width: "100%", background: T.pill, border: `1px solid ${T.border}`, borderRadius: 12, padding: "10px 14px", color: T.textPri, fontSize: 14, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: T.textSec, display: "block", marginBottom: 6 }}>Network</label>
                    <select value={walletForm.network} onChange={e => setWalletForm(p => ({ ...p, network: e.target.value }))}
                      style={{ width: "100%", background: T.pill, border: `1px solid ${T.border}`, borderRadius: 12, padding: "10px 14px", color: T.textPri, fontSize: 14, outline: "none" }}>
                      <option value="Ethereum">Ethereum</option>
                      <option value="Solana">Solana</option>
                      <option value="Bitcoin">Bitcoin</option>
                      <option value="Polygon">Polygon</option>
                      <option value="Arbitrum">Arbitrum</option>
                      <option value="Base">Base</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: T.textSec, display: "block", marginBottom: 6 }}>Balance (USD)</label>
                    <input type="number" value={walletForm.balance} onChange={e => setWalletForm(p => ({ ...p, balance: e.target.value }))}
                      placeholder="0.00"
                      style={{ width: "100%", background: T.pill, border: `1px solid ${T.border}`, borderRadius: 12, padding: "10px 14px", color: T.textPri, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: "1.5rem" }}>
                <button onClick={() => { setShowAddWallet(false); setFormError(""); }}
                  style={{ flex: 1, padding: "12px", borderRadius: 14, background: T.pill, border: `1px solid ${T.border}`, color: T.textSec, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
                  Cancel
                </button>
                <button onClick={handleAddWallet}
                  style={{ flex: 2, padding: "12px", borderRadius: 14, background: T.yellow, border: "none", color: "#000", cursor: "pointer", fontSize: 14, fontWeight: 800 }}>
                  Add Wallet
                </button>
              </div>
            </div>
          </div>
        )}
      </PageTransition>
    </MasterPasscodeGuard>
  );
}