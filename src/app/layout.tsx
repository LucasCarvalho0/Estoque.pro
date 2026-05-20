import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/layout/Providers';
import { PWAInstallPrompt } from '@/components/layout/PWAInstallPrompt';

export const metadata: Metadata = {
  title: 'StockPRO — Controle de Estoque Corporativo',
  description: 'Sistema profissional de controle de estoque empresarial',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'StockPRO',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="application-name" content="StockPRO" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="StockPRO" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <Providers>
          {children}
          <PWAInstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
