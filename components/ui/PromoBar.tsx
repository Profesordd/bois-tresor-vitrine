import { Truck, ShieldCheck } from 'lucide-react'

export default function PromoBar() {
  return (
    <div className="bg-brand-800 text-cream-100 text-center text-xs sm:text-sm py-2.5 px-4 font-medium tracking-wide">
      <div className="flex items-center justify-center gap-4 sm:gap-8 flex-wrap">
        <span className="flex items-center gap-1.5">
          <Truck size={14} className="text-ember-400 flex-shrink-0" />
          Livraison offerte dès 150 €
        </span>
        <span className="hidden sm:inline text-brand-600">·</span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-ember-400 flex-shrink-0" />
          Paiement 100 % sécurisé
        </span>
      </div>
    </div>
  )
}
