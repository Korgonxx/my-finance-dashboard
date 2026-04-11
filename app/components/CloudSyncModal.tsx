"use client";

import { useEffect, useState } from "react";
import { Copy, Zap, X } from "lucide-react";

interface CloudSyncModalProps {
  cloudSyncId: string;
  onClose: () => void;
  onGenerateId: () => string;
  onSave: (id: string) => Promise<void> | void;
  onLoad: (id: string) => Promise<void> | void;
  loading: boolean;
  message: string | null;
  autoSyncEnabled: boolean;
  setAutoSyncEnabled: (enabled: boolean) => void;
  T: Record<string, string> & { inputBg: string; btnGhost: string; primary: string; violet: string; textMut: string; textPri: string; border: string; };
}

export function CloudSyncModal({ cloudSyncId, onClose, onGenerateId, onSave, onLoad, loading, message, autoSyncEnabled, setAutoSyncEnabled, T }: CloudSyncModalProps) {
  const [draftId, setDraftId] = useState(cloudSyncId || "");
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    setDraftId(cloudSyncId || "");
  }, [cloudSyncId]);

  const handleGenerate = () => {
    const next = onGenerateId();
    setDraftId(next);
  };

  const handleCopy = async () => {
    if (!draftId) return;
    try {
      await navigator.clipboard.writeText(draftId);
      setCopySuccess(true);
      window.setTimeout(() => setCopySuccess(false), 2000);
    } catch {}
  };

  return (
    <div style={{ position: "relative" }}>
      <button onClick={onClose} style={{ position: "absolute", right:0, top:0, border:"none", background:"transparent", color:T.textMut, cursor:"pointer" }}>
        <X size={18} />
      </button>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:"1.5rem" }}>
        <Zap size={22} style={{ color:T.primary }} />
        <div>
          <h2 style={{ margin:0, color:T.textPri, fontSize:"1.05rem", fontWeight:700 }}>Cloud Sync</h2>
          <p style={{ margin:"4px 0 0", color:T.textMut, fontSize:13 }}>Sync your dashboard across devices using a shared Firestore ID.</p>
        </div>
      </div>

      <div style={{ display:"grid", gap:14 }}>
        <div style={{ display:"grid", gap:8 }}>
          <label style={{ fontSize:12, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:T.textMut }}>Sync ID</label>
          <input value={draftId} onChange={e => setDraftId(e.target.value)}
            placeholder="Enter or generate a sync ID"
            style={{ width:"100%", border:`1px solid ${T.border}`, borderRadius:12, padding:"0.85rem 1rem", background:T.inputBg, color:T.textPri, fontSize:14, outline:"none", fontFamily:"inherit" }} />
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <button onClick={handleGenerate} type="button"
              style={{ flexGrow:1, background:`linear-gradient(135deg, ${T.primary}, ${T.primary}cc)`, border:"none", borderRadius:10, padding:"0.85rem", color:"#021a14", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              Generate ID
            </button>
            <button onClick={handleCopy} type="button"
              disabled={!draftId}
              style={{ flexGrow:1, background:T.btnGhost, border:`1px solid ${T.border}`, borderRadius:10, padding:"0.85rem", color:T.textPri, cursor:draftId?"pointer":"not-allowed", opacity:draftId?1:0.5, fontFamily:"inherit" }}>
              <Copy size={14} /> Copy ID
            </button>
          </div>
          {copySuccess && <div style={{ color:T.primary, fontSize:12 }}>ID copied to clipboard.</div>}
        </div>

        <div style={{ display:"grid", gap:8 }}>
          <label style={{ fontSize:12, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:T.textMut }}>Auto Sync</label>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"0.75rem 1rem",
                background: autoSyncEnabled ? `${T.primary}18` : T.btnGhost,
                border: `1px solid ${autoSyncEnabled ? T.primary+"44" : T.border}`,
                borderRadius:10, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s" }}>
              <div style={{ width:16, height:16, borderRadius:"50%", background: autoSyncEnabled ? T.primary : "transparent",
                border: `2px solid ${autoSyncEnabled ? T.primary : T.textMut}`, transition:"all 0.2s" }} />
              <span style={{ fontSize:13, color: autoSyncEnabled ? T.primary : T.textPri, fontWeight:600 }}>
                {autoSyncEnabled ? "Enabled" : "Disabled"}
              </span>
            </button>
            <div style={{ fontSize:12, color:T.textMut, flex:1 }}>
              Auto-save and sync every 1 minute when sync ID is set
            </div>
          </div>
        </div>

        <div style={{ background:`${T.violet}0d`, border:`1px solid ${T.violet}30`, borderRadius:14, padding:"1rem", color:T.textPri, fontSize:13 }}>
          <strong>How it works:</strong>
          <p style={{ margin:"0.5rem 0 0", color:T.textMut, lineHeight:1.6 }}>
            Save your current dashboard under a shared ID, then open the same ID on another device to load the same data. With auto-sync enabled, changes sync automatically every minute.
          </p>
        </div>

        {(loading || message) && (
          <div style={{ background: loading ? "rgba(56,189,248,0.12)" : "rgba(16,185,129,0.12)",
            border:`1px solid ${loading ? "rgba(56,189,248,0.35)" : T.primary}`,
            borderRadius:10, padding:"0.85rem 1rem", color: loading ? "#0ea5e9" : T.primary, fontWeight:700, fontSize:13 }}>
            {loading ? "Syncing..." : message}
          </div>
        )}

        <div style={{ display:"grid", gap:10 }}>
          <button onClick={() => onSave(draftId)} disabled={loading || !draftId}
            style={{ background:`linear-gradient(135deg, ${T.primary}, ${T.primary}cc)`, border:"none", borderRadius:10, padding:"0.95rem", color:"#021a14", fontWeight:700, cursor:loading||!draftId?"not-allowed":"pointer", opacity:loading||!draftId?0.55:1, fontFamily:"inherit" }}>
            {loading ? "Syncing…" : "Save to Cloud"}
          </button>
          <button onClick={() => onLoad(draftId)} disabled={loading || !draftId}
            style={{ background:T.btnGhost, border:`1px solid ${T.border}`, borderRadius:10, padding:"0.95rem", color:T.textPri, cursor:loading||!draftId?"not-allowed":"pointer", opacity:loading||!draftId?0.55:1, fontWeight:700, fontFamily:"inherit" }}>
            {loading ? "Syncing…" : "Load from Cloud"}
          </button>
        </div>
      </div>
    </div>
  );
}
