"use client";

import { useState, useEffect, useRef } from "react";
import {
  Eye, EyeOff, Globe, Settings, X, Wrench, Shield, CreditCard, Lock,
} from "lucide-react";
import { useAppSettings, CURRENCY_SYMBOLS, type Currency } from "../context/AppSettingsContext";

const DARK = {
  card: "rgba(255,255,255,0.032)",
  border: "rgba(255,255,255,0.075)",
  primary: "#00c9a7",
  violet: "#8b5cf6",
  blue: "#60a5fa",
  textPri: "#f0f4ff",
  textMut: "rgba(240,244,255,0.28)",
  shadow: "0 32px 80px rgba(0,0,0,0.8)",
  btnGhost: "rgba(255,255,255,0.05)",
};

const LIGHT = {
  card: "rgba(255,255,255,0.85)",
  border: "rgba(0,0,0,0.08)",
  primary: "#009d82",
  violet: "#7c3aed",
  blue: "#2563eb",
  textPri: "#0d1117",
  textMut: "rgba(13,17,23,0.38)",
  shadow: "0 32px 80px rgba(0,0,0,0.12)",
  btnGhost: "rgba(0,0,0,0.04)",
};

export function FloatingToolsWindow({ isDark }: { isDark: boolean }) {
  const {
    hideBalances,
    setHideBalances,
    currency,
    currentPage,
    appPasscodeVerified,
    lockApp,
  } = useAppSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState(() => {
    if (typeof window === "undefined") return { x: 0, y: 0 };
    const defaultX = window.innerWidth - 320 - 24;
    const defaultY = window.innerHeight - 420 - 24;
    return { x: Math.max(12, defaultX), y: Math.max(12, defaultY) };
  });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);

  const T = isDark ? DARK : LIGHT;

  useEffect(() => {
    if (!dragging) return;
    const handleMouseMove = (event: MouseEvent) => {
      if (!dragRef.current) return;
      const nextX = dragRef.current.offsetX + event.clientX - dragRef.current.startX;
      const nextY = dragRef.current.offsetY + event.clientY - dragRef.current.startY;
      setPosition({
        x: Math.min(Math.max(12, nextX), window.innerWidth - 340),
        y: Math.min(Math.max(12, nextY), window.innerHeight - 220),
      });
    };
    const handleMouseUp = () => setDragging(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);

  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.min(Math.max(12, prev.x), window.innerWidth - 340),
        y: Math.min(Math.max(12, prev.y), window.innerHeight - 220),
      }));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${T.primary}, ${T.primary}cc)`,
          border: `2px solid ${T.border}`,
          color: isDark ? "#021a14" : "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: T.shadow,
          zIndex: 300,
          transition: "transform 0.25s ease, box-shadow 0.25s ease",
          transform: isOpen ? "scale(0.95)" : "scale(1)",
          fontSize: 24,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = isOpen ? "scale(0.95)" : "scale(1)";
        }}
        title="Tools & Settings"
      >
        <Settings size={24} />
      </button>

      {/* Floating Window */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: position.y,
            left: position.x,
            width: 340,
            minHeight: 220,
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 18,
            padding: "1.25rem",
            boxShadow: T.shadow,
            zIndex: 300,
            animation: "slideUp 0.3s ease",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            fontFamily: "inherit",
            cursor: dragging ? "grabbing" : "default",
          }}
        >
          {/* Header */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              dragRef.current = {
                startX: e.clientX,
                startY: e.clientY,
                offsetX: position.x,
                offsetY: position.y,
              };
              setDragging(true);
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginBottom: "1rem",
              cursor: "grab",
              userSelect: "none",
              touchAction: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: T.textPri,
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Wrench size={16} style={{ color: T.primary }} />
                Tools & Settings
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: T.textMut,
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div
              style={{
                width: 42,
                height: 4,
                borderRadius: 999,
                background: T.border,
                alignSelf: "center",
                opacity: 0.8,
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              marginBottom: "1rem",
              padding: "0.85rem 0.25rem",
              borderTop: `1px solid ${T.border}`,
              borderBottom: `1px solid ${T.border}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Shield size={16} style={{ color: T.primary }} />
              <span style={{ fontSize: 12, color: T.textPri, fontWeight: 600 }}>
                {appPasscodeVerified ? "Unlocked" : "Locked"}
              </span>
            </div>
            {appPasscodeVerified && (
              <button
                onClick={lockApp}
                style={{
                  background: T.btnGhost,
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  padding: "0.45rem 0.8rem",
                  color: T.textMut,
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                Lock App
              </button>
            )}
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: T.border,
              marginBottom: "1rem",
            }}
          />

          {/* Hide Balances Toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.75rem 0",
              marginBottom: "0.75rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {hideBalances ? <EyeOff size={16} /> : <Eye size={16} />}
              <span
                style={{
                  fontSize: 13,
                  color: T.textPri,
                  fontWeight: 500,
                }}
              >
                {hideBalances ? "Balances Hidden" : "Balances Visible"}
              </span>
            </div>
            <button
              onClick={() => setHideBalances(!hideBalances)}
              style={{
                background: hideBalances ? T.primary : T.btnGhost,
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                padding: "4px 8px",
                color: hideBalances ? (isDark ? "#021a14" : "#fff") : T.textMut,
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
                transition: "all 0.2s",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                if (!hideBalances) {
                  btn.style.background = `${T.primary}20`;
                }
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.background = hideBalances ? T.primary : T.btnGhost;
              }}
            >
              {hideBalances ? "Show" : "Hide"}
            </button>
          </div>

          {currentPage === "home" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                padding: "0.75rem",
                background: `${T.primary}10`,
                border: `1px solid ${T.primary}30`,
                borderRadius: 10,
                marginBottom: "0.75rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Globe size={16} />
                <span style={{ fontSize: 13, color: T.textPri, fontWeight: 500 }}>
                  Web2 goal controls
                </span>
              </div>
              <div style={{ fontSize: 12, color: T.textMut, lineHeight: 1.5 }}>
                Set your yearly goal and currency from the home page goal panel. Floating tools only manage privacy and quick actions.
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ fontSize: 11, color: T.textMut, lineHeight: 1.4 }}>
                  Current currency:
                  <div style={{ fontWeight: 700, color: T.textPri }}>{currency}</div>
                </div>
                <button
                  onClick={() => window.location.href = "/"}
                  style={{
                    background: `linear-gradient(135deg, ${T.primary}, ${T.primary}cc)`,
                    border: "none",
                    borderRadius: 8,
                    padding: "0.55rem 0.9rem",
                    color: isDark ? "#021a14" : "#fff",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  Open Home
                </button>
              </div>
            </div>
          )}

          {/* Encryption Info - Cards Page */}
          {currentPage === "cards" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: "0.75rem",
                background: `${T.primary}10`,
                border: `1px solid ${T.primary}30`,
                borderRadius: 8,
                marginBottom: "0.75rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Lock size={14} style={{ color: T.primary }} />
                <span
                  style={{
                    fontSize: 12,
                    color: T.textPri,
                    fontWeight: 500,
                  }}
                >
                  Encryption Active
                </span>
              </div>
              <button
                onClick={() => window.location.href = "/cards"}
                style={{
                  background: `linear-gradient(135deg, ${T.primary}, ${T.primary}cc)`,
                  border: "none",
                  borderRadius: 8,
                  padding: "0.6rem 0.9rem",
                  color: isDark ? "#021a14" : "#fff",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                Manage Wallets
              </button>
            </div>
          )}

          {/* Info Section */}
          <div
            style={{
              fontSize: 11,
              color: T.textMut,
              lineHeight: 1.5,
              marginTop: "1rem",
              paddingTop: "1rem",
              borderTop: `1px solid ${T.border}`,
            }}
          >
            {currentPage === "home" ? (
              <>
                <strong>Web2 mode:</strong> Bank accounts & cards
                <br />
                Selected currency updates home goal totals
              </>
            ) : (
              <>
                <strong>Encryption:</strong> AES-256-GCM
                <br />
                All data encrypted client-side
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
