import Link from 'next/link'

const shopLinks = [
  { label: 'Bois de chauffage',  href: '/produits?categorie=bois-de-chauffage' },
  { label: 'Granulés & pellets', href: '/produits?categorie=granules-et-pellets' },
]

const helpLinks = [
  { label: 'Suivi de commande',  href: '/suivi-commande' },
  { label: 'Livraison',          href: '/livraison' },
  { label: 'Paiement sécurisé',  href: '/paiement-securise' },
  { label: 'Retours & rétractation', href: '/politique-retour' },
  { label: 'Contact',            href: '/contact' },
]

const legalLinks = [
  { label: 'Mentions légales', href: '/mentions-legales' },
  { label: 'CGV',              href: '/cgv' },
  { label: 'Confidentialité',  href: '/confidentialite' },
  { label: 'Cookies',          href: '/politique-cookies' },
]

export default function Footer() {
  return (
    <footer className="bg-ink text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <svg width="32" height="32" viewBox="0 0 36 36" fill="none" aria-hidden>
                <path d="M18 30 C10 30 6 25 6 19 C6 13 10 9 12 5 C11 10 14 11 14 15 C14 18 16 15 16 12 C19 15 22 15 22 21 C22 27 26 22 25 17 C29 20 30 24 30 27 C30 29 26 30 18 30 Z" fill="#2FB88E" />
              </svg>
              <span className="text-white font-serif font-semibold text-lg">Bois Émeraude</span>
            </div>
            <p className="text-sm leading-relaxed mb-5">
              La maison française du bois de chauffage haut de gamme : bûches de feuillus durs séchées à cœur et granulés certifiés EN+ A1, sélectionnés avec exigence et livrés partout en France.
            </p>
            <div className="space-y-1.5 text-sm">
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                contact@bois-emeraude.com
              </p>
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Lun – Ven · 9h – 18h
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">Boutique</h4>
            <ul className="space-y-2.5 text-sm">
              {shopLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-brand-400 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">Services</h4>
            <ul className="space-y-2.5 text-sm">
              {helpLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-brand-400 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">Paiement sécurisé</h4>
            <div className="flex gap-2 flex-wrap mb-6">
              {['CB', 'Visa', 'Mastercard'].map((b) => (
                <span key={b} className="bg-white/10 border border-white/10 text-gray-300 text-xs px-2.5 py-1.5 rounded-md font-medium">
                  {b}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              3D-Secure · Site de démonstration — le paiement en ligne sera activé après validation par le client.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} Bois Émeraude — Tous droits réservés.</span>
          <nav className="flex flex-wrap gap-x-5 gap-y-1 justify-center">
            {legalLinks.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-gray-300 transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
