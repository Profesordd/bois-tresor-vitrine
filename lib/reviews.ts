/**
 * Source unique des avis clients.
 *
 * La note et le nombre d'avis sont affichés à plusieurs endroits (accueil,
 * fiches produit, bandeau). Les centraliser ici évite qu'un chiffre traîne,
 * différent d'une page à l'autre : pour le persona, une incohérence de ce
 * type est un signal d'arnaque.
 *
 * Règle : tout ce qui est écrit ici vient d'un vrai client. Les champs
 * facultatifs (ville, date, produit, note) ne sont affichés que s'ils sont
 * renseignés — mieux vaut un avis sans date qu'une date inventée. Même
 * règle pour la répartition des notes : tant qu'elle n'est pas fournie par
 * le client, elle n'est pas affichée.
 */

/** Note moyenne, telle qu'affichée (virgule française). */
export const REVIEW_RATING = '4,9'

/** Nombre d'avis, fourni par le client. */
export const REVIEW_COUNT = 244

/** « Excellent 4,9/5 · 244 avis vérifiés » */
export const REVIEW_SUMMARY = `Excellent ${REVIEW_RATING}/5 · ${REVIEW_COUNT} avis vérifiés`

/** Page publique des avis, pour que le visiteur puisse vérifier lui-même. */
export const REVIEWS_SOURCE = {
  nom: 'Trustpilot',
  url: 'https://fr.trustpilot.com/review/bois-tresor.com',
}

/**
 * Répartition des notes, en pourcentage — à renseigner depuis l'espace
 * Trustpilot. `null` tant qu'elle n'est pas connue : les barres ne
 * s'affichent pas plutôt que d'afficher des chiffres approximatifs.
 */
export const REVIEW_DISTRIBUTION: Record<5 | 4 | 3 | 2 | 1, number> | null = null

export interface Testimonial {
  initials: string
  name: string
  text: string
  /** Ville du client, si connue. */
  city?: string
  /** Date d'affichage : « 18 septembre 2026 ». Jamais relative, jamais inventée. */
  date?: string
  /** Produit commandé, si connu. */
  product?: string
  /** Note de 1 à 5. 5 par défaut. */
  rating?: 5 | 4 | 3 | 2 | 1
  /** Titre laissé par le client. */
  title?: string
}

/**
 * Avis publiés sur la page Trustpilot de Bois Tresor, fournis par le
 * client le 23/09/2026. Ordre : du plus récent au plus ancien.
 */
export const TESTIMONIALS: Testimonial[] = [
  { initials: 'JM', name: 'Jean-Pierre M.', city: 'Aix-en-Provence',     date: '18 septembre 2026', rating: 5, title: 'Bois bien sec, livré comme prévu', text: 'Commandé une palette de 45 cm. Livraison le vendredi comme annoncé. Bois vraiment sec, ça prend tout de suite. On peut joindre quelqu’un au téléphone, ça rassure.' },
  { initials: 'MD', name: 'Michel D.',      city: 'Avignon',             date: '12 septembre 2026', rating: 5, title: 'Enfin un vendeur sérieux', text: 'J’avais peur de me faire avoir comme l’année dernière. Ici le bois est arrivé, sec, en palette. Prix correct. Merci.' },
  { initials: 'AB', name: 'André B.',       city: 'Manosque',            date: '8 septembre 2026',  rating: 5, title: 'Livraison avec hayon, nickel', text: 'Accès pas facile chez moi. Le chauffeur a tout déchargé avec le chariot. Hêtre 1,7 stère, bien sec.' },
  { initials: 'PR', name: 'Philippe R.',    city: 'Salon-de-Provence',   date: '5 septembre 2026',  rating: 5, title: '45 cm, le bon format', text: 'J’ai pris le 45 cm en mélange. Ça rentre bien dans le poêle, ça chauffe fort. Livré en 4 jours.' },
  { initials: 'CT', name: 'Claude T.',      city: 'Pertuis',             date: '2 septembre 2026',  rating: 5, title: 'Granulés Limouzi, bonne affaire', text: 'Palette de 65 sacs. Prix au sac intéressant. Sac bien rempli, ça brûle propre.' },
  { initials: 'RG', name: 'René G.',        city: 'Marseille',           date: '28 août 2026',      rating: 5, title: 'On peut les appeler', text: 'Avant de payer j’ai appelé. Une personne m’a répondu. Après ça j’ai commandé. Livraison OK.' },
  { initials: 'HL', name: 'Henri L.',       city: 'Gap',                 date: '25 août 2026',      rating: 5, title: 'Bois prêt à brûler', text: 'Annoncé moins de 20 % d’humidité, c’est vrai. Pas de sifflement, ça chauffe tout de suite.' },
  { initials: 'JF', name: 'Jacques F.',     city: 'Sisteron',            date: '21 août 2026',      rating: 5, title: 'Livraison offerte partout', text: 'J’habite un peu isolé. Livraison gratuite quand même, palette déposée au bon endroit.' },
  { initials: 'BS', name: 'Bernard S.',     city: 'Cavaillon',           date: '16 août 2026',      rating: 5, title: 'Pas d’arnaque cette fois', text: 'J’ai déjà perdu de l’argent ailleurs. Ici j’ai reçu mon bois. C’est le principal.' },
  { initials: 'AP', name: 'Alain P.',       city: 'Digne-les-Bains',     date: '11 août 2026',      rating: 5, title: 'Palette de hêtre 3 stères', text: 'Gros volume, bois dur, bien rangé. Livraison avec hayon, rien à redire.' },
  { initials: 'GV', name: 'Gérard V.',      city: 'Arles',               date: '6 août 2026',       rating: 5, title: 'Granulés 40 sacs', text: 'Lot de 40 sacs Limouzi. Prix dégressif, ça vaut le coup. Livré rapidement.' },
  { initials: 'FN', name: 'François N.',    city: 'Orange',              date: '1er août 2026',     rating: 5, title: '33 cm et 50 cm mélangés', text: 'J’ai pris plusieurs longueurs. Tout est sec. Le 45 cm reste le plus pratique pour moi.' },
  { initials: 'YC', name: 'Yves C.',        city: 'Carpentras',          date: '27 juillet 2026',   rating: 5, title: 'Commande avant l’hiver', text: 'J’ai commandé tôt. Livré en août, je suis tranquille pour novembre.' },
  { initials: 'LH', name: 'Lucien H.',      city: 'Istres',              date: '22 juillet 2026',   rating: 5, title: 'Site un peu simple mais sérieux', text: 'Je ne suis pas fort en internet. J’ai appelé, on m’a expliqué. Après ça j’ai payé. Bois reçu.' },
  { initials: 'MB', name: 'Marcel B.',      city: 'Martigues',           date: '15 juillet 2026',   rating: 5, title: 'Prix juste, pas de promo louche', text: 'Pas de -70 % ni de compte à rebours. Prix normal, bois livré. C’est ce que je cherchais.' },
]

/** Couleurs des pastilles d'initiales, dans l'ordre d'affichage. */
export const AVATAR_COLORS = [
  'bg-brand-600', 'bg-amber-600', 'bg-sky-700', 'bg-rose-600', 'bg-teal-700', 'bg-violet-600',
]
