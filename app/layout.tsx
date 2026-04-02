import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ledger — Personal Finance Dashboard',
  description: 'Track your earnings, savings, and giving with beautiful charts and analytics',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#06080f" />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
