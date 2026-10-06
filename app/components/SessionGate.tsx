"use client";

import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { ArrowRight, Fingerprint, KeyRound, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";

interface SessionGateProps {
  children: ReactNode;
}

export function SessionGate({ children }: SessionGateProps) {
  const [status, setStatus] = useState<"checking" | "locked" | "setup" | "unlocked">("checking");
  const [code, setCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  const refreshSession = async () => {
    try {
      const sessionResponse = await fetch("/api/auth/session", { credentials: "include", cache: "no-store" });
      const session = await sessionResponse.json();
      if (session.authenticated) {
        setStatus("unlocked");
        return;
      }
      const settingsResponse = await fetch("/api/settings", { cache: "no-store" });
      const settings = await settingsResponse.json();
      const configured = Boolean(settings?.hasPasscode);
      setStatus(configured ? "locked" : "setup");
    } catch {
      setStatus("locked");
      setError("Secure session check failed. Refresh and try again.");
    }
  };

  useEffect(() => {
    // The first render must remain a neutral loading state while the server checks the cookie.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshSession();
    const handleLock = () => {
      setCode("");
      setConfirmCode("");
      setError("");
      setStatus("locked");
    };
    window.addEventListener("ledger:lock", handleLock);
    return () => window.removeEventListener("ledger:lock", handleLock);
  }, []);

  useEffect(() => {
    if (status === "locked" || status === "setup") {
      const timer = window.setTimeout(() => codeRef.current?.focus(), 160);
      return () => window.clearTimeout(timer);
    }
  }, [status]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(code)) {
      setError("Use a 6-digit passcode.");
      return;
    }
    if (status === "setup" && code !== confirmCode) {
      setError("Passcodes do not match.");
      return;
    }
    setBusy(true);
    try {
      const body = status === "setup"
        ? { action: "set-passcode", newPasscode: code }
        : { action: "verify-passcode", passcode: code };
      const response = await fetch("/api/settings", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to unlock this workspace.");
        setCode("");
        setConfirmCode("");
        return;
      }
      setCode("");
      setConfirmCode("");
      setStatus("unlocked");
    } catch {
      setError("Network error. Your passcode was not sent.");
    } finally {
      setBusy(false);
    }
  };

  if (status === "checking") {
    return (
      <div className="session-loading">
        <div className="session-loading__mark"><ShieldCheck size={22} /></div>
        <span>Verifying secure session</span>
      </div>
    );
  }

  if (status === "unlocked") return <>{children}</>;

  return (
    <div className="lock-screen">
      <div className="lock-screen__glow lock-screen__glow--one" />
      <div className="lock-screen__glow lock-screen__glow--two" />
      <div className="lock-screen__grid" />
      <main className="lock-panel">
        <div className="lock-panel__topline"><span /><span /><span /></div>
        <div className="lock-panel__brand">
          <div className="brand-mark brand-mark--large"><Sparkles size={22} /></div>
          <div>
            <p className="eyebrow">Korgon / private workspace</p>
            <h1>Finance, secured.</h1>
          </div>
        </div>
        <div className="lock-panel__intro">
          <div className="lock-panel__icon"><LockKeyhole size={20} /></div>
          <div>
            <p className="eyebrow">{status === "setup" ? "First-run protection" : "Protected session"}</p>
            <h2>{status === "setup" ? "Create your passcode" : "Welcome back"}</h2>
            <p>{status === "setup" ? "Set a 6-digit passcode. It is checked on the server and never stored in this browser." : "Unlock your private finance cockpit to continue."}</p>
          </div>
        </div>
        <form onSubmit={submit} className="lock-form">
          <label className="field-label" htmlFor="session-code">{status === "setup" ? "New passcode" : "Passcode"}</label>
          <div className="code-input-wrap">
            <KeyRound size={17} />
            <input
              id="session-code"
              ref={codeRef}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              type="password"
              placeholder="••••••"
              maxLength={6}
              aria-label="6-digit passcode"
            />
            <span className="code-count">{code.length}/6</span>
          </div>
          {status === "setup" && (
            <>
              <label className="field-label" htmlFor="confirm-code">Confirm passcode</label>
              <div className="code-input-wrap">
                <Fingerprint size={17} />
                <input
                  id="confirm-code"
                  value={confirmCode}
                  onChange={(event) => setConfirmCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  type="password"
                  placeholder="••••••"
                  maxLength={6}
                  aria-label="Confirm 6-digit passcode"
                />
                <span className="code-count">{confirmCode.length}/6</span>
              </div>
            </>
          )}
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button primary-button--full" type="submit" disabled={busy}>
            {busy ? "Checking…" : status === "setup" ? "Protect workspace" : "Unlock workspace"}
            <ArrowRight size={16} />
          </button>
        </form>
        <div className="lock-panel__footer"><ShieldCheck size={14} /> Server-verified · rate-limited · HttpOnly session</div>
      </main>
    </div>
  );
}
