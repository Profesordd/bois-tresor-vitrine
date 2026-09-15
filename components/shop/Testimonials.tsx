import { Star } from 'lucide-react'
import { TESTIMONIALS, REVIEW_SUMMARY } from '@/lib/reviews'

interface Props {
  /** Nombre d'avis affichés (6 sur l'accueil, 3 sur une fiche produit). */
  limit?: number
  title?: string
  /** Fond coloré pleine largeur (accueil) ou fond transparent (fiche produit). */
  background?: boolean
}

/**
 * Bloc d'avis clients. Le même contenu sur l'accueil et sur les fiches
 * produit : le persona lit rarement la page d'accueil, il arrive par une
 * fiche produit ou une collection — la preuve sociale doit donc l'y attendre.
 */
export default function Testimonials({
  limit = TESTIMONIALS.length,
  title = 'Ils nous font confiance',
  background = true,
}: Props) {
  const reviews = TESTIMONIALS.slice(0, limit)

  return (
    <section className={background ? 'py-16 bg-brand-50' : ''}>
      <div className={background ? 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8' : ''}>
        <div className={background ? 'text-center mb-10' : 'mb-6'}>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink mb-2">{title}</h2>
          <p className="text-brand-700 font-medium">{REVIEW_SUMMARY}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((t) => (
            <div key={t.name} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="flex gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={14} className="fill-brand-500 text-brand-500" />
                ))}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-4">{t.text}</p>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {t.initials}
                </div>
                <span className="text-sm font-semibold text-ink">{t.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
