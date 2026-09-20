'use client'

import { ShoppingCart } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface Props {
  visible: boolean
  prix: number
  /** Une ligne courte sous le prix : « 30 sacs », « Quantité : 2 ». */
  sousTitre: string
  redirecting: boolean
  onClick: () => void
  /** data-track et data-product-* du bouton principal, pour la mesure. */
  attributs: Record<string, string | number>
}

/**
 * Barre d'achat fixe en bas d'écran, téléphone et tablette.
 *
 * Toujours montée, glissée hors de l'écran quand le bouton principal est
 * visible. Une seule ligne, compacte : le libellé ne passe jamais sur deux
 * lignes — un bouton de 80 px de haut prenait un quart de l'écran.
 */
export default function BarreAchatMobile({ visible, prix, sousTitre, redirecting, onClick, attributs }: Props) {
  return (
    <div
      aria-hidden={!visible}
      className={`lg:hidden fixed inset-x-0 bottom-0 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] px-4 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] transition-transform duration-200 ${
        visible ? 'translate-y-0' : 'translate-y-full pointer-events-none'
      }`}
    >
      <div className="flex items-center gap-3 max-w-lg mx-auto">
        <div className="min-w-0 flex-shrink-0">
          <p className="text-lg font-bold text-ink leading-tight">{formatPrice(prix)}</p>
          <p className="text-[12px] text-gray-500 leading-tight truncate max-w-[110px]">{sousTitre}</p>
        </div>
        <button
          onClick={onClick}
          disabled={redirecting}
          tabIndex={visible ? 0 : -1}
          {...attributs}
          className="flex-1 min-w-0 h-12 px-3 rounded-lg font-bold text-[16px] whitespace-nowrap flex items-center justify-center gap-2 shadow-md bg-brand-600 hover:bg-brand-700 disabled:opacity-70 text-white transition-colors"
        >
          {redirecting ? (
            'Redirection…'
          ) : (
            <>
              <ShoppingCart size={20} className="flex-shrink-0 hidden min-[380px]:block" />
              Commander maintenant
            </>
          )}
        </button>
      </div>
    </div>
  )
}
