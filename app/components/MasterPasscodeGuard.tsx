"use client";
import { useState, useEffect, useRef } from "react";
import { useAppSettings } from "../context/AppSettingsContext";

export function MasterPasscodeGuard({ isDark, children }: { isDark: boolean; children: React.ReactNode }) {
  const { appPasscodeVerified, verifyAppPasscode } = useAppSettings();

  const [mounted, setMounted] = useState(false);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setMounted(true);
    if (!appPasscodeVerified) {
      setTimeout(() => inputRefs.current[0]?.focus(), 400);
    }
  }, [appPasscodeVerified]);

  const showOverlay = mounted && !appPasscodeVerified;

  if (!showOverlay) {
    return <>{children}</>;
  }

  // FIX: handleDigit now calls async verifyAppPasscode (server-side bcrypt)
  const handleDigit = async (val: string, idx: number) => {
    if (!/^\d?$/.test(val) || loading) return;
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    setError(false);

    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();

    if (next.every((d) => d !== "") && val) {
      setLoading(true);
      const ok = await verifyAppPasscode(next.join(""));
      setLoading(false);
      if (!ok) {
        setShake(true);
        setError(true);
        setTimeout(() => {
          setShake(false);
          setDigits(["", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
        }, 650);
      }
    }
  };

  const handleKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const filled = digits.filter((d) => d !== "").length;

  return (
    <>
      {children}

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "#050505",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Outfit','Segoe UI',sans-serif",
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Outfit:wght@400;600;700;800;900&display=swap');
          @keyframes shake{0%,100%{transform:translateX(0)}15%{transform:translateX(-12px)}35%{transform:translateX(12px)}55%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
          @keyframes floatUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:none}}
          .passcode-digit{width:52px;height:60px;border-radius:16px;background:rgba(255,255,255,0.04);border:2px solid rgba(255,255,255,0.08);color:#fff;font-size:24px;font-weight:700;text-align:center;outline:none;caret-color:transparent;font-family:'DM Mono',monospace;transition:all 0.15s;}
          .passcode-digit:focus{border-color:#f5ff5e;background:rgba(245,255,94,0.05);box-shadow:0 0 0 4px rgba(245,255,94,0.1);}
          .passcode-digit.filled{border-color:rgba(255,255,255,0.18);background:rgba(255,255,255,0.07);}
          .passcode-digit.error{border-color:#ff3d6b!important;background:rgba(255,61,107,0.06)!important;box-shadow:0 0 0 4px rgba(255,61,107,0.12)!important;}
          .passcode-digit:disabled{opacity:0.5;cursor:not-allowed;}
        `}</style>

        <div
          style={{
            position: "absolute",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(245,255,94,0.04) 0%, transparent 65%)",
            top: "30%",
            left: "40%",
            transform: "translate(-50%,-50%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 36,
            animation: "floatUp 0.5s ease",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: 20,
                background: "linear-gradient(135deg, #f5ff5e, #f5ff5ebb)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 900,
                color: "#000",
                boxShadow: "0 8px 32px rgba(245,255,94,0.25)",
              }}
            >
              K
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>
                Korgon Finance
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.28)", marginTop: 5 }}>
                Enter your passcode to continue
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              animation: shake ? "shake 0.6s ease" : "none",
            }}
          >
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={d}
                disabled={loading}
                onChange={(e) => handleDigit(e.target.value, i)}
                onKeyDown={(e) => handleKey(e, i)}
                className={`passcode-digit${d ? " filled" : ""}${error ? " error" : ""}`}
              />
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {digits.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i < filled ? 20 : 6,
                  height: 6,
                  borderRadius: 99,
                  transition: "all 0.2s ease",
                  background: i < filled ? "#f5ff5e" : "rgba(255,255,255,0.12)",
                }}
              />
            ))}
          </div>

          {loading && (
            <div
              style={{
                padding: "8px 20px",
                borderRadius: 99,
                background: "rgba(245,255,94,0.1)",
                border: "1px solid rgba(245,255,94,0.2)",
                fontSize: 13,
                color: "#f5ff5e",
                fontWeight: 700,
              }}
            >
              Verifying...
            </div>
          )}

          {error && !loading && (
            <div
              style={{
                padding: "8px 20px",
                borderRadius: 99,
                background: "rgba(255,61,107,0.1)",
                border: "1px solid rgba(255,61,107,0.2)",
                fontSize: 13,
                color: "#ff3d6b",
                fontWeight: 700,
              }}
            >
              ✕ Incorrect passcode
            </div>
          )}
          {!error && !loading && filled === 0 && (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.18)" }}>Default: 123456</div>
          )}
        </div>
      </div>
    </>
  );
}