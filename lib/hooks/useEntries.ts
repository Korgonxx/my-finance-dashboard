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
};

// Global cache to prevent refetch on navigation
const entriesCache = new Map<string, { data: Entry[], timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useEntries(isWeb3: boolean) {
  const [web2Entries, setWeb2Entries] = useState<Entry[]>([]);
  const [web3Entries, setWeb3Entries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const syncedIds = useRef<Set<string>>(new Set());
  const loadedRef = useRef(false);

  useEffect(() => {
    async function load() {
      // Prevent double-load on initial mount
      if (loadedRef.current) return;
      loadedRef.current = true;

      try {
        // Check cache first
        const w2Cache = entriesCache.get("web2");
        const w3Cache = entriesCache.get("web3");
        const now = Date.now();
        
        const w2 = (w2Cache && now - w2Cache.timestamp < CACHE_TTL) 
          ? w2Cache.data 
          : await fetch("/api/entries?mode=web2").then(r => r.json());
        const w3 = (w3Cache && now - w3Cache.timestamp < CACHE_TTL) 
          ? w3Cache.data 
          : await fetch("/api/entries?mode=web3").then(r => r.json());

        // Update cache
        entriesCache.set("web2", { data: w2, timestamp: Date.now() });
        entriesCache.set("web3", { data: w3, timestamp: Date.now() });

        if (w2.length === 0 && w3.length === 0) {
          await migrateFromLocalStorage(syncedIds.current);
          const [r2, r3]: [Entry[], Entry[]] = await Promise.all([
            fetch("/api/entries?mode=web2").then(r => r.json()),
            fetch("/api/entries?mode=web3").then(r => r.json()),
          ]);
          r2.forEach((e: Entry) => syncedIds.current.add(e.id));
          r3.forEach((e: Entry) => syncedIds.current.add(e.id));
          entriesCache.set("web2", { data: r2, timestamp: Date.now() });
          entriesCache.set("web3", { data: r3, timestamp: Date.now() });
          setWeb2Entries(r2);
          setWeb3Entries(r3);
        } else {
          w2.forEach((e: Entry) => syncedIds.current.add(e.id));
          w3.forEach((e: Entry) => syncedIds.current.add(e.id));
          setWeb2Entries(w2);
          setWeb3Entries(w3);
        }
      } catch (err) {
        console.error("[useEntries] load failed, falling back to localStorage", err);
        try {
          const w2 = localStorage.getItem("fd_web2_entries");
          const w3 = localStorage.getItem("fd_web3_entries");
          if (w2) setWeb2Entries(JSON.parse(w2));
          if (w3) setWeb3Entries(JSON.parse(w3));
        } catch {}
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, []);

  const save = useCallback((entry: Entry) => {
    const modeKey: Entry["mode"] = isWeb3 ? "web3" : "web2";
    const fullEntry = { ...entry, mode: modeKey };
    const setter = isWeb3 ? setWeb3Entries : setWeb2Entries;

    setter(prev => {
      const exists = prev.some(e => e.id === entry.id);
      return exists
        ? prev.map(e => e.id === entry.id ? fullEntry : e)
        : [...prev, fullEntry];
    });

    const isNew = !syncedIds.current.has(entry.id);
    if (isNew) {
      syncedIds.current.add(entry.id);
      fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullEntry),
      }).catch(err => console.error("[useEntries] POST failed", err));
    } else {
      fetch(`/api/entries/${entry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullEntry),
      }).catch(err => console.error("[useEntries] PUT failed", err));
    }
  }, [isWeb3]);

  const remove = useCallback((id: string) => {
    setWeb2Entries(prev => prev.filter(e => e.id !== id));
    setWeb3Entries(prev => prev.filter(e => e.id !== id));
    fetch(`/api/entries/${id}`, { method: "DELETE" })
      .catch(err => console.error("[useEntries] DELETE failed", err));
    syncedIds.current.delete(id);
  }, []);

  return { web2Entries, web3Entries, setWeb2Entries, setWeb3Entries, loaded, save, remove };
}

// Global cache for goals
const goalCache = new Map<string, { amount: number, timestamp: number }>();

export function useGoal(mode: "web2" | "web3") {
  const [goal, setGoalState] = useState(60000);
  const loadedRef = useRef(false);

  useEffect(() => {
    async function load() {
      // Prevent double-load on initial mount
      if (loadedRef.current) return;
      loadedRef.current = true;

      try {
        const cached = goalCache.get(mode);
        const now = Date.now();
        
        if (cached && now - cached.timestamp < CACHE_TTL) {
          setGoalState(cached.amount);
          return;
        }

        const r = await fetch(`/api/goal?mode=${mode}`);
        const data = await r.json();
        if (data.amount) {
          setGoalState(data.amount);
          goalCache.set(mode, { amount: data.amount, timestamp: Date.now() });
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

  const setGoal = useCallback((amount: number, currency = "USD") => {
    setGoalState(amount);
    // Update cache immediately
    goalCache.set(mode, { amount, timestamp: Date.now() });
    
    fetch("/api/goal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, amount, currency }),
    }).catch(err => console.error("[useGoal] POST failed", err));
  }, [mode]);

  return { goal, setGoal };
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
