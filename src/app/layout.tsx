import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { ConvexClientProvider } from '@/lib/convex-provider'
import { LangProvider } from '@/lib/i18n'
import { ThemeProvider } from '@/lib/theme'
import '@/styles/global.css'

export const metadata: Metadata = {
  title: 'Jenga Suppliers™ — Construis ton business à la source',
  description: 'La plus grande bibliothèque francophone de fournisseurs vérifiés au monde. 500+ fournisseurs, weekly drops, guides d\'importation.',
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
