/**
 * Pixel Meta du partenaire Burban — totalement indépendant de bois-tresor.
 *
 * Ce module ne partage RIEN avec `lib/analytics/meta.ts` : ni l'identifiant
 * de pixel, ni l'API Conversions, ni le point d'envoi. Il ne tourne que sur
 * les pages du checkout partenaire, où le pixel de bois-tresor ne se charge
 * pas. Une vente Burban part chez Burban, et chez lui seulement.
 *
 * Chaque envoi vise le pixel par son identifiant (`trackSingle`), de sorte
 * que même si un autre pixel se trouvait sur la page, l'événement
 * n'atteindrait que Burban.
 *
 * Côté navigateur uniquement. L'API Conversions serveur de Burban
 * demanderait son propre jeton, qui n'a pas été fourni.
 */

const BURBAN_PIXEL_ID = '1635910154593656'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    _fbq?: unknown
  }
}

let initialise = false

/**
 * Charge le pixel Burban et compte la vue, une seule fois.
 *
 * Réinjecter le chargeur à chaque appel créerait plusieurs scripts ; le
 * garde-fou l'évite. `init` est idempotent côté Meta.
 */
export function chargerPixelBurban(): void {
  if (typeof window === 'undefined' || initialise) return
  initialise = true

  if (typeof window.fbq !== 'function') {
    /* Chargeur standard du pixel, identique à celui de Meta, mais isolé.
       Écrit en `any` local : la file d'attente du pixel s'attache des
       propriétés sur une fonction, ce que le typage strict refuse. */
    /* eslint-disable @typescript-eslint/no-explicit-any */
    ;(function (f: any, b: Document, e: string, v: string) {
      if (f.fbq) return
      const n: any = (f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
      })
      if (!f._fbq) f._fbq = n
      n.push = n
      n.loaded = true
      n.version = '2.0'
      n.queue = []
      const t = b.createElement(e) as HTMLScriptElement
      t.async = true
      t.src = v
      const s = b.getElementsByTagName(e)[0]
      s.parentNode?.insertBefore(t, s)
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }

  window.fbq?.('init', BURBAN_PIXEL_ID)
  window.fbq?.('trackSingle', BURBAN_PIXEL_ID, 'PageView')
}

/** Attend que le pixel réponde, sans jamais bloquer. */
export function attendreBurban(delaiMaxMs = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false)
    if (typeof window.fbq === 'function') return resolve(true)
    const debut = Date.now()
    const timer = window.setInterval(() => {
      if (typeof window.fbq === 'function') {
        window.clearInterval(timer)
        resolve(true)
      } else if (Date.now() - debut > delaiMaxMs) {
        window.clearInterval(timer)
        resolve(false)
      }
    }, 150)
  })
}

/** Envoie un événement au seul pixel Burban. */
export function trackBurban(
  nom: 'InitiateCheckout' | 'AddPaymentInfo' | 'Purchase',
  donnees: Record<string, unknown>,
  eventId?: string,
): void {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
  window.fbq(
    'trackSingle',
    BURBAN_PIXEL_ID,
    nom,
    donnees,
    eventId ? { eventID: eventId } : undefined,
  )
}

/** Mise en forme du produit, aux champs attendus par Meta. */
export function produitBurban(slug: string, nom: string, montant: number) {
  return {
    content_type: 'product',
    content_ids: [slug],
    content_name: nom,
    value: Number(montant.toFixed(2)),
    currency: 'EUR',
  }
}
