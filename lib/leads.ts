import { getSession } from '@/lib/analytics/track'
import type { Product } from '@/types/database'

/**
 * Envoi de l'adresse laissée avant le paiement.
 *
 * ⚠️ Le slash final n'est pas décoratif : le site tourne en
 * `trailingSlash: true`, et `/api/leads` sans slash renvoie une 308 que
 * `sendBeacon` ne suit pas. L'envoi disparaîtrait sans la moindre erreur.
 */
const ENDPOINT = '/api/leads/'

export interface Lead {
  email: string
  telephone?: string
  consent: boolean
}

/**
 * Enregistre le lead et rend la main immédiatement.
 *
 * Rien n'est attendu : la redirection vers le paiement part juste après.
 * `sendBeacon` est le seul transport qui survit au changement de page, ce
 * qui est précisément ce qui se produit ici.
 */
export function enregistrerLead(lead: Lead, product: Product, montant: number): void {
  if (typeof window === 'undefined') return

  const { id, context } = getSession()
  const body = JSON.stringify({
    email: lead.email,
    telephone: lead.telephone || null,
    consent: lead.consent,
    produitSlug: product.slug,
    produitNom: product.name,
    lot: product.lot?.id ?? null,
    montant,
    sessionId: id || null,
    utmSource: context?.utmSource ?? null,
    utmMedium: context?.utmMedium ?? null,
    utmCampaign: context?.utmCampaign ?? null,
    appareil: context?.device ?? null,
  })

  try {
    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }))
      if (ok) return
    }
  } catch {
    /* on retombe sur fetch */
  }

  void fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    /* Un lead perdu ne doit jamais retenir une vente. */
  })
}
