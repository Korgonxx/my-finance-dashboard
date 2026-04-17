"use client";

import React, { ReactNode } from "react";
import { 
  LayoutDashboard, CreditCard, BarChart2, Wallet,
  Settings, LogOut, Menu, X
} from "lucide-react";
import { ThemeType } from "./Sidebar";
import { useWeb3 } from "../context/Web3Context";

interface DashboardLayoutProps {
  children: ReactNode;
  T: ThemeType;
  isDark: boolean;
}

export function DashboardLayout({ children, T, isDark }: DashboardLayoutProps) {
  const { isWeb3 } = useWeb3();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const navItems = isWeb3 
    ? [
        { icon: LayoutDashboard, label: "Portfolio", href: "/" },
        { icon: Wallet, label: "Wallets", href: "/cards" },
        { icon: BarChart2, label: "Performance", href: "/performance" },
      ]
    : [
        { icon: LayoutDashboard, label: "Dashboard", href: "/" },
        { icon: CreditCard, label: "Cards", href: "/cards" },
        { icon: BarChart2, label: "Performance", href: "/performance" },
      ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, fontFamily: "'Outfit','Segoe UI',sans-serif" }}>
      {/* Mobile menu button */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 100,
          display: "none",
          background: T.pill,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          padding: 8,
          color: T.textPri,
          cursor: "pointer",
          "@media (max-width: 768px)": {
            display: "block"
          }
        }}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div
        style={{
          width: 80,
          background: T.sidebar,
          border: `1px solid ${T.border}`,
          borderRight: `1px solid ${T.border}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "1.5rem 0",
          gap: "1.5rem",
          position: "sticky",
          top: 0,
          height: "100vh",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${T.yellow}, ${T.green})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            fontWeight: 900,
            color: "#000",
          }}
        >
          ₿
        </div>

        {/* Nav items */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {navItems.map((item, idx) => (
            <a
              key={idx}
              href={item.href}
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: T.pill,
                border: `1px solid ${T.border}`,
                color: T.textPri,
                cursor: "pointer",
                transition: "all 0.2s",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = T.pillHov;
                e.currentTarget.style.borderColor = T.borderHov;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = T.pill;
                e.currentTarget.style.borderColor = T.border;
              }}
            >
              <item.icon size={20} />
            </a>
          ))}
        </div>

        {/* Bottom section */}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <button
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: T.pill,
              border: `1px solid ${T.border}`,
              color: T.textPri,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = T.pillHov;
              e.currentTarget.style.borderColor = T.borderHov;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = T.pill;
              e.currentTarget.style.borderColor = T.border;
            }}
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {children}
      </div>
    </div>
  );
}
