import type { Metadata } from 'next'
import './globals.css'
import SiteShell from '@/components/layout/SiteShell'

export const metadata: Metadata = {
  title: {
    default: 'Bois Trésor — Bois de chauffage & granulés premium',
    template: '%s | Bois Trésor',
  },
  description: 'Bois de chauffage et granulés de bois premium, séchés à cœur, livrés chez vous. Site de démonstration.',
  keywords: ['bois de chauffage', 'granulés de bois', 'pellets', 'bûches', 'bois densifié', 'chauffage au bois'],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Bois Trésor',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <head></head>
      <body className="antialiased font-sans text-brand-900 bg-cream">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  )
}
