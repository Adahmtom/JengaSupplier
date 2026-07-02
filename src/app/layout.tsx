import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { ConvexClientProvider } from '@/lib/convex-provider'
import { LangProvider } from '@/lib/i18n'
import { ThemeProvider } from '@/lib/theme'
import '@/styles/global.css'

const BASE_URL = 'https://jengasuppliers.com'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Jenga Suppliers™ — La bibliothèque de fournisseurs vérifiés #1 en francophonie',
    template: '%s | Jenga Suppliers™',
  },
  description: 'Accédez à 500+ fournisseurs vérifiés, des weekly drops exclusifs, des guides d\'importation et une communauté de revendeurs sérieux. La plus grande bibliothèque francophone au monde.',
  keywords: [
    'fournisseurs vérifiés',
    'fournisseurs grossistes',
    'dropshipping francophone',
    'import Chine',
    'revendeurs',
    'sourcing produits',
    'bibliothèque fournisseurs',
    'Jenga Suppliers',
  ],
  authors: [{ name: 'Belle Jones', url: BASE_URL }],
  creator: 'Belle Jones',
  publisher: 'Jenga Suppliers',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: BASE_URL,
    siteName: 'Jenga Suppliers™',
    title: 'Jenga Suppliers™ — La bibliothèque de fournisseurs vérifiés #1 en francophonie',
    description: 'Accédez à 500+ fournisseurs vérifiés, des weekly drops exclusifs, des guides d\'importation et une communauté de revendeurs sérieux.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Jenga Suppliers — Fournisseurs vérifiés pour revendeurs francophones',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jenga Suppliers™ — Fournisseurs vérifiés pour revendeurs francophones',
    description: 'Accédez à 500+ fournisseurs vérifiés, des weekly drops exclusifs et des guides d\'importation.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="fr">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Barlow+Condensed:wght@400;600;700&family=Barlow:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body>
          <a href="#main-content" className="sr-only focus:not-sr-only skip-link">
            Aller au contenu principal
          </a>
          <ConvexClientProvider>
            <ThemeProvider>
              <LangProvider>
                {children}
              </LangProvider>
            </ThemeProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
