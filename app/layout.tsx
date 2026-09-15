import type { Metadata } from 'next'
import './globals.css'
import SiteShell from '@/components/layout/SiteShell'
import MetaPixel from '@/components/analytics/MetaPixel'
import AnalyticsTracker from '@/components/analytics/AnalyticsTracker'

export const metadata: Metadata = {
  title: {
    default: 'Bois Tresor — Bois de chauffage & granulés premium',
    template: '%s | Bois Tresor',
  },
  description: 'Le bois de chauffage, dans sa plus belle expression. Bûches de feuillus durs séchées à cœur et granulés certifiés EN+ A1, livrés partout en France.',
  keywords: ['bois de chauffage', 'granulés de bois', 'pellets', 'bûches', 'chauffage au bois', 'bois tresor'],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Bois Tresor',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <head></head>
      <body className="antialiased font-sans text-ink bg-white">
        <MetaPixel />
        <AnalyticsTracker />
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  )
}
