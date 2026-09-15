import type { Product } from '@/types/database'

/** Identifiant du pixel Meta, fourni par le client. */
export const META_PIXEL_ID = '927345626636466'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

/**
 * Point de passage unique vers le pixel.
 *
 * Tout le suivi publicitaire transite par ici : le jour où le bandeau de
 * consentement sera en place, il suffira d'ajouter la vérification à cet
 * endroit pour couper l'ensemble des événements d'un coup.
 */
function send(...args: unknown[]): boolean {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return false
  window.fbq(...args)
  return true
}

/** Paramètres produit attendus par Meta, identiques pour tous les événements. */
function productPayload(product: Product, quantity = 1) {
  return {
    content_type: 'product',
    content_ids: [product.variantId ?? product.slug],
    content_name: product.name,
    content_category: product.category?.name ?? product.family,
    value: Number((product.price * quantity).toFixed(2)),
    currency: 'EUR',
    contents: [
      {
        id: product.variantId ?? product.slug,
        quantity,
        item_price: product.price,
      },
    ],
  }
}

/** Ouverture d'une fiche produit. */
export function trackViewContent(product: Product): boolean {
  return send('track', 'ViewContent', productPayload(product))
}

/** Clic sur « Commander » : dernier signal mesurable avant le checkout externe. */
export function trackAddToCart(product: Product, quantity: number): boolean {
  return send('track', 'AddToCart', productPayload(product, quantity))
}

/**
 * Délai laissé au pixel pour partir avant une redirection.
 *
 * fbq envoie sa requête de façon asynchrone ; une navigation immédiate
 * l'annule et l'événement n'arrive jamais chez Meta. C'est précisément le
 * cas ici, puisque « Commander » quitte le site dans la foulée — sans cette
 * pause, l'audience « panier abandonné » resterait vide.
 */
export const REDIRECT_DELAY_MS = 350

/** Déclenche l'événement, puis redirige une fois le pixel parti. */
export function trackAddToCartThenRedirect(product: Product, quantity: number, url: string): void {
  const sent = trackAddToCart(product, quantity)
  if (!sent) {
    window.location.href = url
    return
  }
  window.setTimeout(() => {
    window.location.href = url
  }, REDIRECT_DELAY_MS)
}
