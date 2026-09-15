import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { estUnRobot } from '@/lib/analytics/geo'

/**
 * Réception de la mesure d'audience.
 *
 * Écrit avec la clé service_role : les tables analytics sont fermées au
 * navigateur (RLS sans policy), personne ne peut donc lire les parcours
 * des autres visiteurs ni injecter de fausses données en masse.
 *
 * La route répond toujours 204, même en cas d'erreur : une mesure qui
 * échoue ne doit jamais se voir côté visiteur.
 */

const EVENT_TYPES = ['pageview', 'page_exit', 'click', 'form_field'] as const
const MAX_EVENTS = 40

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function str(v: unknown, max: number): string | null {
  return typeof v === 'string' && v.length > 0 ? v.slice(0, max) : null
}

function int(v: unknown, min: number, max: number): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null
  return Math.min(max, Math.max(min, Math.round(v)))
}

export async function POST(req: NextRequest) {
  try {
    /* Robots écartés dès l'entrée : les stocker fausserait le taux de
       conversion vers le bas et occuperait la base pour rien. */
    if (estUnRobot(req.headers.get('user-agent'))) {
      return new NextResponse(null, { status: 204 })
    }

    const payload = await req.json()
    const sessionId: unknown = payload?.sessionId

    if (typeof sessionId !== 'string' || !UUID_RE.test(sessionId)) {
      return new NextResponse(null, { status: 204 })
    }

    const rawEvents: unknown[] = Array.isArray(payload?.events) ? payload.events : []
    if (rawEvents.length === 0) return new NextResponse(null, { status: 204 })

    const events = rawEvents
      .slice(0, MAX_EVENTS)
      .filter(
        (e): e is Record<string, unknown> =>
          !!e &&
          typeof e === 'object' &&
          EVENT_TYPES.includes((e as Record<string, unknown>).type as never) &&
          typeof (e as Record<string, unknown>).path === 'string'
      )
    if (events.length === 0) return new NextResponse(null, { status: 204 })

    const supabase = createAdminClient()
    const ctx = payload?.context

    /* Pays déduit de l'IP par Vercel. Seul le code à deux lettres est
       conservé : l'adresse elle-même n'est jamais enregistrée. */
    const country = (req.headers.get('x-vercel-ip-country') ?? '').toUpperCase().slice(0, 2) || null

    /* Première requête de la visite : on crée la session avec son contexte
       d'arrivée. Les suivantes ne font que la prolonger. */
    if (ctx && typeof ctx === 'object') {
      await supabase.from('analytics_sessions').upsert(
        {
          id: sessionId,
          entry_path: str(ctx.entryPath, 300) ?? '/',
          referrer: str(ctx.referrer, 500),
          utm_source: str(ctx.utmSource, 120),
          utm_medium: str(ctx.utmMedium, 120),
          utm_campaign: str(ctx.utmCampaign, 120),
          device: ['mobile', 'tablet', 'desktop'].includes(ctx.device) ? ctx.device : null,
          country,
        },
        { onConflict: 'id', ignoreDuplicates: true }
      )
    } else {
      /* Session déjà connue : filet de sécurité si la toute première
         requête s'est perdue (onglet fermé trop vite, réseau coupé). */
      await supabase.from('analytics_sessions').upsert(
        { id: sessionId, entry_path: str(events[0].path, 300) ?? '/', country },
        { onConflict: 'id', ignoreDuplicates: true }
      )
    }

    const rows = events.map((e) => ({
      session_id: sessionId,
      type: e.type as string,
      path: str(e.path, 300) ?? '/',
      duration_ms: int(e.durationMs, 0, 6 * 60 * 60 * 1000),
      scroll_pct: int(e.scrollPct, 0, 100),
      label: str(e.label, 120),
      meta: e.meta && typeof e.meta === 'object' ? e.meta : {},
    }))

    await supabase.from('analytics_events').insert(rows)

    /* Agrégats de session : compteurs et étapes de l'entonnoir. */
    const paths = events.map((e) => String(e.path))
    const pageviews = events.filter((e) => e.type === 'pageview').length
    const addedMs = events.reduce(
      (sum, e) => sum + (e.type === 'page_exit' ? (int(e.durationMs, 0, 6 * 60 * 60 * 1000) ?? 0) : 0),
      0
    )
    const clickedBuy = events.some(
      (e) => e.type === 'click' && typeof e.label === 'string' && /command|panier|acheter/i.test(e.label)
    )

    await supabase.rpc('analytics_touch_session', {
      p_session: sessionId,
      p_last_path: paths[paths.length - 1] ?? '/',
      p_pageviews: pageviews,
      p_duration_ms: addedMs,
      p_saw_collection: paths.some((p) => p.startsWith('/product-category/') || p.startsWith('/produits')),
      p_saw_product: paths.some((p) => /^\/produits\/[^/]+/.test(p)),
      p_clicked_buy: clickedBuy,
    })

    return new NextResponse(null, { status: 204 })
  } catch {
    return new NextResponse(null, { status: 204 })
  }
}
