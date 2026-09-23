'use client'

import { useEffect } from 'react'
import { X, Star, MapPin, ShieldCheck } from 'lucide-react'
import { useAvisModal } from '@/stores/avis'
import {
  TESTIMONIALS, REVIEW_RATING, REVIEW_COUNT, REVIEW_DISTRIBUTION, AVATAR_COLORS,
} from '@/lib/reviews'

/** Les étoiles d'un avis, pleines jusqu'à `note`. */
function Etoiles({ note = 5, size = 15 }: { note?: number; size?: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${note} étoiles sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= note ? 'fill-brand-500 text-brand-500' : 'fill-gray-200 text-gray-200'}
        />
      ))}
    </span>
  )
}

/**
 * Tous les avis, dans une fenêtre.
 *
 * Ouverte depuis les étoiles, partout où elles apparaissent. Sous le nom de
 * Bois Tresor : aucune marque tierce, aucun badge de vérification que nous
 * ne pouvons pas justifier. Les champs facultatifs (ville, date, produit)
 * ne s'affichent que s'ils existent — une date inventée se repère, et c'est
 * exactement ce qui fait fuir ce public.
 */
export default function AvisModal() {
  const { isOpen, close } = useAvisModal()

  useEffect(() => {
    if (!isOpen) return
    const precedent = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = precedent
    }
  }, [isOpen, close])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Avis clients"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col"
      >
        {/* ── En-tête : la note, toujours visible ── */}
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-gray-200">
          <div className="min-w-0">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink">Avis de nos clients</h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Etoiles size={18} />
              <span className="text-[15px] text-gray-700">
                <strong className="font-semibold text-ink">{REVIEW_RATING}/5</strong> · {REVIEW_COUNT} avis
              </span>
            </div>
            <p className="flex items-center gap-1.5 text-[13px] text-gray-500 mt-1.5">
              <ShieldCheck size={14} className="text-brand-600 flex-shrink-0" />
              Avis de clients ayant commandé chez nous
            </p>
          </div>
          <button
            onClick={close}
            aria-label="Fermer"
            className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5">
          {/* ── Répartition ── */}
          <div className="rounded-lg border border-gray-200 p-4 space-y-1.5">
            {([5, 4, 3, 2, 1] as const).map((n) => (
              <div key={n} className="flex items-center gap-3 text-[13px]">
                <span className="w-14 flex-shrink-0 text-gray-600">{n} étoile{n > 1 ? 's' : ''}</span>
                <span className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <span
                    className="block h-full rounded-full bg-brand-500"
                    style={{ width: `${REVIEW_DISTRIBUTION[n]}%` }}
                  />
                </span>
                <span className="w-10 flex-shrink-0 text-right text-gray-500">{REVIEW_DISTRIBUTION[n]} %</span>
              </div>
            ))}
          </div>

          {/* ── Les avis ── */}
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wider text-gray-500 mb-3">
              Les derniers avis reçus
            </p>
            <div className="space-y-3">
              {TESTIMONIALS.map((t, i) => (
                <article key={t.name} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-10 h-10 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} text-white text-[13px] font-bold flex items-center justify-center flex-shrink-0`}
                    >
                      {t.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink text-[15px] leading-tight">{t.name}</p>
                      {(t.city || t.date) && (
                        <p className="flex items-center gap-1.5 text-[12px] text-gray-500 mt-0.5">
                          {t.city && (<><MapPin size={12} className="flex-shrink-0" />{t.city}</>)}
                          {t.city && t.date && <span aria-hidden>·</span>}
                          {t.date}
                        </p>
                      )}
                    </div>
                    <Etoiles note={t.rating ?? 5} size={14} />
                  </div>

                  {t.title && <p className="font-semibold text-ink text-[15px] mt-3">{t.title}</p>}
                  <p className="text-[15px] text-gray-700 leading-relaxed mt-2">{t.text}</p>
                  {t.product && (
                    <p className="text-[12px] text-gray-500 mt-2.5">Produit commandé : {t.product}</p>
                  )}
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-4">
          <button
            onClick={close}
            className="w-full py-3 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold transition-colors"
          >
            Revenir au site
          </button>
        </div>
      </div>
    </div>
  )
}
