"use client";

import { useState } from "react";
import {
  Eye, EyeOff, Globe, Settings, Shield, CreditCard, Lock,
  Key, Check, X,
} from "lucide-react";
import { useAppSettings, CURRENCY_SYMBOLS, type Currency } from "../context/AppSettingsContext";

const DARK = {
  bg: "rgba(6,8,15,0.95)",
  border: "rgba(255,255,255,0.075)",
  primary: "#00c9a7",
  violet: "#8b5cf6",
  blue: "#60a5fa",
  textPri: "#f0f4ff",
  textMut: "rgba(240,244,255,0.28)",
  shadow: "0 4px 20px rgba(0,0,0,0.3)",
  btnGhost: "rgba(255,255,255,0.05)",
  inputBg: "rgba(255,255,255,0.04)",
};

const LIGHT = {
  bg: "rgba(255,255,255,0.95)",
  border: "rgba(0,0,0,0.08)",
  primary: "#009d82",
  violet: "#7c3aed",
  blue: "#2563eb",
  textPri: "#0d1117",
  textMut: "rgba(13,17,23,0.38)",
  shadow: "0 4px 20px rgba(0,0,0,0.12)",
  btnGhost: "rgba(0,0,0,0.04)",
  inputBg: "rgba(0,0,0,0.04)",
};

export function BottomToolsBar({ isDark }: { isDark: boolean }) {
  const {
    hideBalances,
    setHideBalances,
    currency,
    currentPage,
    appPasscodeVerified,
    lockApp,
    changeAppPasscode,
  } = useAppSettings();

  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [currentPasscode, setCurrentPasscode] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState("");

  const T = isDark ? DARK : LIGHT;

  const handleChangePasscode = () => {
    setPasscodeError("");
    if (!currentPasscode || !newPasscode || !confirmPasscode) {
      setPasscodeError("All fields are required");
      return;
    }
    if (newPasscode !== confirmPasscode) {
      setPasscodeError("New passcodes don't match");
      return;
    }
    if (newPasscode.length !== 6 || !/^\d+$/.test(newPasscode)) {
      setPasscodeError("Passcode must be 6 digits");
      return;
    }

    const success = changeAppPasscode(currentPasscode, newPasscode);
    if (!success) {
      setPasscodeError("Current passcode is incorrect");
      return;
    }

    setShowPasscodeModal(false);
    setCurrentPasscode("");
    setNewPasscode("");
    setConfirmPasscode("");
  };

  return (
    <>
      {/* Bottom Bar */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: T.bg,
          borderTop: `1px solid ${T.border}`,
          padding: "0.5rem 0.75rem",
          boxShadow: T.shadow,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          zIndex: 200,
          fontFamily: "inherit",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            maxWidth: 1200,
            margin: "0 auto",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          {/* Left Section - App Status */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Shield size={14} style={{ color: appPasscodeVerified ? T.primary : T.textMut }} />
              <span style={{ fontSize: 11, color: T.textPri, fontWeight: 600, whiteSpace: "nowrap" }}>
                {appPasscodeVerified ? "Unlocked" : "Locked"}
              </span>
            </div>

            {appPasscodeVerified && (
              <button
                onClick={lockApp}
                style={{
                  background: T.btnGhost,
                  border: `1px solid ${T.border}`,
                  borderRadius: 6,
                  padding: "0.25rem 0.4rem",
                  color: T.textMut,
                  cursor: "pointer",
                  fontSize: 10,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Lock
              </button>
            )}
          </div>

          {/* Center Section - Balance Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap" }}>
            {hideBalances ? <EyeOff size={14} /> : <Eye size={14} />}
            <span style={{ fontSize: 11, color: T.textPri, fontWeight: 500 }}>
              {hideBalances ? "Hidden" : "Visible"}
            </span>
            <button
              onClick={() => setHideBalances(!hideBalances)}
              style={{
                background: hideBalances ? T.primary : T.btnGhost,
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                padding: "3px 6px",
                color: hideBalances ? (isDark ? "#021a14" : "#fff") : T.textMut,
                cursor: "pointer",
                fontSize: 10,
                fontWeight: 600,
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {hideBalances ? "Show" : "Hide"}
            </button>
          </div>

          {/* Right Section - Settings */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
            {currentPage === "home" && (
              <button
                onClick={() => window.location.href = "/"}
                title="Home"
                style={{
                  background: T.btnGhost,
                  border: `1px solid ${T.border}`,
                  borderRadius: 6,
                  padding: "0.25rem 0.4rem",
                  color: T.textMut,
                  cursor: "pointer",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                Home
              </button>
            )}

            {currentPage === "cards" && (
              <button
                onClick={() => window.location.href = "/cards"}
                title="Wallets"
                style={{
                  background: T.btnGhost,
                  border: `1px solid ${T.border}`,
                  borderRadius: 6,
                  padding: "0.25rem 0.4rem",
                  color: T.textMut,
                  cursor: "pointer",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                Cards
              </button>
            )}

            {/* Change Passcode Button */}
            <button
              onClick={() => setShowPasscodeModal(true)}
              style={{
                background: T.btnGhost,
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                padding: "0.25rem 0.4rem",
                color: T.textMut,
                cursor: "pointer",
                fontSize: 10,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
              title="Change App Passcode"
            >
              <Key size={11} />
              <span>
                Code
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Change Passcode Modal */}
      {showPasscodeModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 300,
            padding: "1rem",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 400,
              background: T.bg,
              border: `1px solid ${T.border}`,
              borderRadius: 16,
              padding: "1.5rem 1rem",
              boxShadow: T.shadow,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: T.textPri, margin: 0 }}>
                Change Passcode
              </h3>
              <button
                onClick={() => {
                  setShowPasscodeModal(false);
                  setCurrentPasscode("");
                  setNewPasscode("");
                  setConfirmPasscode("");
                  setPasscodeError("");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: T.textMut,
                  cursor: "pointer",
                  padding: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 44,
                  minHeight: 44,
                  touchAction: "manipulation",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: T.textPri, marginBottom: 6 }}>
                  Current Passcode
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={currentPasscode}
                  onChange={(e) => setCurrentPasscode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="●●●●●●"
                  style={{
                    width: "100%",
                    background: T.inputBg,
                    border: `1px solid ${T.border}`,
                    borderRadius: 8,
                    padding: "0.8rem",
                    color: T.textPri,
                    fontSize: 16,
                    textAlign: "center",
                    fontFamily: "monospace",
                    outline: "none",
                    touchAction: "manipulation",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: T.textPri, marginBottom: 6 }}>
                  New Passcode
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="●●●●●●"
                  style={{
                    width: "100%",
                    background: T.inputBg,
                    border: `1px solid ${T.border}`,
                    borderRadius: 8,
                    padding: "0.75rem",
                    color: T.textPri,
                    fontSize: 16,
                    textAlign: "center",
                    fontFamily: "monospace",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, color: T.textPri, marginBottom: 6 }}>
                  Confirm New Passcode
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={confirmPasscode}
                  onChange={(e) => setConfirmPasscode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="●●●●●●"
                  style={{
                    width: "100%",
                    background: T.inputBg,
                    border: `1px solid ${T.border}`,
                    borderRadius: 8,
                    padding: "0.8rem",
                    color: T.textPri,
                    fontSize: 16,
                    textAlign: "center",
                    fontFamily: "monospace",
                    outline: "none",
                    touchAction: "manipulation",
                  }}
                />
              </div>

              {passcodeError && (
                <div style={{ fontSize: 12, color: "#f43f5e", textAlign: "center", padding: "0.5rem" }}>
                  {passcodeError}
                </div>
              )}

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  onClick={() => {
                    setShowPasscodeModal(false);
                    setCurrentPasscode("");
                    setNewPasscode("");
                    setConfirmPasscode("");
                    setPasscodeError("");
                  }}
                  style={{
                    flex: 1,
                    background: T.btnGhost,
                    border: `1px solid ${T.border}`,
                    borderRadius: 8,
                    padding: "1rem 0.75rem",
                    color: T.textMut,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    minHeight: 44,
                    touchAction: "manipulation",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePasscode}
                  style={{
                    flex: 1,
                    background: `linear-gradient(135deg, ${T.primary}, ${T.primary}cc)`,
                    border: "none",
                    borderRadius: 8,
                    padding: "1rem 0.75rem",
                    color: isDark ? "#021a14" : "#fff",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    minHeight: 44,
                    touchAction: "manipulation",
                  }}
                >
                  Change
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}