import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'
import { CookieConsent } from '@/components/CookieConsent'
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  title: 'Meu Sócio',
  description: 'Gestão para autônomos e MEI',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Meu Sócio',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0D2B1E',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <Providers>
          {children}
          <CookieConsent />
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
