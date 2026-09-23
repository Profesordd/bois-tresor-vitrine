/**
 * Widgets officiels Trustpilot (TrustBox).
 *
 * Le client dispose d'un abonnement Trustpilot Business : on affiche donc
 * les vrais avis, par leur widget officiel, et non une reproduction. Le
 * visiteur peut cliquer et vérifier sur trustpilot.com — c'est précisément
 * ce qui rend la preuve utile pour un acheteur méfiant.
 *
 * Tant que `NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID` est vide, rien ne
 * s'affiche et le site retombe sur la note maison (`BandeauAvis`,
 * `StarRating`, `AvisModal`) : aucune page ne casse.
 *
 * Les identifiants de gabarit ci-dessous doivent être repris tels quels du
 * code que Trustpilot fournit (Trustpilot Business → Intégrations →
 * TrustBox → choisir le widget → « Obtenir le code »). Ne jamais les
 * deviner : un mauvais identifiant affiche un cadre vide.
 */

export const TRUSTPILOT_BUSINESS_UNIT_ID =
  process.env.NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID ?? ''

/** Domaine tel qu'il est enregistré chez Trustpilot. */
export const TRUSTPILOT_DOMAIN =
  process.env.NEXT_PUBLIC_TRUSTPILOT_DOMAIN ?? 'bois-tresor.com'

export const TRUSTPILOT_LOCALE = 'fr-FR'

/** Lien vers la page publique : c'est lui qui rend la note vérifiable. */
export const TRUSTPILOT_URL = `https://fr.trustpilot.com/review/${TRUSTPILOT_DOMAIN}`

export function trustpilotActif(): boolean {
  return TRUSTPILOT_BUSINESS_UNIT_ID.length > 0
}

/**
 * Gabarits utilisés sur le site. Chaque valeur est le `data-template-id` du
 * code fourni par Trustpilot, et la hauteur celle qu'ils indiquent.
 * À compléter à partir du code d'intégration, widget par widget.
 */
export interface TrustBoxGabarit {
  templateId: string
  hauteur: string
  /** Widgets qui affichent des avis entiers plutôt qu'une simple note. */
  large?: boolean
}

export const TRUSTBOX: Record<'note' | 'bandeau' | 'carrousel' | 'grille', TrustBoxGabarit> = {
  /** Étoiles + note, sous un titre de fiche produit. */
  note:      { templateId: process.env.NEXT_PUBLIC_TRUSTPILOT_TPL_NOTE      ?? '', hauteur: '24px' },
  /** Bandeau horizontal, en tête de collection. */
  bandeau:   { templateId: process.env.NEXT_PUBLIC_TRUSTPILOT_TPL_BANDEAU   ?? '', hauteur: '28px' },
  /** Avis qui défilent, en bas de fiche. */
  carrousel: { templateId: process.env.NEXT_PUBLIC_TRUSTPILOT_TPL_CARROUSEL ?? '', hauteur: '140px', large: true },
  /** Grille d'avis, pour l'accueil. */
  grille:    { templateId: process.env.NEXT_PUBLIC_TRUSTPILOT_TPL_GRILLE    ?? '', hauteur: '350px', large: true },
}
