import { createHash } from 'node:crypto'
import type { EvenementCapi } from '@/lib/analytics/capi'
import { BURBAN_PIXEL_ID, estCheckoutPartenaire } from '@/lib/analytics/burban-config'

/** Serveur uniquement. Aucun repli vers le jeton ou le pixel de Bois Trésor. */
export function capiBurbanConfigure(): boolean {
  return (process.env.BURBAN_META_CONVERSIONS_TOKEN?.length ?? 0) > 20
}

export async function envoyerCapiBurban(evenements: EvenementCapi[]) {
  const token = process.env.BURBAN_META_CONVERSIONS_TOKEN
  if (!token || !evenements.length || evenements.some(e => !estCheckoutPartenaire(e.url))) {
    return { ok: false, status: 0, corps: 'CAPI partenaire absente ou événement hors checkout partenaire' }
  }
  const data = evenements.map(e => ({
    event_name: e.nom,
    event_time: e.horodatage ?? Math.floor(Date.now() / 1000),
    event_id: e.eventId,
    event_source_url: e.url,
    action_source: 'website',
    user_data: {
      client_ip_address: e.utilisateur.ip ?? undefined,
      client_user_agent: e.utilisateur.userAgent ?? undefined,
      fbp: e.utilisateur.fbp ?? undefined,
      fbc: e.utilisateur.fbc ?? undefined,
      em: e.utilisateur.email?.trim()
        ? createHash('sha256').update(e.utilisateur.email.trim().toLowerCase()).digest('hex')
        : undefined,
    },
    custom_data: e.donnees,
  }))
  try {
    const version = process.env.META_GRAPH_VERSION ?? 'v23.0'
    const res = await fetch(`https://graph.facebook.com/${version}/${BURBAN_PIXEL_ID}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ data }),
    })
    return { ok: res.ok, status: res.status, corps: await res.json().catch(() => null) }
  } catch {
    // Ne jamais journaliser une requête contenant le jeton.
    return { ok: false, status: 0, corps: 'Envoi CAPI partenaire impossible' }
  }
}
