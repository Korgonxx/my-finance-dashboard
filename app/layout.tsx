import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finview — Finance Dashboard",
  description: "Track your earnings, savings, and giving",
  icons: { icon: "/favicon.svg" },
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
        <meta name="theme-color" content="#09090B" />
      </head>
      <body suppressHydrationWarning style={{ margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
