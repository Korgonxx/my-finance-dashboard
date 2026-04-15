"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type AppMode = "web2" | "web3";

interface WalletAddress {
  id: string;
  name: string;
  address: string;
  balance: number;
  network: string;
}

interface Web3ContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  isWeb3: boolean;
  wallets: WalletAddress[];
  setWallets: (wallets: WalletAddress[]) => void;
  addWallet: (wallet: Omit<WalletAddress, "id">) => void;
  updateWallet: (id: string, wallet: Partial<WalletAddress>) => void;
  deleteWallet: (id: string) => void;
}

const Web3Context = createContext<Web3ContextType>({
  mode: "web2",
  setMode: () => {},
  isWeb3: false,
  wallets: [],
  setWallets: () => {},
  addWallet: () => {},
  updateWallet: () => {},
  deleteWallet: () => {},
});

const SEED_WALLETS: WalletAddress[] = [
  { id: "w1", name: "Main Wallet",    address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", balance: 12450.80, network: "Ethereum" },
  { id: "w2", name: "DeFi Wallet",   address: "0x3A76Bff1aA3c56E9f0E96c8B23B3a61B3f0c21D", balance: 5230.50, network: "Polygon"  },
  { id: "w3", name: "Trading Wallet",address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", balance: 8900.00, network: "Arbitrum" },
];

const uid = () => Math.random().toString(36).slice(2, 9);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode>(() => {
    try {
      const m = localStorage.getItem("app_mode") as AppMode | null;
      return (m === "web2" || m === "web3") ? m : "web2";
    } catch {
      return "web2";
    }
  });
  const [wallets, setWalletsState] = useState<WalletAddress[]>(() => {
    try {
      const raw = localStorage.getItem("wallet_addresses");
      return raw ? JSON.parse(raw) : SEED_WALLETS;
    } catch {
      return SEED_WALLETS;
    }
  });
  const [isHydrated, setIsHydrated] = useState(false);

  /* ── hydration protection ── */
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  /* ── persist wallets ── */
  useEffect(() => {
    if (wallets.length === 0) return;
    try { localStorage.setItem("wallet_addresses", JSON.stringify(wallets)); } catch {}
  }, [wallets]);

  const setMode = (m: AppMode) => {
    setModeState(m);
    try { localStorage.setItem("app_mode", m); } catch {}
  };

  const setWallets = (w: WalletAddress[]) => setWalletsState(w);

  const addWallet = (w: Omit<WalletAddress, "id">) =>
    setWalletsState(prev => [...prev, { ...w, id: uid() }]);

  const updateWallet = (id: string, patch: Partial<WalletAddress>) =>
    setWalletsState(prev => prev.map(w => w.id === id ? { ...w, ...patch } : w));

  const deleteWallet = (id: string) =>
    setWalletsState(prev => prev.filter(w => w.id !== id));

  // Stabilize isWeb3 after hydration to prevent jitter during navigation
  const stableIsWeb3 = isHydrated ? mode === "web3" : false;

  return (
    <Web3Context.Provider value={{ mode, setMode, isWeb3: stableIsWeb3, wallets, setWallets, addWallet, updateWallet, deleteWallet }}>
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => useContext(Web3Context);
export type { WalletAddress };
