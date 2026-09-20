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
export const SHIPPING_ZONE  = 'en France métropolitaine, en Belgique et en Suisse'

export const CONTACT_EMAIL = 'contact@bois-tresor.com'
export const CONTACT_HOURS = 'Lun – Ven · 9h – 18h'

/**
 * SIRET de l'entreprise, affiché tel quel. Source unique : il apparaît à la
 * fois sur les mentions légales et sur chaque fiche produit, et deux
 * écritures différentes du même numéro seraient lues comme une anomalie.
 */
export const SIRET = '844 733 964 00010'
