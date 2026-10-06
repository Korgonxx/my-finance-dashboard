"use client";

import { ReactNode } from "react";
import { AppSettingsProvider } from "../context/AppSettingsContext";
import { Web3Provider } from "../context/Web3Context";
import { SessionGate } from "./SessionGate";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppSettingsProvider>
      <Web3Provider>
        <SessionGate>{children}</SessionGate>
      </Web3Provider>
    </AppSettingsProvider>
  );
}
