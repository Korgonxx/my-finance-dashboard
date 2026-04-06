"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus, Trash2, Copy, ExternalLink, Wallet, ArrowRight,
  CheckCircle, X, Zap, CreditCard, Lock, Eye, EyeOff, Sun, Moon,
  AlertCircle, Shield,
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import { useAppSettings } from "../context/AppSettingsContext";
import { encryptData, decryptData, maskData, hashPasscode, verifyPasscode } from "../utils/encryption";
import { FloatingToolsWindow } from "../components/FloatingToolsWindow";
import { MasterPasscodeGuard } from "../components/MasterPasscodeGuard";

const DARK = {
  bg: "#06080f",
  card: "rgba(255,255,255,0.032)",
  border: "rgba(255,255,255,0.075)",
  primary: "#00c9a7",
  violet: "#8b5cf6",
  rose: "#f43f5e",
  blue: "#60a5fa",
  textPri: "#f0f4ff",
  textSec: "rgba(240,244,255,0.5)",
  textMut: "rgba(240,244,255,0.28)",
  headerBg: "rgba(6,8,15,0.82)",
  shadow: "0 32px 80px rgba(0,0,0,0.8)",
  btnGhost: "rgba(255,255,255,0.05)",
  inputBg: "rgba(255,255,255,0.04)",
  selectBg: "rgba(6,8,15,0.85)",
  tagBg: "rgba(255,255,255,0.03)",
};

const LIGHT = {
  bg: "#f0f4f8",
  card: "rgba(255,255,255,0.85)",
  border: "rgba(0,0,0,0.08)",
  primary: "#009d82",
  violet: "#7c3aed",
  rose: "#e11d48",
  blue: "#2563eb",
  textPri: "#0d1117",
  textSec: "rgba(13,17,23,0.6)",
  textMut: "rgba(13,17,23,0.38)",
  headerBg: "rgba(240,244,248,0.9)",
  shadow: "0 32px 80px rgba(0,0,0,0.12)",
  btnGhost: "rgba(0,0,0,0.04)",
  inputBg: "rgba(0,0,0,0.04)",
  selectBg: "rgba(255,255,255,0.95)",
  tagBg: "rgba(0,0,0,0.03)",
};

interface CryptoWallet {
  id: string;
  name: string;
  address: string;
  network: string;
  balance: number;
  createdAt: string;
  isEncrypted?: boolean;
  encryptedData?: {
    address: string;
    iv: string;
    salt: string;
  };
  passcode?: string; // Hashed passcode
}

interface BankCard {
  id: string;
  name: string;
  number: string;
  type: "credit" | "debit";
  bank: string;
  balance: number;
  limit?: number;
  createdAt: string;
  isEncrypted?: boolean;
  encryptedData?: {
    number: string;
    iv: string;
    salt: string;
  };
  passcode?: string; // Hashed passcode
}

const NETWORKS = [
  { name: "Ethereum", color: "#627eea" },
  { name: "Polygon", color: "#8247e5" },
  { name: "BSC", color: "#f0b90b" },
  { name: "Arbitrum", color: "#28a0f0" },
  { name: "Optimism", color: "#ff0420" },
  { name: "Base", color: "#0052ff" },
];

const shortAddr = (addr: string) =>
  addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";

const glassCard = (T: typeof DARK, extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 16,
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  ...extra,
});

function CardsPage() {
  const { mode } = useWeb3();
  const { setCurrentPage, hideBalances } = useAppSettings();
  const isWeb3 = mode === "web3";
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) {
      setIsDark(saved === "dark");
    } else {
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  // Update page indicator for floating window
  useEffect(() => {
    setCurrentPage("cards");
  }, [setCurrentPage]);
  
  const T = isDark ? DARK : LIGHT;

  // Web3: Wallets
  const [wallets, setWallets] = useState<CryptoWallet[]>([
    {
      id: "1",
      name: "Main Wallet",
      address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      network: "Ethereum",
      balance: 12500.5,
      createdAt: "2025-01-10",
    },
    {
      id: "2",
      name: "DeFi Wallet",
      address: "0x3A76Bff1aA3c56E9f0E96c8B23B3a61B3f0c21D",
      network: "Polygon",
      balance: 8200.0,
      createdAt: "2025-03-15",
    },
    {
      id: "3",
      name: "Trading Wallet",
      address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      network: "Base",
      balance: 5600.25,
      createdAt: "2025-05-20",
    },
  ]);

  // Web2: Bank Cards
  const [cards, setCards] = useState<BankCard[]>([
    {
      id: "1",
      name: "Primary Checking",
      number: "****1234",
      type: "debit",
      bank: "Chase Bank",
      balance: 15250.00,
      createdAt: "2024-06-15",
    },
    {
      id: "2",
      name: "Rewards Credit",
      number: "****5678",
      type: "credit",
      bank: "Capital One",
      balance: 3200.50,
      limit: 15000,
      createdAt: "2024-08-20",
    },
    {
      id: "3",
      name: "Savings Account",
      number: "****9012",
      type: "debit",
      bank: "Wells Fargo",
      balance: 28500.75,
      createdAt: "2024-03-10",
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    network: "Ethereum",
    number: "",
    type: "debit" as "debit" | "credit",
    bank: "",
    limit: "",
  });

  // Encryption modal states
  const [showEncryptModal, setShowEncryptModal] = useState(false);
  const [encryptionPasscode, setEncryptionPasscode] = useState("");
  const [encryptionPasscodeConfirm, setEncryptionPasscodeConfirm] = useState("");
  const [encryptionError, setEncryptionError] = useState("");
  const [encryptionLoading, setEncryptionLoading] = useState(false);

  // Decryption modal states
  const [showDecryptModal, setShowDecryptModal] = useState(false);
  const [decryptPasscode, setDecryptPasscode] = useState("");
  const [decryptError, setDecryptError] = useState("");
  const [decryptItemId, setDecryptItemId] = useState<string | null>(null);
  const [decryptedData, setDecryptedData] = useState<{ [key: string]: string }>({});
  const [decryptLoading, setDecryptLoading] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeletePasscodeModal, setShowDeletePasscodeModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetType, setDeleteTargetType] = useState<"wallet" | "card" | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState("");
  const [deletePasscode, setDeletePasscode] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleAddWallet = () => {
    if (!formData.name || !formData.address) return;
    // Close the add form and show the encryption modal to avoid layering issues
    setShowModal(false);
    setEncryptionError("");
    setEncryptionPasscode("");
    setEncryptionPasscodeConfirm("");
    setShowEncryptModal(true);
  };

  const handleAddCard = () => {
    if (!formData.name || !formData.number || !formData.bank) return;
    // Close the add form and show the encryption modal to avoid layering issues
    setShowModal(false);
    setEncryptionError("");
    setEncryptionPasscode("");
    setEncryptionPasscodeConfirm("");
    setShowEncryptModal(true);
  };

  const requestDeleteItem = (type: "wallet" | "card", id: string, name: string) => {
    setDeleteTargetId(id);
    setDeleteTargetType(type);
    setDeleteTargetName(name);
    setDeletePasscode("");
    setDeleteError("");
    setShowDeleteConfirm(true);
  };

  const performDeleteItem = () => {
    if (!deleteTargetId || !deleteTargetType) {
      return;
    }

    if (deleteTargetType === "wallet") {
      setWallets(wallets.filter((w) => w.id !== deleteTargetId));
    } else {
      setCards(cards.filter((c) => c.id !== deleteTargetId));
    }

    setShowDeleteConfirm(false);
    setShowDeletePasscodeModal(false);
    setDeleteTargetId(null);
    setDeleteTargetType(null);
    setDeleteTargetName("");
    setDeletePasscode("");
    setDeleteError("");
    setDeleteLoading(false);
  };

  const confirmDeleteRequest = () => {
    setShowDeleteConfirm(false);

    const targetItem = deleteTargetType === "wallet"
      ? wallets.find((w) => w.id === deleteTargetId)
      : cards.find((c) => c.id === deleteTargetId);

    if (targetItem?.passcode) {
      setShowDeletePasscodeModal(true);
      return;
    }

    performDeleteItem();
  };

  const handleDeletePasscodeConfirm = async () => {
    if (!deletePasscode) {
      setDeleteError("Please enter the passcode to delete.");
      return;
    }

    if (!deleteTargetId || !deleteTargetType) return;

    setDeleteLoading(true);

    try {
      const targetItem = deleteTargetType === "wallet"
        ? wallets.find((w) => w.id === deleteTargetId)
        : cards.find((c) => c.id === deleteTargetId);

      if (!targetItem) {
        throw new Error("Item not found");
      }

      if (!targetItem.passcode) {
        performDeleteItem();
        return;
      }

      const valid = await verifyPasscode(deletePasscode, targetItem.passcode);
      if (!valid) {
        setDeleteError("Passcode incorrect");
        setDeleteLoading(false);
        return;
      }

      performDeleteItem();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Unable to delete item");
      setDeleteLoading(false);
    }
  };

  const handleDeleteWallet = (id: string) => {
    const wallet = wallets.find((w) => w.id === id);
    requestDeleteItem("wallet", id, wallet?.name || "wallet");
  };

  const handleDeleteCard = (id: string) => {
    const card = cards.find((c) => c.id === id);
    requestDeleteItem("card", id, card?.name || "card");
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
  };

  // Encryption handlers
  const handleEncryptionConfirm = async () => {
    if (!encryptionPasscode || !encryptionPasscodeConfirm) {
      setEncryptionError("Please enter and confirm the passcode");
      return;
    }

    if (encryptionPasscode !== encryptionPasscodeConfirm) {
      setEncryptionError("Passcodes do not match");
      return;
    }

    if (encryptionPasscode.length < 6) {
      setEncryptionError("Passcode must be at least 6 digits");
      return;
    }

    if (!/^\d+$/.test(encryptionPasscode)) {
      setEncryptionError("Passcode must contain only numbers");
      return;
    }

    setEncryptionLoading(true);
    try {
      // Hash the passcode for verification
      const hashedPasscode = await hashPasscode(encryptionPasscode);

      if (isWeb3) {
        // Encrypt wallet address
        const encryptedAddr = await encryptData(formData.address, encryptionPasscode);
        const newWallet: CryptoWallet = {
          id: Date.now().toString(),
          name: formData.name,
          address: maskData(formData.address), // Display masked version
          network: formData.network,
          balance: 0,
          createdAt: new Date().toISOString().split("T")[0],
          isEncrypted: true,
          encryptedData: {
            address: encryptedAddr.encryptedData,
            iv: encryptedAddr.iv,
            salt: encryptedAddr.salt,
          },
          passcode: hashedPasscode,
        };
        setWallets([...wallets, newWallet]);
      } else {
        // Encrypt card number
        const encryptedNum = await encryptData(formData.number, encryptionPasscode);
        const newCard: BankCard = {
          id: Date.now().toString(),
          name: formData.name,
          number: maskData(formData.number), // Display masked version
          type: formData.type,
          bank: formData.bank,
          balance: 0,
          limit: formData.type === "credit" ? (formData.limit ? parseFloat(formData.limit) : undefined) : undefined,
          createdAt: new Date().toISOString().split("T")[0],
          isEncrypted: true,
          encryptedData: {
            number: encryptedNum.encryptedData,
            iv: encryptedNum.iv,
            salt: encryptedNum.salt,
          },
          passcode: hashedPasscode,
        };
        setCards([...cards, newCard]);
      }

      setFormData({ name: "", address: "", network: "Ethereum", number: "", type: "debit", bank: "", limit: "" });
      setShowModal(false);
      setShowEncryptModal(false);
      setEncryptionPasscode("");
      setEncryptionPasscodeConfirm("");
    } catch (error) {
      setEncryptionError(error instanceof Error ? error.message : "Encryption failed");
    } finally {
      setEncryptionLoading(false);
    }
  };

  // Decryption handlers
  const handleDecryptStart = (itemId: string) => {
    setDecryptItemId(itemId);
    setDecryptPasscode("");
    setDecryptError("");
    setShowDecryptModal(true);
  };

  const handleDecryptConfirm = async () => {
    if (!decryptPasscode || !decryptItemId) {
      setDecryptError("Please enter passcode");
      return;
    }

    if (!/^\d+$/.test(decryptPasscode)) {
      setDecryptError("Passcode must contain only numbers");
      return;
    }

    setDecryptLoading(true);
    try {
      let itemData = null;

      if (isWeb3) {
        itemData = wallets.find((w) => w.id === decryptItemId);
      } else {
        itemData = cards.find((c) => c.id === decryptItemId);
      }

      if (!itemData || !itemData.encryptedData) {
        throw new Error("Item not found or not encrypted");
      }

      // Verify passcode by decrypting
      const keyToDecrypt = isWeb3 ? "address" : "number";
      const dataToDecrypt = (itemData.encryptedData as Record<string, string>)[keyToDecrypt];
      const decrypted = await decryptData(
        dataToDecrypt,
        decryptPasscode,
        itemData.encryptedData.salt,
        itemData.encryptedData.iv
      );

      // Store decrypted data temporarily
      setDecryptedData((prev) => ({
        ...prev,
        [decryptItemId]: decrypted,
      }));

      setShowDecryptModal(false);
    } catch (error) {
      setDecryptError(error instanceof Error ? error.message : "Failed to decrypt - incorrect passcode");
    } finally {
      setDecryptLoading(false);
    }
  };

  const totalBalance = isWeb3
    ? wallets.reduce((sum, w) => sum + w.balance, 0)
    : cards.reduce((sum, c) => sum + c.balance, 0);
  const networkColor = (network: string) => {
    const n = NETWORKS.find((net) => net.name === network);
    return n?.color || "#94a3b8";
  };

  const bgStyle: React.CSSProperties = {
    background: isDark
      ? `radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,201,167,0.07) 0%, transparent 55%), radial-gradient(ellipse 60% 45% at 85% 90%, rgba(139,92,246,0.06) 0%, transparent 55%), ${T.bg}`
      : `radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,157,130,0.08) 0%, transparent 55%), radial-gradient(ellipse 60% 45% at 85% 90%, rgba(124,58,237,0.05) 0%, transparent 55%), ${T.bg}`,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&family=Geist:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes slideUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
      `}</style>

      <MasterPasscodeGuard isDark={isDark}>
        <div
          style={{
            minHeight: "100vh",
            ...bgStyle,
            fontFamily: "'Geist','Segoe UI',sans-serif",
            color: T.textPri,
            animation: "fadeIn 0.35s ease",
          }}
        >
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
          }}
        >
          <div
            style={{
              maxWidth: 1380,
              margin: "0 auto",
              padding: "0 2rem",
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img src="/brand/logo.png" alt="Ledger logo" width={34} height={34}
                  style={{ width: 34, height: 34, borderRadius: 10, objectFit: "contain", background: T.card, padding: 6 }} />
                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: T.textPri,
                      letterSpacing: "-0.03em",
                      fontFamily: "'Syne',sans-serif",
                    }}
                  >
                    Ledger
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: T.textMut,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Personal Finance
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <button
                onClick={() => {
                  const newIsDark = !isDark;
                  setIsDark(newIsDark);
                  localStorage.setItem("theme", newIsDark ? "dark" : "light");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 12px",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  background: T.btnGhost,
                  border: `1px solid ${T.border}`,
                  color: T.textMut,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = T.textPri;
                  (e.currentTarget as HTMLButtonElement).style.background = `${T.primary}12`;
                  (e.currentTarget as HTMLButtonElement).style.borderColor = T.primary;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = T.textMut;
                  (e.currentTarget as HTMLButtonElement).style.background = T.btnGhost;
                  (e.currentTarget as HTMLButtonElement).style.borderColor = T.border;
                }}
              >
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              <Link
                href="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 12px",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  color: T.textMut,
                }}
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ maxWidth: 1380, margin: "0 auto", padding: "2rem" }}>
          {/* Title & Stats */}
          <div style={{ marginBottom: "2.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div>
                <h1
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: 800,
                    color: T.textPri,
                    marginBottom: 6,
                    fontFamily: "'Syne',sans-serif",
                  }}
                >
                  {isWeb3 ? "Wallets" : "Cards"}
                </h1>
                <p style={{ color: T.textMut, fontSize: 14 }}>
                  {isWeb3
                    ? "Manage your cryptocurrency wallets across multiple networks"
                    : "Manage your bank accounts and credit/debit cards"}
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: `linear-gradient(135deg, ${T.primary}, ${T.primary}cc)`,
                  border: "none",
                  borderRadius: 10,
                  padding: "0.65rem 1.4rem",
                  color: isDark ? "#021a14" : "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <Plus size={15} /> {isWeb3 ? "Add Wallet" : "Add Card"}
              </button>
            </div>

            {/* Total Balance Card */}
            <div
              style={{
                ...glassCard(T, {
                  padding: "1.5rem 2rem",
                  position: "relative",
                  overflow: "hidden",
                }),
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: T.textMut,
                  marginBottom: "0.75rem",
                }}
              >
                {isWeb3 ? "Total Portfolio Value" : "Total Balance"}
              </div>
              <div
                style={{
                  fontFamily: "'DM Mono','Fira Mono',monospace",
                  fontSize: "2.25rem",
                  fontWeight: 700,
                  color: T.textPri,
                  letterSpacing: "-0.03em",
                }}
              >
                ${totalBalance.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div style={{ fontSize: 12, color: T.textMut, marginTop: "0.5rem" }}>
                {isWeb3
                  ? `${wallets.length} wallet${wallets.length !== 1 ? "s" : ""} connected`
                  : `${cards.length} card${cards.length !== 1 ? "s" : ""} added`}
              </div>
            </div>
          </div>

          {/* Cards/Wallets Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {isWeb3
              ? wallets.map((wallet) => (
              <div
                key={wallet.id}
                style={{
                  ...glassCard(T, {
                    padding: "1.5rem",
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }),
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: "1.25rem",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: T.textMut,
                        marginBottom: 6,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {wallet.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        background: `${networkColor(wallet.network)}22`,
                        border: `1px solid ${networkColor(wallet.network)}44`,
                        padding: "3px 8px",
                        borderRadius: 6,
                        color: networkColor(wallet.network),
                        fontWeight: 600,
                        width: "fit-content",
                      }}
                    >
                      {wallet.network}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteWallet(wallet.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: T.rose,
                      cursor: "pointer",
                      padding: 4,
                      display: "flex",
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Address */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: T.textMut,
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      fontWeight: 600,
                    }}
                  >
                    Address {wallet.isEncrypted && <Lock size={10} style={{ display: "inline", marginLeft: 4 }} />}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontFamily: "'DM Mono','Fira Mono',monospace",
                      fontSize: 12,
                      background: T.inputBg,
                      padding: "0.5rem 0.75rem",
                      borderRadius: 8,
                      border: `1px solid ${T.border}`,
                      color: T.textPri,
                    }}
                  >
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {wallet.isEncrypted && decryptedData[wallet.id]
                        ? shortAddr(decryptedData[wallet.id])
                        : wallet.isEncrypted
                        ? wallet.address
                        : shortAddr(wallet.address)}
                    </span>
                    {wallet.isEncrypted && !decryptedData[wallet.id] ? (
                      <button
                        onClick={() => handleDecryptStart(wallet.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: T.blue,
                          cursor: "pointer",
                          padding: 4,
                          display: "flex",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                        title="Decrypt address"
                      >
                        <Eye size={14} />
                      </button>
                    ) : wallet.isEncrypted && decryptedData[wallet.id] ? (
                      <button
                        onClick={() => {
                          setDecryptedData((prev) => {
                            const next = { ...prev };
                            delete next[wallet.id];
                            return next;
                          });
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: T.primary,
                          cursor: "pointer",
                          padding: 4,
                          display: "flex",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                        title="Hide address"
                      >
                        <EyeOff size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCopyAddress(wallet.address)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: T.primary,
                          cursor: "pointer",
                          padding: 4,
                          display: "flex",
                        }}
                      >
                        <Copy size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Balance */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: T.textMut,
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      fontWeight: 600,
                    }}
                  >
                    Balance
                  </div>
                  <div
                    style={{
                      fontFamily: "'DM Mono','Fira Mono',monospace",
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: T.primary,
                    }}
                  >
                    {hideBalances ? "****" : `$${wallet.balance.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`}
                  </div>
                </div>

                {/* Footer */}
                <div
                  style={{
                    fontSize: 11,
                    color: T.textMut,
                    paddingTop: "1rem",
                    borderTop: `1px solid ${T.border}`,
                  }}
                >
                  Added {wallet.createdAt}
                </div>
              </div>
            ))
              : cards.map((card) => (
                <div
                  key={card.id}
                  style={{
                    ...glassCard(T, {
                      padding: "1.5rem",
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      background: `linear-gradient(135deg, ${card.type === "credit" ? T.violet : T.primary}15, ${card.type === "credit" ? T.rose : T.blue}08)`,
                    }),
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      marginBottom: "1.25rem",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: T.textMut,
                          marginBottom: 6,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {card.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          background: `${card.type === "credit" ? T.violet : T.primary}22`,
                          border: `1px solid ${card.type === "credit" ? T.violet : T.primary}44`,
                          padding: "3px 8px",
                          borderRadius: 6,
                          color: card.type === "credit" ? T.violet : T.primary,
                          fontWeight: 600,
                          width: "fit-content",
                          textTransform: "capitalize",
                        }}
                      >
                        {card.type}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: T.rose,
                        cursor: "pointer",
                        padding: 4,
                        display: "flex",
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Bank Info */}
                  <div style={{ marginBottom: "1.25rem" }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: T.textMut,
                        marginBottom: 6,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        fontWeight: 600,
                      }}
                    >
                      Bank
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.textPri }}>
                      {card.bank}
                    </div>
                  </div>

                  {/* Card Number */}
                  <div style={{ marginBottom: "1.25rem" }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: T.textMut,
                        marginBottom: 6,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        fontWeight: 600,
                      }}
                    >
                      Card Number {card.isEncrypted && <Lock size={10} style={{ display: "inline", marginLeft: 4 }} />}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontFamily: "'DM Mono','Fira Mono',monospace",
                        fontSize: 14,
                        letterSpacing: "0.15em",
                        color: T.textPri,
                        fontWeight: 600,
                        padding: "0.5rem 0.75rem",
                        background: card.isEncrypted ? T.inputBg : "transparent",
                        borderRadius: card.isEncrypted ? 8 : 0,
                        border: card.isEncrypted ? `1px solid ${T.border}` : "none",
                      }}
                    >
                      <span>
                        {card.isEncrypted && decryptedData[card.id]
                          ? decryptedData[card.id]
                          : card.number}
                      </span>
                      {card.isEncrypted && !decryptedData[card.id] && (
                        <button
                          onClick={() => handleDecryptStart(card.id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: T.blue,
                            cursor: "pointer",
                            padding: 4,
                            display: "flex",
                            marginLeft: "auto",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                          title="Decrypt card number"
                        >
                          <Eye size={14} />
                        </button>
                      )}
                      {card.isEncrypted && decryptedData[card.id] && (
                        <button
                          onClick={() => {
                            setDecryptedData((prev) => {
                              const next = { ...prev };
                              delete next[card.id];
                              return next;
                            });
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: T.primary,
                            cursor: "pointer",
                            padding: 4,
                            display: "flex",
                            marginLeft: "auto",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                          title="Hide card number"
                        >
                          <EyeOff size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Balance */}
                  <div style={{ marginBottom: "1.25rem" }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: T.textMut,
                        marginBottom: 6,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        fontWeight: 600,
                      }}
                    >
                      {card.type === "credit" ? "Available Balance" : "Balance"}
                    </div>
                    <div
                      style={{
                        fontFamily: "'DM Mono','Fira Mono',monospace",
                        fontSize: "1.25rem",
                        fontWeight: 700,
                        color: card.type === "credit" ? T.violet : T.primary,
                      }}
                    >
                      {hideBalances ? "****" : `$${card.balance.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`}
                    </div>
                  </div>

                  {/* Limit for Credit Cards */}
                  {card.type === "credit" && card.limit && (
                    <div style={{ marginBottom: "1.25rem" }}>
                      <div
                        style={{
                          fontSize: 11,
                          color: T.textMut,
                          marginBottom: 6,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          fontWeight: 600,
                        }}
                      >
                        Credit Limit
                      </div>
                      <div
                        style={{
                          fontFamily: "'DM Mono','Fira Mono',monospace",
                          fontSize: "1rem",
                          fontWeight: 600,
                          color: T.violet,
                        }}
                      >
                        {hideBalances ? "****" : `$${card.limit.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div
                    style={{
                      fontSize: 11,
                      color: T.textMut,
                      paddingTop: "1rem",
                      borderTop: `1px solid ${T.border}`,
                    }}
                  >
                    Added {card.createdAt}
                  </div>
                </div>
              ))}
          </div>

          {isWeb3 && wallets.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "3rem",
                ...glassCard(T, { padding: "2rem" }),
              }}
            >
              <Wallet size={32} style={{ color: T.textMut, margin: "0 auto 1rem" }} />
              <h3 style={{ color: T.textPri, marginBottom: "0.5rem" }}>
                No wallets yet
              </h3>
              <p style={{ color: T.textMut, marginBottom: "1.5rem" }}>
                Add your first cryptocurrency wallet to get started
              </p>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: `linear-gradient(135deg, ${T.primary}, ${T.primary}cc)`,
                  border: "none",
                  borderRadius: 10,
                  padding: "0.6rem 1.2rem",
                  color: isDark ? "#021a14" : "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <Plus size={15} /> Add Your First Wallet
              </button>
            </div>
          )}

          {!isWeb3 && cards.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "3rem",
                ...glassCard(T, { padding: "2rem" }),
              }}
            >
              <CreditCard size={32} style={{ color: T.textMut, margin: "0 auto 1rem" }} />
              <h3 style={{ color: T.textPri, marginBottom: "0.5rem" }}>
                No cards yet
              </h3>
              <p style={{ color: T.textMut, marginBottom: "1.5rem" }}>
                Add your first bank account or credit card to get started
              </p>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: `linear-gradient(135deg, ${T.primary}, ${T.primary}cc)`,
                  border: "none",
                  borderRadius: 10,
                  padding: "0.6rem 1.2rem",
                  color: isDark ? "#021a14" : "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <Plus size={15} /> Add Your First Card
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Encryption Passcode Modal */}
      {showEncryptModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 200,
          }}
          onClick={() => {
            if (!encryptionLoading) {
              setShowEncryptModal(false);
              setShowModal(true);
            }
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 420,
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 20,
              padding: "2rem",
              boxShadow: T.shadow,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.5rem",
              }}
            >
              <h2 style={{ color: T.textPri, fontWeight: 700, fontSize: "1.1rem", display: "flex", alignItems: "center", gap: 8 }}>
                <Lock size={18} style={{ color: T.primary }} />
                Encrypt {isWeb3 ? "Wallet" : "Card"}
              </h2>
              <button
                onClick={() => {
                  if (!encryptionLoading) {
                    setShowEncryptModal(false);
                    setShowModal(true);
                  }
                }}
                disabled={encryptionLoading}
                style={{
                  background: T.btnGhost,
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  padding: 6,
                  cursor: encryptionLoading ? "not-allowed" : "pointer",
                  color: T.textMut,
                  display: "flex",
                  opacity: encryptionLoading ? 0.5 : 1,
                }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ color: T.textMut, fontSize: 13, marginBottom: "1.5rem" }}>
              Create a 6-digit passcode to encrypt your {isWeb3 ? "wallet address" : "card number"}. You&apos;ll need this passcode to view it later.
            </p>

            <div style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: T.textMut,
                    marginBottom: 6,
                  }}
                >
                  Passcode (6 digits)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  inputMode="numeric"
                  value={encryptionPasscode}
                  onChange={(e) => {
                    setEncryptionPasscode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setEncryptionError("");
                  }}
                  placeholder="000000"
                  disabled={encryptionLoading}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: T.inputBg,
                    border: `1px solid ${T.border}`,
                    borderRadius: 10,
                    padding: "0.6rem 0.9rem",
                    fontSize: 20,
                    letterSpacing: "0.4em",
                    color: T.textPri,
                    textAlign: "center",
                    fontFamily: "'DM Mono','Fira Mono',monospace",
                    outline: "none",
                    opacity: encryptionLoading ? 0.5 : 1,
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: T.textMut,
                    marginBottom: 6,
                  }}
                >
                  Confirm Passcode
                </label>
                <input
                  type="password"
                  maxLength={6}
                  inputMode="numeric"
                  value={encryptionPasscodeConfirm}
                  onChange={(e) => {
                    setEncryptionPasscodeConfirm(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setEncryptionError("");
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !encryptionLoading) {
                      handleEncryptionConfirm();
                    }
                  }}
                  placeholder="000000"
                  disabled={encryptionLoading}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: T.inputBg,
                    border: `1px solid ${encryptionError ? T.rose : T.border}`,
                    borderRadius: 10,
                    padding: "0.6rem 0.9rem",
                    fontSize: 20,
                    letterSpacing: "0.4em",
                    color: T.textPri,
                    textAlign: "center",
                    fontFamily: "'DM Mono','Fira Mono',monospace",
                    outline: "none",
                    opacity: encryptionLoading ? 0.5 : 1,
                  }}
                />
              </div>

              {encryptionError && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "0.75rem",
                    background: `${T.rose}15`,
                    border: `1px solid ${T.rose}40`,
                    borderRadius: 8,
                    color: T.rose,
                    fontSize: 13,
                  }}
                >
                  <AlertCircle size={14} />
                  {encryptionError}
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
                paddingTop: "1.5rem",
                borderTop: `1px solid ${T.border}`,
              }}
            >
              <button
                onClick={() => {
                  if (!encryptionLoading) {
                    setShowEncryptModal(false);
                    setShowModal(true);
                  }
                }}
                disabled={encryptionLoading}
                style={{
                  background: T.btnGhost,
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                  padding: "0.6rem 1.2rem",
                  color: T.textSec,
                  fontSize: 14,
                  cursor: encryptionLoading ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  opacity: encryptionLoading ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleEncryptionConfirm}
                disabled={encryptionLoading}
                style={{
                  background: `linear-gradient(135deg, ${T.primary}, ${T.primary}cc)`,
                  border: "none",
                  borderRadius: 10,
                  padding: "0.6rem 1.4rem",
                  color: isDark ? "#021a14" : "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: encryptionLoading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  fontFamily: "inherit",
                  opacity: encryptionLoading ? 0.7 : 1,
                }}
              >
                <Lock size={15} /> {encryptionLoading ? "Encrypting..." : "Encrypt"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decryption Modal */}
      {showDecryptModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 200,
          }}
          onClick={() => !decryptLoading && setShowDecryptModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 420,
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 20,
              padding: "2rem",
              boxShadow: T.shadow,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.5rem",
              }}
            >
              <h2 style={{ color: T.textPri, fontWeight: 700, fontSize: "1.1rem", display: "flex", alignItems: "center", gap: 8 }}>
                <Eye size={18} style={{ color: T.blue }} />
                Decrypt Data
              </h2>
              <button
                onClick={() => !decryptLoading && setShowDecryptModal(false)}
                disabled={decryptLoading}
                style={{
                  background: T.btnGhost,
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  padding: 6,
                  cursor: decryptLoading ? "not-allowed" : "pointer",
                  color: T.textMut,
                  display: "flex",
                  opacity: decryptLoading ? 0.5 : 1,
                }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ color: T.textMut, fontSize: 13, marginBottom: "1.5rem" }}>
              Enter your passcode to view this encrypted {isWeb3 ? "wallet address" : "card number"}.
            </p>

            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: T.textMut,
                  marginBottom: 6,
                }}
              >
                Passcode (6 digits)
              </label>
              <input
                type="password"
                maxLength={6}
                inputMode="numeric"
                value={decryptPasscode}
                onChange={(e) => {
                  setDecryptPasscode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setDecryptError("");
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !decryptLoading) {
                    handleDecryptConfirm();
                  }
                }}
                placeholder="000000"
                disabled={decryptLoading}
                autoFocus
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: T.inputBg,
                  border: `1px solid ${decryptError ? T.rose : T.border}`,
                  borderRadius: 10,
                  padding: "0.6rem 0.9rem",
                  fontSize: 20,
                  letterSpacing: "0.4em",
                  color: T.textPri,
                  textAlign: "center",
                  fontFamily: "'DM Mono','Fira Mono',monospace",
                  outline: "none",
                  opacity: decryptLoading ? 0.5 : 1,
                }}
              />

              {decryptError && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 8,
                    padding: "0.75rem",
                    background: `${T.rose}15`,
                    border: `1px solid ${T.rose}40`,
                    borderRadius: 8,
                    color: T.rose,
                    fontSize: 13,
                  }}
                >
                  <AlertCircle size={14} />
                  {decryptError}
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
                paddingTop: "1.5rem",
                borderTop: `1px solid ${T.border}`,
              }}
            >
              <button
                onClick={() => !decryptLoading && setShowDecryptModal(false)}
                disabled={decryptLoading}
                style={{
                  background: T.btnGhost,
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                  padding: "0.6rem 1.2rem",
                  color: T.textSec,
                  fontSize: 14,
                  cursor: decryptLoading ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  opacity: decryptLoading ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDecryptConfirm}
                disabled={decryptLoading}
                style={{
                  background: `linear-gradient(135deg, ${T.blue}, ${T.blue}cc)`,
                  border: "none",
                  borderRadius: 10,
                  padding: "0.6rem 1.4rem",
                  color: isDark ? "#021a14" : "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: decryptLoading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  fontFamily: "inherit",
                  opacity: decryptLoading ? 0.7 : 1,
                }}
              >
                <Eye size={15} /> {decryptLoading ? "Decrypting..." : "Decrypt"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 220,
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 420,
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 20,
              padding: "2rem",
              boxShadow: T.shadow,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.5rem",
              }}
            >
              <h2 style={{ color: T.textPri, fontWeight: 700, fontSize: "1.1rem" }}>
                Confirm Delete
              </h2>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  background: T.btnGhost,
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  padding: 6,
                  cursor: "pointer",
                  color: T.textMut,
                  display: "flex",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ color: T.textMut, fontSize: 13, marginBottom: "1.5rem" }}>
              Are you sure you want to delete <strong>{deleteTargetName || (deleteTargetType === "wallet" ? "wallet" : "card")}</strong>? This action cannot be undone.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
                paddingTop: "1rem",
                borderTop: `1px solid ${T.border}`,
              }}
            >
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  background: T.btnGhost,
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                  padding: "0.6rem 1.2rem",
                  color: T.textSec,
                  fontSize: 14,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRequest}
                style={{
                  background: `linear-gradient(135deg, ${T.rose}, ${T.rose}cc)`,
                  border: "none",
                  borderRadius: 10,
                  padding: "0.6rem 1.4rem",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  fontFamily: "inherit",
                }}
              >
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Passcode Modal */}
      {showDeletePasscodeModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 230,
          }}
          onClick={() => {
            if (!deleteLoading) {
              setShowDeletePasscodeModal(false);
              setDeletePasscode("");
              setDeleteError("");
            }
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 420,
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 20,
              padding: "2rem",
              boxShadow: T.shadow,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.5rem",
              }}
            >
              <h2 style={{ color: T.textPri, fontWeight: 700, fontSize: "1.1rem", display: "flex", alignItems: "center", gap: 8 }}>
                <Lock size={18} style={{ color: T.rose }} />
                Confirm Passcode
              </h2>
              <button
                onClick={() => {
                  if (!deleteLoading) {
                    setShowDeletePasscodeModal(false);
                    setDeletePasscode("");
                    setDeleteError("");
                  }
                }}
                disabled={deleteLoading}
                style={{
                  background: T.btnGhost,
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  padding: 6,
                  cursor: deleteLoading ? "not-allowed" : "pointer",
                  color: T.textMut,
                  display: "flex",
                  opacity: deleteLoading ? 0.5 : 1,
                }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ color: T.textMut, fontSize: 13, marginBottom: "1.5rem" }}>
              Enter the passcode for <strong>{deleteTargetName || (deleteTargetType === "wallet" ? "wallet" : "card")}</strong> to delete it.
            </p>

            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: T.textMut,
                  marginBottom: 6,
                }}
              >
                Passcode (6 digits)
              </label>
              <input
                type="password"
                maxLength={6}
                inputMode="numeric"
                value={deletePasscode}
                onChange={(e) => {
                  setDeletePasscode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setDeleteError("");
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !deleteLoading) {
                    handleDeletePasscodeConfirm();
                  }
                }}
                placeholder="000000"
                disabled={deleteLoading}
                autoFocus
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: T.inputBg,
                  border: `1px solid ${deleteError ? T.rose : T.border}`,
                  borderRadius: 10,
                  padding: "0.6rem 0.9rem",
                  fontSize: 20,
                  letterSpacing: "0.4em",
                  color: T.textPri,
                  textAlign: "center",
                  fontFamily: "'DM Mono','Fira Mono',monospace",
                  outline: "none",
                  opacity: deleteLoading ? 0.5 : 1,
                }}
              />

              {deleteError && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 8,
                    padding: "0.75rem",
                    background: `${T.rose}15`,
                    border: `1px solid ${T.rose}40`,
                    borderRadius: 8,
                    color: T.rose,
                    fontSize: 13,
                  }}
                >
                  <AlertCircle size={14} />
                  {deleteError}
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
                paddingTop: "1.5rem",
                borderTop: `1px solid ${T.border}`,
              }}
            >
              <button
                onClick={() => {
                  if (!deleteLoading) {
                    setShowDeletePasscodeModal(false);
                    setDeletePasscode("");
                    setDeleteError("");
                  }
                }}
                disabled={deleteLoading}
                style={{
                  background: T.btnGhost,
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                  padding: "0.6rem 1.2rem",
                  color: T.textSec,
                  fontSize: 14,
                  cursor: deleteLoading ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  opacity: deleteLoading ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePasscodeConfirm}
                disabled={deleteLoading}
                style={{
                  background: `linear-gradient(135deg, ${T.rose}, ${T.rose}cc)`,
                  border: "none",
                  borderRadius: 10,
                  padding: "0.6rem 1.4rem",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: deleteLoading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  fontFamily: "inherit",
                  opacity: deleteLoading ? 0.7 : 1,
                }}
              >
                <Lock size={15} /> {deleteLoading ? "Verifying..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Wallet/Card Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 150,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 480,
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 20,
              padding: "2rem",
              boxShadow: T.shadow,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.5rem",
              }}
            >
              <h2 style={{ color: T.textPri, fontWeight: 700, fontSize: "1.1rem" }}>
                {isWeb3 ? "Add Wallet" : "Add Card"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: T.btnGhost,
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  padding: 6,
                  cursor: "pointer",
                  color: T.textMut,
                  display: "flex",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
              {isWeb3 ? (
                <>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: T.textMut,
                        marginBottom: 6,
                      }}
                    >
                      Wallet Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g. My Trading Wallet"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        background: T.inputBg,
                        border: `1px solid ${T.border}`,
                        borderRadius: 10,
                        padding: "0.6rem 0.9rem",
                        color: T.textPri,
                        fontSize: 14,
                        outline: "none",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: T.textMut,
                        marginBottom: 6,
                      }}
                    >
                      Wallet Address
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      placeholder="0x..."
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        background: T.inputBg,
                        border: `1px solid ${T.border}`,
                        borderRadius: 10,
                        padding: "0.6rem 0.9rem",
                        color: T.textPri,
                        fontSize: 14,
                        outline: "none",
                        fontFamily: "'DM Mono','Fira Mono',monospace",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: T.textMut,
                        marginBottom: 6,
                      }}
                    >
                      Network
                    </label>
                    <select
                      value={formData.network}
                      onChange={(e) =>
                        setFormData({ ...formData, network: e.target.value })
                      }
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        background: T.selectBg || T.inputBg,
                        border: `1px solid ${T.border}`,
                        borderRadius: 10,
                        padding: "0.6rem 0.9rem",
                        color: T.textPri,
                        fontSize: 14,
                        outline: "none",
                        fontFamily: "inherit",
                      }}
                    >
                      {NETWORKS.map((net) => (
                        <option key={net.name} value={net.name}>
                          {net.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: T.textMut,
                        marginBottom: 6,
                      }}
                    >
                      Card Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g. Primary Checking"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        background: T.inputBg,
                        border: `1px solid ${T.border}`,
                        borderRadius: 10,
                        padding: "0.6rem 0.9rem",
                        color: T.textPri,
                        fontSize: 14,
                        outline: "none",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: T.textMut,
                        marginBottom: 6,
                      }}
                    >
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={formData.bank}
                      onChange={(e) =>
                        setFormData({ ...formData, bank: e.target.value })
                      }
                      placeholder="e.g. Chase Bank"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        background: T.inputBg,
                        border: `1px solid ${T.border}`,
                        borderRadius: 10,
                        padding: "0.6rem 0.9rem",
                        color: T.textPri,
                        fontSize: 14,
                        outline: "none",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: T.textMut,
                        marginBottom: 6,
                      }}
                    >
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={formData.number}
                      onChange={(e) =>
                        setFormData({ ...formData, number: e.target.value })
                      }
                      placeholder="****1234"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        background: T.inputBg,
                        border: `1px solid ${T.border}`,
                        borderRadius: 10,
                        padding: "0.6rem 0.9rem",
                        color: T.textPri,
                        fontSize: 14,
                        outline: "none",
                        fontFamily: "'DM Mono','Fira Mono',monospace",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: T.textMut,
                        marginBottom: 6,
                      }}
                    >
                      Card Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value as "debit" | "credit" })
                      }
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        background: T.selectBg || T.inputBg,
                        border: `1px solid ${T.border}`,
                        borderRadius: 10,
                        padding: "0.6rem 0.9rem",
                        color: T.textPri,
                        fontSize: 14,
                        outline: "none",
                        fontFamily: "inherit",
                      }}
                    >
                      <option value="debit">Debit</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>

                  {formData.type === "credit" && (
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          color: T.textMut,
                          marginBottom: 6,
                        }}
                      >
                        Credit Limit (optional)
                      </label>
                      <input
                        type="number"
                        value={formData.limit}
                        onChange={(e) =>
                          setFormData({ ...formData, limit: e.target.value })
                        }
                        placeholder="15000"
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          background: T.inputBg,
                          border: `1px solid ${T.border}`,
                          borderRadius: 10,
                          padding: "0.6rem 0.9rem",
                          color: T.textPri,
                          fontSize: 14,
                          outline: "none",
                          fontFamily: "inherit",
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
                paddingTop: "1.5rem",
                borderTop: `1px solid ${T.border}`,
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: T.btnGhost,
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                  padding: "0.6rem 1.2rem",
                  color: T.textSec,
                  fontSize: 14,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              <button
                onClick={isWeb3 ? handleAddWallet : handleAddCard}
                style={{
                  background: `linear-gradient(135deg, ${T.primary}, ${T.primary}cc)`,
                  border: "none",
                  borderRadius: 10,
                  padding: "0.6rem 1.4rem",
                  color: isDark ? "#021a14" : "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  fontFamily: "inherit",
                }}
              >
                <CheckCircle size={15} /> {isWeb3 ? "Add Wallet" : "Add Card"}
              </button>
            </div>
          </div>
        </div>
      )}

      <FloatingToolsWindow isDark={isDark} />
      </MasterPasscodeGuard>
    </>
  );
}

export default CardsPage;
