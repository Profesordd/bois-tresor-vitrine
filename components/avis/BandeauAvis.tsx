'use client'

import { Star, ChevronRight } from 'lucide-react'
import { useAvisModal } from '@/stores/avis'
import { REVIEW_RATING, REVIEW_COUNT } from '@/lib/reviews'

/**
 * La note du site, en une ligne, cliquable.
 *
 * Tient sur une seule ligne dès 320 px : sur une page de collection, la
 * preuve sociale doit se lire d'un coup d'œil, pas occuper un tiers de
 * l'écran. Le libellé se raccourcit sur téléphone plutôt que de passer à
 * la ligne.
 */
export default function BandeauAvis({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const { open } = useAvisModal()
  const sombre = tone === 'dark'

  return (
    <button
      onClick={open}
      data-track="Voir les avis"
      className={`w-full flex items-center justify-center gap-2 sm:gap-3 rounded-lg border px-3 py-2.5 sm:py-3 transition-colors ${
        sombre
          ? 'border-white/25 bg-white/10 hover:bg-white/15 text-white'
          : 'border-gray-200 bg-white hover:border-brand-400 text-gray-700'
      }`}
    >
      <span className="flex gap-0.5 flex-shrink-0">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={16} className={sombre ? 'fill-brand-400 text-brand-400' : 'fill-brand-500 text-brand-500'} />
        ))}
      </span>
      <span className="text-[14px] sm:text-[16px] whitespace-nowrap">
        <strong className={`font-bold ${sombre ? 'text-white' : 'text-ink'}`}>{REVIEW_RATING}/5</strong>
        <span className="hidden min-[360px]:inline"> · {REVIEW_COUNT} avis vérifiés</span>
        <span className="min-[360px]:hidden"> · {REVIEW_COUNT} avis</span>
      </span>
      <span className={`flex items-center gap-0.5 text-[13px] sm:text-[15px] font-semibold whitespace-nowrap ${sombre ? 'text-brand-200' : 'text-brand-700'}`}>
        <span className="hidden sm:inline">Voir les avis</span>
        <span className="sm:hidden">Voir</span>
        <ChevronRight size={15} className="flex-shrink-0" />
      </span>
    </button>
  )
}
