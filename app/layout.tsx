import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Web3Provider } from "./context/Web3Context";
import { AppSettingsProvider } from "./context/AppSettingsContext";

export const metadata: Metadata = {
  title: "Korgon Finance",
  description: "Track your earnings, savings, and giving",
  icons: { icon: "/brand/favicon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#080808"/>
      </head>
      <body suppressHydrationWarning style={{ margin:0, background:"#080808" }}>
        <Web3Provider>
          <AppSettingsProvider>
            {children}
          </AppSettingsProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
