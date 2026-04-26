"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export type Entry = {
  id: string;
  date: string;
  project: string;
  earned: number;
  saved: number;
  given: number;
  givenTo: string;
  walletAddress?: string;
  walletName?: string;
  mode: "web2" | "web3";
  investmentAmount?: number;
  currentValue?: number;
  createdAt?: string;
};

// Global cache to prevent refetch on navigation
const entriesCache = new Map<string, { data: Entry[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// FIX: Clear cache on hot reload in dev to prevent stale data
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as any).__clearEntriesCache = () => entriesCache.clear();
}

export function useEntries(isWeb3: boolean) {
  const [web2Entries, setWeb2Entries] = useState<Entry[]>([]);
  const [web3Entries, setWeb3Entries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const syncedIds = useRef<Set<string>>(new Set());
  // FIX: Track loaded state per mode so switching modes triggers a fresh fetch
  const loadedModes = useRef<Set<string>>(new Set());

  // FIX: Effect now depends on `isWeb3` so it re-runs when mode changes
  useEffect(() => {
    const modeKey = isWeb3 ? "web3" : "web2";

    async function load() {
      // Only skip if this specific mode was already loaded from API recently
      if (loadedModes.current.has(modeKey)) {
        const cached = entriesCache.get(modeKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          // Already loaded and cached — just update state
          if (modeKey === "web2") setWeb2Entries(cached.data);
          else setWeb3Entries(cached.data);
          setLoaded(true);
          return;
        }
      }

      try {
        const apiMode = isWeb3 ? "crypto" : "banks";
        const res = await fetch(`/api/entries?mode=${apiMode}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Entry[] = await res.json();

        // Update cache
        entriesCache.set(modeKey, { data, timestamp: Date.now() });
        loadedModes.current.add(modeKey);
        data.forEach((e) => syncedIds.current.add(e.id));

        if (modeKey === "web2") {
          setWeb2Entries(data);
          try { localStorage.setItem("fd_web2_entries", JSON.stringify(data)); } catch {}
        } else {
          setWeb3Entries(data);
          try { localStorage.setItem("fd_web3_entries", JSON.stringify(data)); } catch {}
        }

        // If both modes have been loaded at least once, load the other from cache
        const otherKey = isWeb3 ? "web2" : "web3";
        const otherCached = entriesCache.get(otherKey);
        if (otherCached) {
          if (otherKey === "web2") setWeb2Entries(otherCached.data);
          else setWeb3Entries(otherCached.data);
        } else {
          // Load other mode from localStorage as fallback
          try {
            const stored = localStorage.getItem(`fd_${otherKey}_entries`);
            if (stored) {
              const parsed = JSON.parse(stored);
              if (otherKey === "web2") setWeb2Entries(parsed);
              else setWeb3Entries(parsed);
            }
          } catch {}
        }
      } catch (err) {
        console.error("[useEntries] load failed, falling back to localStorage", err);
        try {
          const stored = localStorage.getItem(`fd_${modeKey}_entries`);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (modeKey === "web2") setWeb2Entries(parsed);
            else setWeb3Entries(parsed);
          }
        } catch {}
      } finally {
        setLoaded(true);
      }
    }

    load();
  }, [isWeb3]); // FIX: isWeb3 dependency ensures refetch on mode switch

  const save = useCallback((entry: Entry) => {
    const modeKey: Entry["mode"] = isWeb3 ? "web3" : "web2";
    const fullEntry = { ...entry, mode: modeKey };
    const setter = isWeb3 ? setWeb3Entries : setWeb2Entries;

    setter(prev => {
      const exists = prev.some(e => e.id === entry.id);
      const updated = exists
        ? prev.map(e => e.id === entry.id ? fullEntry : e)
        : [...prev, fullEntry];

      // Invalidate cache so next navigation re-fetches
      entriesCache.delete(modeKey);
      try { localStorage.setItem(`fd_${modeKey}_entries`, JSON.stringify(updated)); } catch {}
      return updated;
    });

    const isNew = !syncedIds.current.has(entry.id);
    const apiPromise = isNew
      ? fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...fullEntry, mode: isWeb3 ? "crypto" : "banks" }),
        })
      : fetch(`/api/entries/${entry.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...fullEntry, mode: isWeb3 ? "crypto" : "banks" }),
        });

    apiPromise
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        if (isNew) syncedIds.current.add(entry.id);
      })
      .catch(err => {
        console.error(`[useEntries] ${isNew ? "POST" : "PUT"} failed`, err);
      });
  }, [isWeb3]);

  const remove = useCallback((id: string) => {
    setWeb2Entries(prev => prev.filter(e => e.id !== id));
    setWeb3Entries(prev => prev.filter(e => e.id !== id));

    // Invalidate caches
    entriesCache.delete("web2");
    entriesCache.delete("web3");

    try {
      const w2 = JSON.parse(localStorage.getItem("fd_web2_entries") || "[]");
      const w3 = JSON.parse(localStorage.getItem("fd_web3_entries") || "[]");
      localStorage.setItem("fd_web2_entries", JSON.stringify(w2.filter((e: any) => e.id !== id)));
      localStorage.setItem("fd_web3_entries", JSON.stringify(w3.filter((e: any) => e.id !== id)));
    } catch {}

    fetch(`/api/entries/${id}`, { method: "DELETE" })
      .catch(err => console.error("[useEntries] DELETE failed", err));
    syncedIds.current.delete(id);
  }, []);

  return { web2Entries, web3Entries, setWeb2Entries, setWeb3Entries, loaded, save, remove };
}

// Global cache for goals
const goalCache = new Map<string, { amount: number; currency: string; timestamp: number }>();

export function useGoal(mode: "web2" | "web3") {
  const [goal, setGoalState] = useState(mode === "web3" ? 100000 : 5000);
  const [currency, setCurrencyState] = useState("USD");
  const loadedRef = useRef(false);

  useEffect(() => {
    // FIX: Reset loadedRef when mode changes so goal re-fetches
    loadedRef.current = false;
  }, [mode]);

  useEffect(() => {
    async function load() {
      if (loadedRef.current) return;
      loadedRef.current = true;

      try {
        const cached = goalCache.get(mode);
        const now = Date.now();

        if (cached && now - cached.timestamp < CACHE_TTL) {
          setGoalState(cached.amount);
          setCurrencyState(cached.currency);
          return;
        }

        const apiMode = mode === "web3" ? "crypto" : "banks";
        const r = await fetch(`/api/goal?mode=${apiMode}`);
        const data = await r.json();
        if (data.amount) {
          setGoalState(data.amount);
          setCurrencyState(data.currency || "USD");
          goalCache.set(mode, { amount: data.amount, currency: data.currency || "USD", timestamp: Date.now() });
        }
      } catch (err) {
        console.error("[useGoal] load failed", err);
        try {
          const saved = localStorage.getItem("fd_goal");
          if (saved) setGoalState(parseFloat(saved));
        } catch {}
      }
    }
    load();
  }, [mode]);

  const setGoal = useCallback((amount: number, curr = "USD") => {
    setGoalState(amount);
    setCurrencyState(curr);
    // Invalidate cache
    goalCache.delete(mode);

    const apiMode = mode === "web3" ? "crypto" : "banks";
    fetch("/api/goal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: apiMode, amount, currency: curr }),
    }).catch(err => console.error("[useGoal] POST failed", err));
  }, [mode]);

  return { goal, currency, setGoal };
}

async function migrateFromLocalStorage(syncedIds: Set<string>) {
  try {
    const w2Raw = localStorage.getItem("fd_web2_entries");
    const w3Raw = localStorage.getItem("fd_web3_entries");
    const legacyRaw = localStorage.getItem("fd_entries");

    let all: Entry[] = [];
    if (w2Raw || w3Raw) {
      all = [...(w2Raw ? JSON.parse(w2Raw) : []), ...(w3Raw ? JSON.parse(w3Raw) : [])];
    } else if (legacyRaw) {
      all = JSON.parse(legacyRaw);
    }
    if (all.length === 0) return;

    console.log(`[migration] Migrating ${all.length} entries…`);
    await Promise.all(
      all.map(entry =>
        fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry),
        }).then(() => syncedIds.add(entry.id))
      )
    );
    console.log("[migration] ✅ Done");
  } catch (err) {
    console.error("[migration] failed", err);
  }
}