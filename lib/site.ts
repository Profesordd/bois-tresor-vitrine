/**
 * Constantes d'affichage partagées — un seul endroit pour la politique de
 * livraison et le contact, afin que le message ne diverge pas d'une page à l'autre.
 */

/**
 * Livraison offerte sur tout, sans seuil, en France métropolitaine, en
 * Belgique et en Suisse (décision du 20/09/2026, avec l'arrivée des lots
 * de granulés à moins de 89 €). Il n'existe plus de montant minimum : ne
 * pas en réintroduire un dans un texte sans le remettre ici.
 */
export const SHIPPING_LABEL = 'Livraison offerte'
export const SHIPPING_ZONE  = 'en France métropolitaine, en Belgique, en Suisse et au Luxembourg'

/**
 * Deux canaux de contact, deux boîtes (décision du 22/09/2026). Le site
 * n'envoie plus rien lui-même : chaque carte de la page Contact ouvre la
 * messagerie du visiteur vers la bonne adresse.
 *   - avant-vente : questions avant d'acheter → contact@ (boîte du gérant)
 *   - après-vente : commande, livraison, retour → support externe
 * Les libellés évitent « SAV » : pour ce public, « J'ai déjà commandé »
 * parle, « service après-vente » évoque un numéro surtaxé.
 */
export const CONTACT_EMAIL = 'contact@bois-tresor.com'
export const APRES_VENTE_EMAIL = 'help+paiementzen@thesupport.care'

export interface Canal {
  id: 'avant-vente' | 'apres-vente'
  titre: string
  description: string
  email: string
  objet: string
  corps?: string
}

export const CANAUX: Canal[] = [
  {
    id: 'avant-vente',
    titre: 'Je n’ai pas encore commandé',
    description: 'Une question avant d’acheter : livraison chez moi, quel lot choisir, le bois, le paiement…',
    email: CONTACT_EMAIL,
    objet: 'Question avant de commander',
  },
  {
    id: 'apres-vente',
    titre: 'J’ai déjà commandé',
    description: 'Livraison, suivi, facture, ou un problème avec ma commande.',
    email: APRES_VENTE_EMAIL,
    objet: 'Ma commande',
    corps: 'Numéro de commande (commence par BA) : \n\nMa question : \n',
  },
]
export const CONTACT_HOURS = 'Lun – Ven · 9h – 18h'

/**
 * SIRET de l'entreprise, affiché tel quel. Source unique : il apparaît à la
 * fois sur les mentions légales et sur chaque fiche produit, et deux
 * écritures différentes du même numéro seraient lues comme une anomalie.
 */
export const SIRET = '844 733 964 00010'
/** SIREN = les 9 premiers chiffres du SIRET ; sert au lien vers l'annuaire officiel. */
export const SIREN = '844733964'
/** Clé 80 vérifiée : (12 + 3 × (SIREN mod 97)) mod 97. */
export const TVA_INTRACOM = 'FR80 844 733 964'
export const ADRESSE_SIEGE = { rue: '380 Route du Moulin', ville: '13100 Aix-en-Provence', pays: 'France' }
/** Fiche publique de l'entreprise : le client peut vérifier lui-même. */
export const ANNUAIRE_URL = `https://annuaire-entreprises.data.gouv.fr/entreprise/${SIREN}`
