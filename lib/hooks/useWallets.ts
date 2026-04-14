// lib/hooks/useWallets.ts  ← put this in lib/hooks/ alongside useEntries.ts
// Shared wallet hook — always fetches fresh from DB, no stale localStorage.
"use client";
import { useState, useEffect, useCallback } from "react";

export interface Wallet {
  id: string; name: string; address: string;
  network: string; balance: number; createdAt: string;
  isEncrypted?: boolean;
  encryptedData?: { address: string; iv: string; salt: string };
  passcode?: string;
}

export function useWallets() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const r = await fetch("/api/wallets", { cache: "no-store" });
      if (!r.ok) throw new Error("fetch failed");
      const data = await r.json();
      if (Array.isArray(data)) setWallets(data);
    } catch (e) {
      console.error("[useWallets] reload failed", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => { reload(); }, [reload]);

  const addWallet = useCallback(async (w: {
    name: string; address: string; network: string; balance?: number;
  }) => {
    try {
      const r = await fetch("/api/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...w, balance: w.balance ?? 0 }),
      });
      const created = await r.json();
      // Add to local state immediately (optimistic)
      setWallets(prev => [...prev, created]);
      return created;
    } catch (e) {
      console.error("[useWallets] addWallet failed", e);
      return null;
    }
  }, []);

  const removeWallet = useCallback(async (id: string) => {
    // Optimistic removal
    setWallets(prev => prev.filter(w => w.id !== id));
    try {
      await fetch(`/api/wallets/${id}`, { method: "DELETE" });
    } catch {
      // Restore on failure
      reload();
    }
  }, [reload]);

  return { wallets, setWallets, loading, reload, addWallet, removeWallet };
}