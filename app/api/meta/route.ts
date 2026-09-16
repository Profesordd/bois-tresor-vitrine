import { NextRequest, NextResponse } from 'next/server'
import { envoyerCapi, capiConfigure, type EvenementCapi } from '@/lib/analytics/capi'
import { estUnRobot } from '@/lib/analytics/geo'

/**
 * Relais vers l'API Conversions de Meta.
 *
 * Le navigateur signale ici l'événement qu'il vient d'envoyer au pixel, en
 * joignant l'identifiant partagé. Le serveur y ajoute ce que le navigateur
 * ne peut pas fournir de façon fiable — adresse IP publique, identifiant du
 * navigateur, cookies _fbp et _fbc — puis transmet à Meta.
 *
 * Meta rapproche les deux envois par la paire (nom d'événement, event_id)
 * et n'en compte qu'un seul.
 *
 * Répond toujours 204 : une mesure qui échoue ne doit jamais se voir côté
 * visiteur, ni retarder une redirection vers le paiement.
 */

const NOMS = ['PageView', 'ViewContent', 'AddToCart'] as const
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  try {
    if (!capiConfigure()) return new NextResponse(null, { status: 204 })

    /* Les robots ne sont pas des prospects : les envoyer à Meta dégraderait
       les audiences publicitaires. */
    const userAgent = req.headers.get('user-agent')
    if (estUnRobot(userAgent)) return new NextResponse(null, { status: 204 })

    const body = await req.json().catch(() => null)
    const nom = body?.nom
    const eventId = body?.eventId

    if (!NOMS.includes(nom) || typeof eventId !== 'string' || !UUID_RE.test(eventId)) {
      return new NextResponse(null, { status: 204 })
    }

    /* x-forwarded-for peut contenir une chaîne de relais : la première
       adresse est celle du visiteur. */
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null

    const evenement: EvenementCapi = {
      nom,
      eventId,
      url: typeof body.url === 'string' ? body.url.slice(0, 1000) : req.headers.get('referer') ?? '',
      horodatage: typeof body.horodatage === 'number' ? Math.floor(body.horodatage / 1000) : undefined,
      utilisateur: {
        ip,
        userAgent,
        fbp: req.cookies.get('_fbp')?.value ?? null,
        fbc: req.cookies.get('_fbc')?.value ?? null,
      },
      donnees: body.donnees && typeof body.donnees === 'object' ? body.donnees : undefined,
    }

    const res = await envoyerCapi([evenement])
    if (!res.ok) console.error('[meta/capi]', res.status, JSON.stringify(res.corps).slice(0, 300))

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('[meta/capi]', err)
    return new NextResponse(null, { status: 204 })
  }
}
