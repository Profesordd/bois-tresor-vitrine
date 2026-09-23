import { AVIS_FOURNIS, REVIEW_RATING, REVIEW_COUNT, AVATAR_COLORS } from '@/lib/reviews'
import { Star } from 'lucide-react'
import ApercuAvisInteractif from '@/components/avis/ApercuAvisInteractif'

/**
 * Page d'aperçu des avis, pour validation par le client.
 *
 * Elle n'est liée depuis aucune page et exclue des moteurs de recherche :
 * le client voulait juger la présentation sans que ses visiteurs la voient
 * pendant qu'on la met au point. Rien ici n'est visible du public.
 */
export const metadata = {
  title: 'Aperçu — présentation des avis',
  robots: { index: false, follow: false },
}

export default function ApercuAvisPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4 mb-10">
        <p className="font-bold text-ink">Page d’aperçu — non publiée</p>
        <p className="text-[15px] text-gray-700 mt-1 leading-snug">
          Cette page n’est liée depuis nulle part et n’est pas indexée. Vos visiteurs ne
          la voient pas. Elle sert à valider la présentation des 15 avis avant de la
          remettre sur les fiches et les collections.
        </p>
      </div>

      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink mb-1">
        Avis de nos clients
      </h1>
      <p className="flex items-center gap-2 text-gray-700 mb-8">
        <span className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} size={18} className="fill-brand-500 text-brand-500" />
          ))}
        </span>
        <span className="text-[15px]">
          <strong className="font-semibold text-ink">{REVIEW_RATING}/5</strong> · {REVIEW_COUNT} avis
        </span>
      </p>

      {/* ── Présentation 1 : en grille, comme sur une fiche produit ── */}
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-gray-500 mb-3">
        Présentation 1 — en grille sur la page
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 items-start mb-12">
        {AVIS_FOURNIS.slice(0, 6).map((t, i) => (
          <article key={t.name} className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
            <div className="flex gap-0.5 mb-2.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={14} className={s <= (t.rating ?? 5) ? 'fill-brand-500 text-brand-500' : 'fill-gray-200 text-gray-200'} />
              ))}
            </div>
            {t.title && <p className="font-semibold text-ink text-[15px] mb-1.5">{t.title}</p>}
            <p className="text-sm text-gray-700 leading-relaxed mb-4">{t.text}</p>
            <div className="flex items-center gap-2.5">
              <span className={`w-8 h-8 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}>
                {t.initials}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink leading-tight">{t.name}</span>
                <span className="block text-[12px] text-gray-500 leading-tight">
                  {[t.city, t.date].filter(Boolean).join(' · ')}
                </span>
              </span>
            </div>
          </article>
        ))}
      </div>

      {/* ── Présentation 2 : la fenêtre, tous les avis ── */}
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-gray-500 mb-3">
        Présentation 2 — la fenêtre, avec les 15 avis
      </h2>
      <ApercuAvisInteractif />
    </div>
  )
}
