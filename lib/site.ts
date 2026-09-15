/**
 * Constantes d'affichage partagées — un seul endroit pour la politique de
 * livraison et le contact, afin que le message ne diverge pas d'une page à l'autre.
 */

/** Seuil de livraison offerte, en euros. */
export const FREE_SHIPPING_THRESHOLD = 89

export const SHIPPING_LABEL = 'Livraison offerte dès 89 € d’achat'
export const SHIPPING_SHORT = 'Livraison offerte dès 89 €'

export const CONTACT_EMAIL = 'contact@bois-tresor.com'
export const CONTACT_HOURS = 'Lun – Ven · 9h – 18h'

/**
 * SIRET de l'entreprise, affiché tel quel. Source unique : il apparaît à la
 * fois sur les mentions légales et sur chaque fiche produit, et deux
 * écritures différentes du même numéro seraient lues comme une anomalie.
 */
export const SIRET = '844 733 964 00010'
