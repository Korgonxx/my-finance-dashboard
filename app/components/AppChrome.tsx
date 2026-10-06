"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Eye, EyeOff, LayoutDashboard, LockKeyhole, Moon, ShieldCheck, Sun, WalletCards } from "lucide-react";
import { useAppSettings } from "../context/AppSettingsContext";
import { useWeb3 } from "../context/Web3Context";

const navigation = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/cards", label: "Accounts", icon: WalletCards },
  { href: "/performance", label: "Analytics", icon: Activity },
];

export function AppChrome({ children, title }: { children: React.ReactNode; title: string }) {
  const pathname = usePathname();
  const { mode, setMode } = useWeb3();
  const { isDark, setIsDark, hideBalances, setHideBalances } = useAppSettings();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand-lockup" aria-label="Korgon Finance home">
          <div className="brand-mark"><ShieldCheck size={17} /></div>
          <div>
            <div className="brand-name">Korgon Finance</div>
            <div className="brand-meta">Private money cockpit</div>
          </div>
        </Link>
        <div className="sidebar-section-label">Navigate</div>
        <nav className="sidebar-nav" aria-label="Primary navigation">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={`nav-link ${active ? "is-active" : ""}`}>
                <span className="nav-link__glyph"><Icon size={17} /></span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-status"><span className="status-dot" /><span>Session protected</span></div>
        <div className="sidebar-footer">
          <div className="sidebar-footer__label"><strong>{mode === "crypto" ? "Crypto mode" : "Bank mode"}</strong><span>LIVE / SYNCED</span></div>
          <button className="icon-button" type="button" onClick={() => window.dispatchEvent(new Event("ledger:lock"))} aria-label="Lock workspace"><LockKeyhole size={15} /></button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar__context"><span>Workspace /</span><strong>{title}</strong></div>
          <div className="topbar__actions">
            <div className="mode-switch" aria-label="Data mode">
              <button type="button" className={mode === "banks" ? "is-active" : ""} onClick={() => setMode("banks")}>Bank</button>
              <button type="button" className={mode === "crypto" ? "is-active" : ""} onClick={() => setMode("crypto")}>Crypto</button>
            </div>
            <button className="icon-button" type="button" onClick={() => setHideBalances(!hideBalances)} aria-label={hideBalances ? "Show balances" : "Hide balances"} title={hideBalances ? "Show balances" : "Hide balances"}>
              {hideBalances ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
            <button className="icon-button" type="button" onClick={() => setIsDark(!isDark)} aria-label="Toggle theme" title="Toggle theme">
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </header>
        <main className="content animate-in">{children}</main>
      </div>
    </div>
  );
}
