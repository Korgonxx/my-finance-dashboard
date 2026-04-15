"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Currency = "USD" | "EUR" | "GBP" | "JPY" | "AUD" | "CAD" | "CHF" | "CNY" | "INR";
export type AppPage = "home" | "cards";

interface AppSettingsContextType {
  // Master passcode
  appPasscodeVerified: boolean;
  verifyAppPasscode: (passcode: string) => boolean;
  lockApp: () => void;
  changeAppPasscode: (currentPasscode: string, newPasscode: string) => boolean;
  
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
  changeAppPasscode: () => false,
  currency: "USD",
  setCurrency: () => {},
  hideBalances: false,
  setHideBalances: () => {},
  currentPage: "home",
  setCurrentPage: () => {},
  isDark: true,
  setIsDark: () => {},
});

const DEFAULT_PASSCODE = "888888";
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
  const [appPasscodeVerified, setAppPasscodeVerified] = useState(() => { try { return sessionStorage.getItem("korgon_verified") === "true"; } catch { return false; } });
  const [masterPasscode, setMasterPasscode] = useState(() => {
    try {
      const saved = localStorage.getItem("app_master_passcode");
      return saved || DEFAULT_PASSCODE;
    } catch {
      return DEFAULT_PASSCODE;
    }
  });
  const [currency, setCurrencyState] = useState<Currency>(() => {
    try {
      const saved = localStorage.getItem("app_currency") as Currency | null;
      return saved || "USD";
    } catch {
      return "USD";
    }
  });
  const [hideBalances, setHideBalancesState] = useState(() => {
    try {
      const saved = localStorage.getItem("app_hide_balances");
      return saved === "true";
    } catch {
      return false;
    }
  });
  const [currentPage, setCurrentPageState] = useState<AppPage>("home");
  const [isDark, setIsDarkState] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load initial settings
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("app_theme");
      if (savedTheme !== null) {
        setIsDarkState(savedTheme === "true");
      } else {
        // Default to dark mode or system preference
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setIsDarkState(prefersDark);
      }
    } catch {}
    setIsHydrated(true);
  }, []);

  // Persist theme
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem("app_theme", String(isDark));
    } catch {}
  }, [isDark, isHydrated]);

  // Persist master passcode
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem("app_master_passcode", masterPasscode);
    } catch {}
  }, [masterPasscode, isHydrated]);

  // Persist currency
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem("app_currency", currency);
    } catch {}
  }, [currency, isHydrated]);

  // Persist hide balances
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem("app_hide_balances", String(hideBalances));
    } catch {}
  }, [hideBalances, isHydrated]);

  const verifyAppPasscode = (passcode: string): boolean => {
    if (passcode === masterPasscode) {
      setAppPasscodeVerified(true); try { sessionStorage.setItem("korgon_verified", "true"); } catch {}
      return true;
    }
    return false;
  };

  const changeAppPasscode = (currentPasscode: string, newPasscode: string): boolean => {
    if (currentPasscode !== masterPasscode) {
      return false;
    }
    if (newPasscode.length !== 6 || !/^\d+$/.test(newPasscode)) {
      return false;
    }
    setMasterPasscode(newPasscode);
    return true;
  };

  const lockApp = () => {
    setAppPasscodeVerified(false); try { sessionStorage.removeItem("korgon_verified"); } catch {}
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
    try {
      if (!dark) {
        document.documentElement.classList.add('light');
        document.body.style.background = '#F2F2F0';
      } else {
        document.documentElement.classList.remove('light');
        document.body.style.background = '#080808';
      }
    } catch {}
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
