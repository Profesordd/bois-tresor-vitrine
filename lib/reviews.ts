/**
 * Source unique des avis clients.
 *
 * La note et le nombre d'avis sont affichés à plusieurs endroits (accueil,
 * fiches produit, bandeau). Les centraliser ici évite qu'un chiffre traîne,
 * différent d'une page à l'autre : pour le persona, une incohérence de ce
 * type est un signal d'arnaque.
 */

/** Note moyenne, telle qu'affichée (virgule française). */
export const REVIEW_RATING = '4,9'

/** Nombre d'avis, fourni par le client. */
export const REVIEW_COUNT = 244

/** « Excellent 4,9/5 · 244 avis vérifiés » */
export const REVIEW_SUMMARY = `Excellent ${REVIEW_RATING}/5 · ${REVIEW_COUNT} avis vérifiés`

export interface Testimonial {
  initials: string
  name: string
  text: string
}

/** Avis repris du site en production du client (bois-tresor.com). */
export const TESTIMONIALS: Testimonial[] = [
  { initials: 'PL', name: 'Pierre L.',    text: 'Livré en 5 jours, bois très sec et propre. Brûle parfaitement dans ma cheminée. Je recommande Bois Tresor.' },
  { initials: 'MD', name: 'Marie D.',     text: 'Les granulés sont de très bonne qualité, mon poêle fonctionne au top. Rapport qualité-prix imbattable.' },
  { initials: 'JB', name: 'Jean-Marc B.', text: 'Commande reçue en 4 jours, palette bien emballée. Le bois est sec et calibré. Deuxième commande chez eux.' },
  { initials: 'CR', name: 'Catherine R.', text: 'Bûches densifiées de qualité, faciles à stocker. Un peu plus cher qu’en grande surface mais la qualité est là.' },
  { initials: 'FM', name: 'François M.',  text: '3ème hiver avec Bois Tresor. Toujours la même qualité, toujours ponctuel. Les allume-feux sont top aussi.' },
  { initials: 'ST', name: 'Sophie T.',    text: 'Enfin un fournisseur sérieux avec du vrai bois français. Pas de surprises, tout est conforme à la description.' },
]
