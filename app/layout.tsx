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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('app_theme');
                  var supportDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'false' || (theme === null && !supportDark)) {
                    document.documentElement.classList.add('light');
                    document.body.style.background = '#F2F2F0';
                  } else {
                    document.documentElement.classList.remove('light');
                    document.body.style.background = '#080808';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning style={{ margin: 0 }}>
        <Web3Provider>
          <AppSettingsProvider>
            {children}
          </AppSettingsProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
