"use client";
import { useState, useEffect, useCallback } from "react";

export interface Wallet {
  id: string;
  name: string;
  address: string;
  network: string;
  balance: number;
  createdAt: string;
  isEncrypted?: boolean;
  encryptedData?: { address: string; iv: string; salt: string };
  passcode?: string;
}

export function useWallets() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const r = await fetch("/api/wallets", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      if (Array.isArray(data)) setWallets(data);
    } catch (e: any) {
      console.error("[useWallets] reload failed", e);
      setError(e?.message ?? "Failed to load wallets");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => { reload(); }, [reload]);

  const addWallet = useCallback(async (w: {
    name: string;
    address: string;
    network: string;
    balance?: number;
    isEncrypted?: boolean;
    encryptedData?: any;
  }) => {
    try {
      const r = await fetch("/api/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...w, balance: w.balance ?? 0 }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const created = await r.json();
      // Add to local state immediately (optimistic)
      setWallets(prev => [...prev, created]);
      return created;
    } catch (e) {
      console.error("[useWallets] addWallet failed", e);
      return null;
    }
  }, []);

  const updateWallet = useCallback(async (id: string, updates: Partial<Wallet>) => {
    // Optimistic update
    setWallets(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
    try {
      const r = await fetch(`/api/wallets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const updated = await r.json();
      setWallets(prev => prev.map(w => w.id === id ? updated : w));
      return updated;
    } catch (e) {
      console.error("[useWallets] updateWallet failed", e);
      // Revert on failure
      reload();
      return null;
    }
  }, [reload]);

  const removeWallet = useCallback(async (id: string) => {
    // Optimistic removal
    setWallets(prev => prev.filter(w => w.id !== id));
    try {
      const r = await fetch(`/api/wallets/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
    } catch (e) {
      console.error("[useWallets] removeWallet failed", e);
      // Restore on failure
      reload();
    }
  }, [reload]);

  return { wallets, setWallets, loading, error, reload, addWallet, updateWallet, removeWallet };
}