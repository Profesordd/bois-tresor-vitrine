import type { Product } from '@/types/database'

/** Identifiant du pixel Meta, fourni par le client. */
export const META_PIXEL_ID = '1637953797922220'

/** Le serveur relaie vers l'API Conversions ; slash final obligatoire,
 *  le site tourne en trailingSlash et sendBeacon ne suit pas les 308. */
const RELAIS = '/api/meta/'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

type NomEvenement = 'PageView' | 'ViewContent' | 'AddToCart'

function nouvelId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

/**
 * Envoi conjoint au pixel navigateur et à l'API Conversions.
 *
 * Les deux portent le même `eventId`. C'est la condition de la
 * déduplication : Meta rapproche les envois sur la paire (nom, event_id) et
 * n'en compte qu'un. Sans cet identifiant partagé, chaque événement serait
 * compté deux fois, et le coût par résultat des campagnes divisé par deux —
 * une optimisation faussée dans le mauvais sens.
 *
 * Le double envoi n'est pas une redondance inutile : le pixel seul est
 * perdu pour les visiteurs qui bloquent les traceurs, et l'API Conversions
 * seule ne voit pas ce que le navigateur sait faire.
 */
function envoyer(nom: NomEvenement, donnees?: Record<string, unknown>): boolean {
  if (typeof window === 'undefined') return false

  const eventId = nouvelId()
  let pixelOk = false

  if (typeof window.fbq === 'function') {
    window.fbq('track', nom, donnees ?? {}, { eventID: eventId })
    pixelOk = true
  }

  /* Le relais serveur part même si le pixel est bloqué : c'est précisément
     le cas où il est le plus utile. */
  const corps = JSON.stringify({
    nom,
    eventId,
    url: window.location.href,
    horodatage: Date.now(),
    donnees,
  })

  try {
    if (navigator.sendBeacon) {
      const envoye = navigator.sendBeacon(RELAIS, new Blob([corps], { type: 'application/json' }))
      if (envoye) return pixelOk
    }
  } catch {
    /* on retombe sur fetch */
  }

  void fetch(RELAIS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: corps,
    /* keepalive : la requête survit à la redirection vers le paiement. */
    keepalive: true,
  }).catch(() => {
    /* la mesure ne doit jamais gêner la navigation */
  })

  return pixelOk
}

/** Paramètres produit attendus par Meta, identiques pour tous les événements. */
function produit(product: Product, quantity = 1) {
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

/**
 * Attend que le script du pixel soit chargé, sans jamais bloquer.
 *
 * À utiliser avant un envoi, et non autour : chaque appel d'envoi tire un
 * nouvel identifiant et part aussi vers le serveur. Réessayer l'envoi
 * jusqu'à ce que le pixel réponde enverrait donc plusieurs événements
 * serveur pour une seule action.
 */
export function attendreLePixel(delaiMaxMs = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false)
    if (typeof window.fbq === 'function') return resolve(true)

    const debut = Date.now()
    const timer = window.setInterval(() => {
      if (typeof window.fbq === 'function') {
        window.clearInterval(timer)
        resolve(true)
      } else if (Date.now() - debut > delaiMaxMs) {
        /* Pixel bloqué ou indisponible : on n'attend pas davantage, l'envoi
           serveur partira seul. */
        window.clearInterval(timer)
        resolve(false)
      }
    }, 150)
  })
}

/** Arrivée sur une page. */
export function trackPageView(): boolean {
  return envoyer('PageView')
}

/** Ouverture d'une fiche produit. */
export function trackViewContent(product: Product): boolean {
  return envoyer('ViewContent', produit(product))
}

/** Clic sur « Commander » : dernier signal mesurable avant le checkout externe. */
export function trackAddToCart(product: Product, quantity: number): boolean {
  return envoyer('AddToCart', produit(product, quantity))
}

/**
 * Délai laissé aux deux envois pour partir avant une redirection.
 *
 * fbq envoie sa requête de façon asynchrone ; une navigation immédiate
 * l'annule et l'événement n'arrive jamais. C'est le cas ici, puisque
 * « Commander » quitte le site dans la foulée — sans cette pause, l'audience
 * « panier abandonné » resterait vide.
 */
export const REDIRECT_DELAY_MS = 350

/** Déclenche l'événement, puis redirige une fois les envois partis. */
export function trackAddToCartThenRedirect(product: Product, quantity: number, url: string): void {
  trackAddToCart(product, quantity)
  window.setTimeout(() => {
    window.location.href = url
  }, REDIRECT_DELAY_MS)
}
