"use client";

import { useState, useEffect } from "react";
import { Shield, AlertCircle, Lock } from "lucide-react";
import { useAppSettings } from "../context/AppSettingsContext";

const DARK = {
  bg: "#06080f",
  card: "rgba(255,255,255,0.032)",
  border: "rgba(255,255,255,0.075)",
  primary: "#00c9a7",
  rose: "#f43f5e",
  textPri: "#f0f4ff",
  textMut: "rgba(240,244,255,0.28)",
  shadow: "0 32px 80px rgba(0,0,0,0.8)",
  btnGhost: "rgba(255,255,255,0.05)",
  inputBg: "rgba(255,255,255,0.04)",
};

const LIGHT = {
  bg: "#f0f4f8",
  card: "rgba(255,255,255,0.85)",
  border: "rgba(0,0,0,0.08)",
  primary: "#009d82",
  rose: "#e11d48",
  textPri: "#0d1117",
  textMut: "rgba(13,17,23,0.38)",
  shadow: "0 32px 80px rgba(0,0,0,0.12)",
  btnGhost: "rgba(0,0,0,0.04)",
  inputBg: "rgba(0,0,0,0.04)",
};

interface MasterPasscodeGuardProps {
  isDark: boolean;
  children: React.ReactNode;
}

export function MasterPasscodeGuard({ isDark, children }: MasterPasscodeGuardProps) {
  const { appPasscodeVerified, verifyAppPasscode } = useAppSettings();
  const [passcodeInput, setPasscodeInput] = useState("");
  const [error, setError] = useState("");
  const [isAttempting, setIsAttempting] = useState(false);

  const T = isDark ? DARK : LIGHT;

  useEffect(() => {
    try {
      document.body.style.overflow = appPasscodeVerified ? "" : "hidden";
    } catch {}
    return () => {
      try {
        document.body.style.overflow = "";
      } catch {}
    };
  }, [appPasscodeVerified]);

  const handleVerify = () => {
    setIsAttempting(true);
    const success = verifyAppPasscode(passcodeInput);
    if (!success) {
      setError("Incorrect passcode");
      setPasscodeInput("");
    }
    setIsAttempting(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && passcodeInput.length === 6) {
      handleVerify();
    }
  };

  // If already verified, render children with floating window
  if (appPasscodeVerified) {
    return <>{children}</>;
  }

  // While not verified, show blur and modal
  return (
    <div style={{ position: "relative" }}>
      {/* Blurred Background Content */}
      <div
        suppressHydrationWarning
        inert
        aria-hidden="true"
        style={{
          filter: "blur(6px)",
          pointerEvents: "none",
          opacity: 0.5,
        }}
      >
        {children}
      </div>

      {/* Authentication Modal - Overlay */}
      <div
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          padding: "1rem",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 20,
            padding: "2.5rem 2rem",
            boxShadow: T.shadow,
            animation: "slideUp 0.4s ease",
          }}
        >
          {/* Icon */}
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div
              style={{
                width: 70,
                height: 70,
                background: `${T.primary}20`,
                border: `2px solid ${T.primary}`,
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem",
              }}
            >
              <Shield size={36} color={T.primary} />
            </div>
            <h1
              style={{
                fontSize: "1.4rem",
                fontWeight: 800,
                color: T.textPri,
                margin: "0 0 0.5rem 0",
                fontFamily: "'Syne',sans-serif",
              }}
            >
              Security Verification
            </h1>
            <p
              style={{
                fontSize: 13,
                color: T.textMut,
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Enter your 6-digit passcode to access the finance dashboard
            </p>
          </div>

          {/* Input */}
          <div style={{ marginBottom: "1.5rem" }}>
            <input
              type="password"
              maxLength={6}
              inputMode="numeric"
              value={passcodeInput}
              onChange={(e) => {
                setPasscodeInput(e.target.value.replace(/\D/g, "").slice(0, 6));
                setError("");
              }}
              onKeyPress={handleKeyPress}
              placeholder="●●●●●●"
              autoFocus
              disabled={isAttempting}
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: T.inputBg,
                border: `2px solid ${error ? T.rose : T.border}`,
                borderRadius: 12,
                padding: "1rem",
                fontSize: 32,
                letterSpacing: "0.8em",
                color: T.textPri,
                textAlign: "center",
                fontFamily: "'DM Mono','Fira Mono',monospace",
                outline: "none",
                transition: "all 0.3s ease",
                opacity: isAttempting ? 0.6 : 1,
                animation: error ? "shake 0.3s" : undefined,
              }}
            />

            {error && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: "0.75rem",
                  padding: "0.75rem",
                  background: `${T.rose}15`,
                  border: `1px solid ${T.rose}40`,
                  borderRadius: 8,
                  color: T.rose,
                  fontSize: 13,
                }}
              >
                <AlertCircle size={16} />
                {error}
              </div>
            )}
          </div>

          {/* Button */}
          <button
            onClick={handleVerify}
            disabled={passcodeInput.length !== 6 || isAttempting}
            style={{
              width: "100%",
              background:
                passcodeInput.length === 6
                  ? `linear-gradient(135deg, ${T.primary}, ${T.primary}cc)`
                  : T.btnGhost,
              border: "none",
              borderRadius: 12,
              padding: "0.9rem",
              color: passcodeInput.length === 6 ? (isDark ? "#021a14" : "#fff") : T.textMut,
              fontSize: 14,
              fontWeight: 700,
              cursor: passcodeInput.length === 6 ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              transition: "all 0.3s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: isAttempting ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              const btn = e.currentTarget as HTMLButtonElement;
              if (passcodeInput.length === 6 && !isAttempting) {
                btn.style.transform = "translateY(-2px)";
                btn.style.boxShadow = `0 8px 24px ${T.primary}40`;
              }
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.transform = "translateY(0)";
              btn.style.boxShadow = "none";
            }}
          >
            <Lock size={16} />
            {isAttempting ? "Verifying..." : "Unlock Dashboard"}
          </button>

          {/* Footer Info */}
          <div
            style={{
              fontSize: 11,
              color: T.textMut,
              textAlign: "center",
              marginTop: "1.5rem",
              paddingTop: "1.5rem",
              borderTop: `1px solid ${T.border}`,
            }}
          >
            This dApp requires authentication to protect your financial data. Default passcode: 888888
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}
