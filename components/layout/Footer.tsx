import Link from 'next/link'

const shopLinks = [
  { label: 'Bûches de chauffage', href: '/produits?categorie=buches-de-chauffage' },
  { label: 'Bois densifié',       href: '/produits?categorie=bois-densifie' },
  { label: 'Bûches compressées',  href: '/produits?categorie=buches-compressees' },
  { label: 'Granulés & pellets',  href: '/produits?categorie=granules-de-bois' },
]

const helpLinks = [
  { label: 'Suivi de commande', href: '/suivi-commande' },
  { label: 'Contact',           href: '/contact' },
]

const legalLinks = [
  { label: 'Mentions légales', href: '/mentions-legales' },
  { label: 'CGV',              href: '/cgv' },
  { label: 'Confidentialité',  href: '/confidentialite' },
]

export default function Footer() {
  return (
    <footer className="bg-brand-900 text-brand-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <svg width="32" height="32" viewBox="0 0 36 36" fill="none" aria-hidden>
                <circle cx="12" cy="24" r="7" fill="none" stroke="#F6B26B" strokeWidth="2.5" />
                <circle cx="22" cy="24" r="7" fill="none" stroke="#F6B26B" strokeWidth="2.5" />
                <path d="M17 15 C14 11 14 7 17 3 C20 7 20 11 17 15 Z" fill="#EE9145" />
              </svg>
              <span className="text-white font-serif font-semibold text-lg">Bois Trésor</span>
            </div>
            <p className="text-sm leading-relaxed mb-5 text-brand-300">
              Bois de chauffage et granulés premium, sélectionnés pour leur qualité de séchage et livrés directement chez vous.
            </p>
            <div className="space-y-1.5 text-sm">
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 text-ember-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                contact@bois-tresor.com
              </p>
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 text-ember-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Lun–Ven 9h–18h
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">Boutique</h4>
            <ul className="space-y-2.5 text-sm">
              {shopLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-ember-400 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">Aide & Services</h4>
            <ul className="space-y-2.5 text-sm">
              {helpLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-ember-400 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">Paiement sécurisé</h4>
            <div className="flex gap-2 flex-wrap mb-6">
              {['CB', 'Visa', 'Mastercard'].map((b) => (
                <span key={b} className="bg-brand-800 border border-brand-700 text-brand-200 text-xs px-2.5 py-1.5 rounded-md font-medium">
                  {b}
                </span>
              ))}
            </div>
            <p className="text-xs text-brand-400 leading-relaxed">
              Site de démonstration — le paiement en ligne sera activé après validation du design par le client.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-brand-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-brand-400">
          <span>© {new Date().getFullYear()} Bois Trésor. Tous droits réservés.</span>
          <nav className="flex flex-wrap gap-x-5 gap-y-1 justify-center">
            {legalLinks.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-brand-200 transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
