import type { Metadata } from 'next'
import './globals.css'
import SiteShell from '@/components/layout/SiteShell'

export const metadata: Metadata = {
  title: {
    default: 'Bois Émeraude — Maison du feu de bois',
    template: '%s | Bois Émeraude',
  },
  description: 'Le bois de chauffage, dans sa plus belle expression. Bûches de feuillus durs séchées à cœur et granulés certifiés EN+ A1, livrés partout en France.',
  keywords: ['bois de chauffage', 'granulés de bois', 'pellets', 'bûches', 'chauffage au bois', 'bois émeraude'],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Bois Émeraude',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <head></head>
      <body className="antialiased font-sans text-ink bg-white">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  )
}
