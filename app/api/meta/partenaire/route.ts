import { NextRequest, NextResponse } from 'next/server'
import { capiBurbanConfigure, envoyerCapiBurban } from '@/lib/analytics/burban-capi'
import { BURBAN_PIXEL_ID, estCheckoutPartenaire } from '@/lib/analytics/burban-config'
import { estUnRobot } from '@/lib/analytics/geo'
import { ADMIN_COOKIE, verifyToken } from '@/lib/admin/session'

const NOMS = ['PageView', 'InitiateCheckout', 'AddPaymentInfo'] as const
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Diagnostic sans envoi par défaut ; ?tester=1 envoie seulement une vue. */
export async function GET(req: NextRequest) {
  if (!await verifyToken(req.cookies.get(ADMIN_COOKIE)?.value, process.env.ADMIN_SESSION_SECRET ?? '')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const configure = capiBurbanConfigure()
  const res = configure && req.nextUrl.searchParams.get('tester') === '1'
    ? await envoyerCapiBurban([{
      nom: 'PageView', eventId: crypto.randomUUID(),
      url: `${req.nextUrl.origin}/commande/partenaire/`,
      utilisateur: {
        ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: req.headers.get('user-agent'),
      },
    }]) : undefined
  return NextResponse.json({ configure, pixelId: BURBAN_PIXEL_ID, reponseMeta: res })
}

/** Relais exclusif au checkout partenaire. Purchase vient du paiement vérifié. */
export async function POST(req: NextRequest) {
  const vide = () => new NextResponse(null, { status: 204 })
  try {
    if (!capiBurbanConfigure() || estUnRobot(req.headers.get('user-agent'))) return vide()
    if (req.headers.get('origin') && req.headers.get('origin') !== req.nextUrl.origin) return vide()
    const body = await req.json().catch(() => null)
    if (!NOMS.includes(body?.nom) || !UUID_RE.test(body?.eventId ?? '')) return vide()
    if (typeof body.url !== 'string' || !estCheckoutPartenaire(body.url)) return vide()
    if (new URL(body.url).origin !== req.nextUrl.origin) return vide()
    const referer = req.headers.get('referer')
    if (referer && !estCheckoutPartenaire(referer)) return vide()
    const res = await envoyerCapiBurban([{
      nom: body.nom, eventId: body.eventId, url: body.url.slice(0, 1000),
      utilisateur: {
        ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: req.headers.get('user-agent'),
        fbp: req.cookies.get('_fbp')?.value,
        fbc: req.cookies.get('_fbc')?.value,
      },
      donnees: body.donnees && typeof body.donnees === 'object' ? body.donnees : undefined,
    }])
    if (!res.ok) console.error('[partenaire/capi]', res.status)
  } catch {
    console.error('[partenaire/capi] Relais impossible')
  }
  return vide()
}
