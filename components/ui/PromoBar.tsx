import { Home, Flame, Truck, ShieldCheck } from 'lucide-react'

/**
 * Bandeau de réassurance, visible sur toutes les pages.
 * Ordre imposé par le persona : confiance d'abord, puis produit,
 * puis livraison, puis paiement.
 */
const ITEMS = [
  { icon: Home,        label: 'Entreprise familiale française' },
  { icon: Flame,       label: 'Bois sec prêt à brûler' },
  { icon: Truck,       label: 'Livraison offerte' },
  { icon: ShieldCheck, label: 'Paiement 100 % sécurisé' },
]

export default function PromoBar() {
  return (
    <div className="bg-brand-800 text-white text-sm sm:text-base py-3 px-4 font-medium">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-x-6 gap-y-1.5 flex-wrap">
        {ITEMS.map(({ icon: Icon, label }, i) => (
          <span key={label} className="flex items-center gap-2">
            {i > 0 && <span className="hidden lg:inline text-brand-500 mr-4">•</span>}
            <Icon size={17} className="text-brand-300 flex-shrink-0" />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
