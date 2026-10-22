import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Chiffres du site, en lecture seule, pour un tableau de bord extérieur.
 *
 * Pensée pour être appelée depuis un autre site, qui n'a aucun lien avec
 * celui-ci et ne doit rien en apprendre. La réponse ne contient donc NI le
 * nom du site, NI son adresse, NI un nom de produit, NI la moindre donnée
 * de client. Le site s'y désigne par une étiquette neutre, « Site 1 »,
 * posée dans `PARTENAIRE_LIBELLE`.
 *
 * L'accès tient à une clé, présentée en `Authorization: Bearer <clé>` ou,
 * pour les tableaux de bord qui ne savent poser aucun en-tête, en `?cle=`.
 * Sans clé configurée, la route répond 503 : mieux vaut muette qu'ouverte.
 *
 * ⚠️ Lecture seule, et volontairement. Rien ici n'écrit en base, aucun
 * paramètre ne remonte dans une requête. Le pire qu'un porteur de clé
 * puisse faire, c'est lire des totaux.
 */

export const dynamic = 'force-dynamic'

const ENTETES_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'no-store',
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: ENTETES_CORS })
}

/** Comparaison à durée constante : une égalité naïve fuit la clé, lettre à lettre. */
function memeCle(fournie: string, attendue: string): boolean {
  const a = Buffer.from(fournie)
  const b = Buffer.from(attendue)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** Minuit à Paris, il y a `ilYA` jours. Le serveur tourne en UTC. */
function minuitParis(ilYA: number): Date {
  const maintenant = new Date()
  const paris = new Date(maintenant.toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
  const ecart = maintenant.getTime() - paris.getTime()
  paris.setHours(0, 0, 0, 0)
  return new Date(paris.getTime() + ecart - ilYA * 86_400_000)
}

interface Commande { created_at: string; statut: string; montant_cents: number }

function arrondi(n: number, d = 2): number {
  return Number(n.toFixed(d))
}

/** Minuit a Paris, il y a `ilYA` jours. Le serveur tourne en UTC. */
function bornes(ilYA: number, jusqua?: number) {
  return { depuis: minuitParis(ilYA), jusqua: jusqua === undefined ? null : minuitParis(jusqua) }
}

const PERIODES = {
  aujourdhui: bornes(0),
  hier: bornes(1, 0),
  sept_jours: bornes(7),
  trente_jours: bornes(30),
}

type NomPeriode = keyof typeof PERIODES

/**
 * Toutes les lignes, par pages de mille.
 *
 * PostgREST plafonne une reponse a mille lignes quoi qu'on demande. Sans
 * pagination, le chiffre de trente jours se fige a mille et personne ne
 * s'en apercoit : il a l'air plausible.
 */
async function toutesLesLignes<T>(
  requete: (de: number, a: number) => PromiseLike<{ data: unknown[] | null; error: unknown }>,
): Promise<T[]> {
  const PAGE = 1000
  const lignes: T[] = []
  for (let page = 0; page < 30; page++) {
    const { data, error } = await requete(page * PAGE, page * PAGE + PAGE - 1)
    if (error) throw new Error('lecture interrompue')
    const recues = (data ?? []) as T[]
    lignes.push(...recues)
    if (recues.length < PAGE) break
  }
  return lignes
}

/* Les chiffres changent peu d'une seconde a l'autre, et un tableau de bord
   qui interroge en boucle ne doit pas peser sur la base. Une minute de
   memoire suffit a rendre l'appel gratuit sans que personne voie la
   difference. */
let cache: { a: number; corps: unknown } | null = null
const CACHE_MS = 60_000

export async function GET(req: NextRequest) {
  const attendue = process.env.PARTENAIRE_API_KEY
  if (!attendue) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503, headers: ENTETES_CORS })
  }

  const fournie = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
    || req.nextUrl.searchParams.get('cle')
    || ''
  if (!memeCle(fournie, attendue)) {
    return NextResponse.json({ error: 'Clé invalide' }, { status: 401, headers: ENTETES_CORS })
  }

  if (cache && Date.now() - cache.a < CACHE_MS) {
    return NextResponse.json(cache.corps, { headers: ENTETES_CORS })
  }

  const supabase = createAdminClient()
  const debut = minuitParis(30).toISOString()

  try {
    /* Les visites se comptent côté base : les rapatrier pour les compter
       ici coûterait des dizaines de milliers de lignes par appel. */
    const visites: Record<NomPeriode, number> = {} as Record<NomPeriode, number>
    await Promise.all((Object.keys(PERIODES) as NomPeriode[]).map(async (nom) => {
      const { depuis, jusqua } = PERIODES[nom]
      let q = supabase.from('analytics_sessions')
        .select('id', { count: 'exact', head: true })
        .gte('started_at', depuis.toISOString())
      if (jusqua) q = q.lt('started_at', jusqua.toISOString())
      const { count } = await q
      visites[nom] = count ?? 0
    }))

    const commandes = await toutesLesLignes<Commande>((de, a) =>
      supabase.from('commandes').select('created_at, statut, montant_cents')
        .gte('created_at', debut).order('created_at').range(de, a))

    const vues = await toutesLesLignes<{ session_id: string; occurred_at: string }>((de, a) =>
      supabase.from('analytics_events').select('session_id, occurred_at')
        .eq('type', 'pageview').like('path', '/commande/%')
        .gte('occurred_at', debut).order('occurred_at').range(de, a))

    /* Une arrivée sur le checkout par visite, pas par page vue : recharger
       la page ne doit pas gonfler le chiffre. */
    const premiereVue = new Map<string, string>()
    for (const e of vues) {
      if (!premiereVue.has(e.session_id) || e.occurred_at < premiereVue.get(e.session_id)!) {
        premiereVue.set(e.session_id, e.occurred_at)
      }
    }
    const arrivees: string[] = []
    premiereVue.forEach((quand) => arrivees.push(quand))

    const periodes = {} as Record<NomPeriode, unknown>
    for (const nom of Object.keys(PERIODES) as NomPeriode[]) {
      const { depuis, jusqua } = PERIODES[nom]
      const dans = (iso: string) => {
        const t = new Date(iso).getTime()
        return t >= depuis.getTime() && (!jusqua || t < jusqua.getTime())
      }
      const c = commandes.filter((x) => dans(x.created_at))
      const payees = c.filter((x) => x.statut === 'payee')
      const ca = payees.reduce((s2, x) => s2 + x.montant_cents, 0) / 100
      periodes[nom] = {
        visites: visites[nom],
        arrivees_checkout: arrivees.filter(dans).length,
        tentatives: c.length,
        commandes_payees: payees.length,
        chiffre_affaires_eur: arrondi(ca),
        panier_moyen_eur: payees.length > 0 ? arrondi(ca / payees.length) : 0,
        taux_conversion_pct: visites[nom] > 0 ? arrondi((payees.length * 100) / visites[nom]) : 0,
      }
    }

    const corps = {
      site: process.env.PARTENAIRE_LIBELLE ?? 'Site 1',
      devise: 'EUR',
      genere_a: new Date().toISOString(),
      periodes,
    }
    cache = { a: Date.now(), corps }
    return NextResponse.json(corps, { headers: ENTETES_CORS })
  } catch {
    console.error('[partenaire] lecture impossible')
    return NextResponse.json({ error: 'Lecture impossible' }, { status: 502, headers: ENTETES_CORS })
  }
}
