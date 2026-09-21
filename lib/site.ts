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

export const CONTACT_EMAIL = 'contact@bois-tresor.com'
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
