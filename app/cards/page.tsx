"use client";
import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../context/Web3Context";
import { useAppSettings } from "../context/AppSettingsContext";
import { encryptData, decryptData, maskData, hashPasscode, verifyPasscode } from "../utils/encryption";
import { MasterPasscodeGuard } from "../components/MasterPasscodeGuard";
import { Sidebar, THEME, type ThemeType } from "../components/Sidebar";
import { PageTransition } from "../components/PageTransition";
import { useWallets } from "@/lib/hooks/useWallets";
import { Plus, Trash2, Copy, X, Shield, Wallet, CreditCard, Check, AlertCircle, Lock, Unlock, Zap, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";

interface CryptoWallet {
  id:string;name:string;address:string;network:string;balance:number;createdAt:string;
  isEncrypted?:boolean;encryptedData?:{address:string;iv:string;salt:string};passcode?:string;
}
interface BankCard {
  id:string;name:string;number:string;type:"credit"|"debit";bank:string;balance:number;
  limit?:number;createdAt:string;isEncrypted?:boolean;
  encryptedData?:{number:string;iv:string;salt:string};passcode?:string;
}

const NETWORKS=[
  {name:"Ethereum",color:"#627eea"},{name:"Polygon",color:"#8247e5"},
  {name:"BSC",color:"#f0b90b"},{name:"Arbitrum",color:"#28a0f0"},
  {name:"Optimism",color:"#ff0420"},{name:"Base",color:"#0052ff"},
];

function shortAddr(a:string){return a?`${a.slice(0,6)}…${a.slice(-4)}`:" ";}

export default function CardsPage() {
  const { isWeb3, mode, setMode } = useWeb3();
  const { setCurrentPage, isDark, setIsDark } = useAppSettings();
  const T = isDark ? THEME.dark : THEME.light;

  const [hydrated, setHydrated] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [decodingId, setDecodingId] = useState<string | null>(null);
  const [passcode, setPasscode] = useState("");
  const [decodedData, setDecodedData] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const { wallets, loading: wLoading, addWallet, removeWallet } = useWallets();
  const [cards, setCards] = useState<BankCard[]>([]);

  useEffect(() => {
    setHydrated(true);
    setCurrentPage("cards");
    // Load cards from API
    fetch('/api/cards')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data) && data.length > 0) setCards(data); })
      .catch(() => {});
  }, [setCurrentPage]);

  const saveCards = (newCards: BankCard[]) => {
    setCards(newCards);
  };

  if (!hydrated) return null;

  return (
    <MasterPasscodeGuard isDark={isDark}>
      <PageTransition>
        <style>{`
          .bento-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
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
                      style={{ padding: "8px 20px", borderRadius: 99, border: "none", fontSize: 13, fontWeight: 700,
                        background: mode === m ? T.textPri : T.pill, color: mode === m ? T.bg : T.textSec, cursor: "pointer", transition: "all 0.2s" }}>
                      {m.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setAddModal(true)} style={{ padding: "0 24px", height: 48, borderRadius: 16, background: T.yellow, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 800, color: "#000", display: "flex", alignItems: "center", gap: 8, boxShadow: `0 8px 20px ${T.yellow}40` }}>
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
                  <div style={{ fontSize: 32, fontWeight: 800 }}>${(mode === "crypto" ? wallets : cards).reduce((s, c) => s + c.balance, 0).toLocaleString()}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, color: T.green }}>
                    <Activity size={14} />
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{mode === "crypto" ? wallets.length : cards.length} Active Assets</span>
                  </div>
                </div>
              </div>

              {/* Assets Grid */}
              <div style={{ gridColumn: "span 8", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.5rem" }}>
                {(mode === "crypto" ? wallets : cards).map((asset: any) => (
                  <div key={asset.id} className="bento-card" style={{ background: T.card, borderRadius: 32, padding: "2rem", border: `1px solid ${T.border}`, position: "relative", overflow: "hidden" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: T.pill, display: "flex", alignItems: "center", justifyContent: "center", color: T.textSec }}>
                          {mode === "crypto" ? <Wallet size={20} /> : <CreditCard size={20} />}
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800 }}>{asset.name}</div>
                          <div style={{ fontSize: 12, color: T.textMut }}>{mode === "crypto" ? asset.network : asset.bank}</div>
                        </div>
                      </div>
                      <button onClick={() => mode === "crypto" ? removeWallet(asset.id) : saveCards(cards.filter(c => c.id !== asset.id))} style={{ width: 36, height: 36, borderRadius: 10, background: T.pill, border: "none", cursor: "pointer", color: T.red, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    {mode === "banks" && <div className="card-chip" />}
                    
                    <div style={{ marginBottom: "1.5rem" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.textSec, textTransform: "uppercase", marginBottom: 4 }}>Balance</div>
                      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>${asset.balance.toLocaleString()}</div>
                    </div>

                    <div style={{ background: T.pill, borderRadius: 16, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: T.textSec, fontFamily: "monospace" }}>
                        {mode === "crypto" ? shortAddr(asset.address) : "**** **** **** " + asset.number.slice(-4)}
                      </span>
                      <Copy size={14} color={T.textMut} />
                    </div>
                  </div>
                ))}

                {(mode === "crypto" ? wallets : cards).length === 0 && (
                  <div style={{ gridColumn: "span 2", background: T.pill, borderRadius: 32, padding: "4rem", border: `1px dashed ${T.border}`, textAlign: "center", color: T.textMut }}>
                    <Plus size={48} style={{ marginBottom: 16, opacity: 0.2 }} />
                    <div style={{ fontSize: 16, fontWeight: 700 }}>No {mode === "crypto" ? "wallets" : "cards"} added yet</div>
                    <p style={{ fontSize: 13, marginTop: 4 }}>Click the button above to add your first asset.</p>
                  </div>
                )}
              </div>

            </div>
          </main>
        </div>
      </PageTransition>
    </MasterPasscodeGuard>
  );
}
