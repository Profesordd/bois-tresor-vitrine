import { envoyerCapi, type EvenementCapi } from '@/lib/analytics/capi'
import { envoyerCapiBurban } from '@/lib/analytics/burban-capi'

/** Le canal stocké en base décide du destinataire, jamais le navigateur. */
export async function envoyerAchatCapi(canal: string | null, evenement: EvenementCapi) {
  if (evenement.nom !== 'Purchase') return
  if (canal === 'site') return envoyerCapi([evenement])
  if (canal === 'partenaire') {
    const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.bois-tresor.com').replace(/\/$/, '')
    return envoyerCapiBurban([{ ...evenement, url: `${base}/commande/partenaire/retour/` }])
  }
}
