/**
 * Source unique des avis clients.
 *
 * La note et le nombre d'avis sont affichés à plusieurs endroits (accueil,
 * fiches produit, bandeau). Les centraliser ici évite qu'un chiffre traîne,
 * différent d'une page à l'autre : pour le persona, une incohérence de ce
 * type est un signal d'arnaque.
 *
 * Règle : tout ce qui est écrit ici doit venir d'un vrai client. Les champs
 * facultatifs (ville, date, produit, note) ne sont affichés que s'ils sont
 * renseignés — mieux vaut un avis sans date qu'une date inventée.
 */

/** Note moyenne, telle qu'affichée (virgule française). */
export const REVIEW_RATING = '4,9'

/** Nombre d'avis, fourni par le client. */
export const REVIEW_COUNT = 244

/** « Excellent 4,9/5 · 244 avis vérifiés » */
export const REVIEW_SUMMARY = `Excellent ${REVIEW_RATING}/5 · ${REVIEW_COUNT} avis vérifiés`

/**
 * Répartition des notes, en pourcentage. Fournie par le client : elle doit
 * correspondre aux avis réellement reçus, et le total faire 100.
 */
export const REVIEW_DISTRIBUTION: Record<5 | 4 | 3 | 2 | 1, number> = {
  5: 92, 4: 6, 3: 1, 2: 1, 1: 0,
}

export interface Testimonial {
  initials: string
  name: string
  text: string
  /** Ville du client, si connue. */
  city?: string
  /** Date telle qu'elle doit s'afficher : « 14 septembre 2026 ». Jamais relative. */
  date?: string
  /** Produit commandé, si connu. */
  product?: string
  /** Note de 1 à 5. 5 par défaut. */
  rating?: 5 | 4 | 3 | 2 | 1
  /** Titre court de l'avis, si le client en a laissé un. */
  title?: string
}

/**
 * Avis repris du site en production du client (bois-tresor.com).
 *
 * À remplacer par les avis réels complets (ville, date, produit, note) dès
 * qu'ils sont fournis : la fenêtre des avis les affiche automatiquement.
 */
export const TESTIMONIALS: Testimonial[] = [
  { initials: 'PL', name: 'Pierre L.',    text: 'Livré en 5 jours, bois très sec et propre. Brûle parfaitement dans ma cheminée. Je recommande Bois Tresor.' },
  { initials: 'MD', name: 'Marie D.',     text: 'Les granulés sont de très bonne qualité, mon poêle fonctionne au top. Rapport qualité-prix imbattable.' },
  { initials: 'JB', name: 'Jean-Marc B.', text: 'Commande reçue en 4 jours, palette bien emballée. Le bois est sec et calibré. Deuxième commande chez eux.' },
  { initials: 'CR', name: 'Catherine R.', text: 'Bûches densifiées de qualité, faciles à stocker. Un peu plus cher qu’en grande surface mais la qualité est là.' },
  { initials: 'FM', name: 'François M.',  text: '3ème hiver avec Bois Tresor. Toujours la même qualité, toujours ponctuel. Les allume-feux sont top aussi.' },
  { initials: 'ST', name: 'Sophie T.',    text: 'Enfin un fournisseur sérieux avec du vrai bois français. Pas de surprises, tout est conforme à la description.' },
]

/** Couleurs des pastilles d'initiales, dans l'ordre d'affichage. */
export const AVATAR_COLORS = [
  'bg-brand-600', 'bg-amber-600', 'bg-sky-700', 'bg-rose-600', 'bg-teal-700', 'bg-violet-600',
]
