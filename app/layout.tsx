import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Web3Provider } from "./context/Web3Context";

export const metadata: Metadata = {
  title: "Ledger — Personal Finance Dashboard",
  description: "Track your earnings, savings, and giving with beautiful charts and analytics",
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
        <meta name="theme-color" content="#06080f" />
      </head>
      <body suppressHydrationWarning>
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}