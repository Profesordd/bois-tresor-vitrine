import { Star } from 'lucide-react'
import { TESTIMONIALS, REVIEW_SUMMARY, REVIEWS_SOURCE, REVIEW_COUNT } from '@/lib/reviews'
import BoutonTousLesAvis from '@/components/avis/BoutonTousLesAvis'

interface Props {
  /** Nombre d'avis affichés sur la page ; les autres sont dans la fenêtre. */
  limit?: number
  title?: string
  /** Avis à écarter sur cette page (fragments de texte). */
  exclure?: string[]
  /** Fond coloré pleine largeur (accueil) ou fond transparent (fiche produit). */
  background?: boolean
}

/**
 * Bloc d'avis clients. Le même contenu sur l'accueil et sur les fiches
 * produit : le persona lit rarement la page d'accueil, il arrive par une
 * fiche produit ou une collection — la preuve sociale doit donc l'y attendre.
 */
export default function Testimonials({
  limit = 6,
  title = 'Ils nous font confiance',
  exclure = [],
  background = true,
}: Props) {
  const reviews = TESTIMONIALS.filter((t) => !exclure.some((mot) => t.text.includes(mot))).slice(0, limit)

  return (
    <section className={background ? 'py-16 bg-brand-50' : ''}>
      <div className={background ? 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8' : ''}>
        <div className={background ? 'text-center mb-10' : 'mb-6'}>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink mb-2">{title}</h2>
          <p className="text-brand-700 font-medium">{REVIEW_SUMMARY}</p>
          <p className="text-[13px] text-gray-500 mt-1">
            Avis publiés sur {REVIEWS_SOURCE.nom} —{' '}
            <a href={REVIEWS_SOURCE.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-brand-700">
              voir la page
            </a>
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
          {reviews.map((t) => (
            <div key={t.name} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="flex gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={14} className="fill-brand-500 text-brand-500" />
                ))}
              </div>
              {t.title && <p className="font-semibold text-ink text-[15px] mb-1.5">{t.title}</p>}
              <p className="text-sm text-gray-700 leading-relaxed mb-4">{t.text}</p>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {t.initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink leading-tight">{t.name}</p>
                  {(t.city || t.date) && (
                    <p className="text-[12px] text-gray-500 leading-tight">
                      {[t.city, t.date].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Les six premiers sur la page, tous dans la fenêtre : un mur de
            quinze avis ne se lit pas, et repousse le reste de la page. */}
        {TESTIMONIALS.length > reviews.length && (
          <div className="mt-6 flex justify-center">
            <BoutonTousLesAvis total={REVIEW_COUNT} />
          </div>
        )}
      </div>
    </section>
  )
}
