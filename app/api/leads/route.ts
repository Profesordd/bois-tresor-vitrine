import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { estUnRobot } from '@/lib/analytics/geo'

/**
 * Adresse laissée au moment du clic sur « Commander ».
 *
 * Le paiement se fait sur un domaine tiers où nous n'exécutons aucun code.
 * Une fois le visiteur parti, il est hors de portée : s'il abandonne, il
 * ne reste rien pour le recontacter. Cette route est le seul endroit où
 * l'on peut encore le joindre.
 *
 * Écrit avec la clé service_role : la table `leads` est fermée au
 * navigateur (RLS sans policy), personne ne peut donc lire les adresses
 * des autres visiteurs.
 *
 * ⚠️ Cette route ne doit jamais empêcher une vente. Elle répond toujours
 * 204, même sur erreur, et le client redirige vers le paiement sans
 * attendre sa réponse. Un e-mail perdu coûte un lead ; une redirection
 * bloquée coûte une commande.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
/* Volontairement permissif : un rejet injustifié ferait perdre le lead et,
   pire, retiendrait quelqu'un qui voulait payer. Le but est d'écarter la
   saisie manifestement absente, pas de valider la boîte aux lettres. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i

function str(v: unknown, max: number): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim().slice(0, max) : null
}

export async function POST(req: NextRequest) {
  try {
    if (estUnRobot(req.headers.get('user-agent'))) {
      return new NextResponse(null, { status: 204 })
    }

    const payload = await req.json().catch(() => null)
    const email = str(payload?.email, 200)
    if (!email || !EMAIL_RE.test(email)) {
      return new NextResponse(null, { status: 204 })
    }

    /* Pays déduit de l'IP par Vercel. L'adresse elle-même n'est jamais
       enregistrée, comme pour la mesure d'audience. */
    const pays = (req.headers.get('x-vercel-ip-country') ?? '').toUpperCase().slice(0, 2) || null

    const sessionId = str(payload?.sessionId, 40)
    const montant = Number(payload?.montant)

    const supabase = createAdminClient()
    const { error } = await supabase.from('leads').insert({
      email: email.toLowerCase(),
      telephone: str(payload?.telephone, 40),
      consent: payload?.consent === true,
      produit_slug: str(payload?.produitSlug, 200),
      produit_nom: str(payload?.produitNom, 300),
      lot: str(payload?.lot, 80),
      montant: Number.isFinite(montant) && montant > 0 ? montant : null,
      session_id: sessionId && UUID_RE.test(sessionId) ? sessionId : null,
      utm_source: str(payload?.utmSource, 120),
      utm_medium: str(payload?.utmMedium, 120),
      utm_campaign: str(payload?.utmCampaign, 120),
      pays,
      appareil: ['mobile', 'tablet', 'desktop'].includes(payload?.appareil) ? payload.appareil : null,
    })

    if (error) console.error('[leads] insertion impossible', error.message)
  } catch {
    /* Silencieux par construction : voir l'en-tête. */
  }

  return new NextResponse(null, { status: 204 })
}
