'use client'

import { Star } from 'lucide-react'
import { REVIEW_RATING, REVIEW_COUNT } from '@/lib/reviews'
import { useAvisModal } from '@/stores/avis'

interface Props {
  /** 'light' : sur fond clair. 'dark' : sur photo ou fond sombre. */
  tone?: 'light' | 'dark'
  size?: number
  className?: string
}

/**
 * Les 5 étoiles + la note + le nombre d'avis. Affiché sur chaque fiche
 * produit, juste sous le titre : le persona cherche la preuve que d'autres
 * ont acheté avant lui avant même de regarder le prix.
 *
 * Cliquable : ouvre la fenêtre des avis. Un chiffre qu'on ne peut pas
 * vérifier vaut moins qu'un chiffre qu'on peut ouvrir.
 */
export default function StarRating({ tone = 'light', size = 16, className = '' }: Props) {
  const { open } = useAvisModal()
  const starColor = tone === 'dark' ? 'fill-brand-400 text-brand-400' : 'fill-brand-500 text-brand-500'
  const textColor = tone === 'dark' ? 'text-gray-200' : 'text-gray-700'

  return (
    <button
      onClick={open}
      data-track="Voir les avis (étoiles)"
      className={`flex items-center gap-2 text-left ${textColor} ${className}`}
    >
      <span className="flex gap-0.5 flex-shrink-0">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={size} className={starColor} />
        ))}
      </span>
      <span className="text-[15px]">
        <strong className="font-semibold">{REVIEW_RATING}/5</strong>
        {' · '}
        <span className="underline decoration-dotted underline-offset-2">{REVIEW_COUNT} avis vérifiés</span>
      </span>
    </button>
  )
}
