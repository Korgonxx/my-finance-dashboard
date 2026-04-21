"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Currency = "USD" | "EUR" | "GBP" | "JPY" | "AUD" | "CAD" | "CHF" | "CNY" | "INR";
export type AppPage = "home" | "cards";

interface AppSettingsContextType {
  // Master passcode
  appPasscodeVerified: boolean;
  verifyAppPasscode: (passcode: string) => boolean;
  lockApp: () => void;
  changeAppPasscode: (currentPasscode: string, newPasscode: string) => Promise<boolean>;
  
  // Currency
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  
  // Balance visibility
  hideBalances: boolean;
  setHideBalances: (hidden: boolean) => void;
  
  // Floating window
  currentPage: AppPage;
  setCurrentPage: (page: AppPage) => void;

  // Theme
  isDark: boolean;
  setIsDark: (isDark: boolean) => void;
}

const AppSettingsContext = createContext<AppSettingsContextType>({
  appPasscodeVerified: false,
  verifyAppPasscode: () => false,
  lockApp: () => {},
  changeAppPasscode: async () => false,
  currency: "USD",
  setCurrency: () => {},
  hideBalances: false,
  setHideBalances: () => {},
  currentPage: "home",
  setCurrentPage: () => {},
  isDark: true,
  setIsDark: () => {},
});

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AUD: "A$",
  CAD: "C$",
  CHF: "CHF",
  CNY: "¥",
  INR: "₹",
};

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [appPasscodeVerified, setAppPasscodeVerified] = useState(() => {
    try { return sessionStorage.getItem("korgon_verified") === "true"; } catch { return false; }
  });
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [hideBalances, setHideBalancesState] = useState(false);
  const [currentPage, setCurrentPageState] = useState<AppPage>("home");
  const [isDark, setIsDarkState] = useState(true);

  // Load settings from API on mount (cross-device sync)
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.theme === 'dark' || data.theme === 'light') setIsDarkState(data.theme === 'dark');
        }
      } catch {}
    }
    loadSettings();
  }, []);

  // Apply theme to DOM
  useEffect(() => {
    try {
      if (!isDark) {
        document.documentElement.classList.add('light');
        document.body.style.background = '#F2F2F0';
      } else {
        document.documentElement.classList.remove('light');
        document.body.style.background = '#080808';
      }
    } catch {}
  }, [isDark]);

  // Persist theme to API
  useEffect(() => {
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: isDark ? 'dark' : 'light' }),
    }).catch(() => {});
  }, [isDark]);

  const verifyAppPasscode = (passcode: string): boolean => {
    // Deprecated: verification now happens server-side via POST /api/settings
    // This is kept for backwards compatibility with MasterPasscodeGuard
    if (passcode.length === 6 && /^\d+$/.test(passcode)) {
      setAppPasscodeVerified(true);
      try { sessionStorage.setItem("korgon_verified", "true"); } catch {}
      return true;
    }
    return false;
  };

  const changeAppPasscode = async (currentPasscode: string, newPasscode: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPasscode, newPasscode }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const lockApp = () => {
    setAppPasscodeVerified(false);
    try { sessionStorage.removeItem("korgon_verified"); } catch {}
  };

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
  };

  const setHideBalances = (hidden: boolean) => {
    setHideBalancesState(hidden);
  };

  const setCurrentPage = (page: AppPage) => {
    setCurrentPageState(page);
  };

  const setIsDark = (dark: boolean) => {
    setIsDarkState(dark);
  };

  return (
    <AppSettingsContext.Provider
      value={{
        appPasscodeVerified,
        verifyAppPasscode,
        lockApp,
        changeAppPasscode,
        currency,
        setCurrency,
        hideBalances,
        setHideBalances,
        currentPage,
        setCurrentPage,
        isDark,
        setIsDark,
      }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
}

export const useAppSettings = () => useContext(AppSettingsContext);
export { CURRENCY_SYMBOLS };
