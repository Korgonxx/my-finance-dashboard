"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Currency = "USD" | "EUR" | "GBP" | "JPY" | "AUD" | "CAD" | "CHF" | "CNY" | "INR";
export type AppPage = "home" | "cards";

interface AppSettingsContextType {
  // Master passcode
  appPasscodeVerified: boolean;
  verifyAppPasscode: (passcode: string) => boolean;
  lockApp: () => void;
  
  // Currency
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  
  // Balance visibility
  hideBalances: boolean;
  setHideBalances: (hidden: boolean) => void;
  
  // Floating window
  currentPage: AppPage;
  setCurrentPage: (page: AppPage) => void;
}

const AppSettingsContext = createContext<AppSettingsContextType>({
  appPasscodeVerified: false,
  verifyAppPasscode: () => false,
  lockApp: () => {},
  currency: "USD",
  setCurrency: () => {},
  hideBalances: false,
  setHideBalances: () => {},
  currentPage: "home",
  setCurrentPage: () => {},
});

const MASTER_PASSCODE = "888888";
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
  const [appPasscodeVerified, setAppPasscodeVerified] = useState(false);
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
  const [isHydrated, setIsHydrated] = useState(true);

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
    if (passcode === MASTER_PASSCODE) {
      setAppPasscodeVerified(true);
      return true;
    }
    return false;
  };

  const lockApp = () => {
    setAppPasscodeVerified(false);
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

  return (
    <AppSettingsContext.Provider
      value={{
        appPasscodeVerified,
        verifyAppPasscode,
        lockApp,
        currency,
        setCurrency,
        hideBalances,
        setHideBalances,
        currentPage,
        setCurrentPage,
      }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
}

export const useAppSettings = () => useContext(AppSettingsContext);
export { CURRENCY_SYMBOLS };
