import type { CartItem } from '@/types/database'

export const CHECKOUT_BASE_URL = 'https://checkout.paiementzen.com/'

/**
 * Construit l'URL de redirection vers le checkout.
 *
 * Le processeur de paiement n'accepte qu'une liste de prix unitaires fixes :
 * le prix réel d'une palette est obtenu en envoyant une quantité multipliée.
 * D'où la règle absolue : quantité envoyée = quantité choisie × multiplicateur
 * du produit. Envoyer la quantité brute facturerait le client au mauvais prix.
 */
export function buildCheckoutUrl(items: CartItem[]): string | null {
  const parts = items
    .filter(({ product }) => product.variantId && product.checkoutMultiplier)
    .map(({ product, quantity }) => `${product.variantId}:${quantity * product.checkoutMultiplier!}`)

  if (parts.length === 0) return null
  return `${CHECKOUT_BASE_URL}?products=${parts.join(',')}`
}

/** Articles du panier qui ne peuvent pas encore être réglés en ligne. */
export function getUnavailableItems(items: CartItem[]): CartItem[] {
  return items.filter(({ product }) => !product.variantId || !product.checkoutMultiplier)
}
