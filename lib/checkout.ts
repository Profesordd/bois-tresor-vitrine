import type { CartItem, Product } from '@/types/database'

/**
 * Limite de quantité par produit et par commande, fonction du prix :
 * une seule unité à partir de 100 €, deux en dessous. Le stock est réel et
 * limité ; la règle vit ici, et partout où l'on touche à la quantité
 * (fiche, tiroir, page commande, magasin) on passe par elle.
 */
export function maxParCommande(product: Pick<Product, 'price'>): number {
  return product.price >= 100 ? 1 : 2
}

/** Le même message partout : le client doit reconnaître la limite d'un écran à l'autre. */
export function messageLimite(max: number): string {
  return `Stock limité — ${max} max par commande`
}

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
