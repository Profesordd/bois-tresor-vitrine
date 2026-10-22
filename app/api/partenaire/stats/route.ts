import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Les ventes du site, en lecture seule, pour un tableau de bord extérieur.
 *
 * Pensée pour être appelée depuis un autre site, qui n'a aucun lien avec
 * celui-ci et ne doit rien en apprendre. La réponse ne contient donc NI le
 * nom du site, NI son adresse, NI un nom de produit, NI la moindre donnée
 * de client. Le site s'y désigne par une étiquette neutre, « Site 1 »,
 * posée dans `PARTENAIRE_LIBELLE`.
 *
 * Uniquement les ventes abouties et ce qu'elles ont rapporté. Ni visites,
 * ni paniers, ni tentatives : le destinataire veut un chiffre d'affaires,
 * pas un diagnostic.
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

interface Vente { created_at: string; montant_cents: number }

/* Les chiffres changent peu d'une seconde à l'autre, et un tableau de bord
   qui interroge en boucle ne doit pas peser sur la base. Une minute de
   mémoire suffit sans que personne voie la différence. */
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

  /* Toutes les ventes depuis l'ouverture, par pages de mille. PostgREST
     plafonne une réponse à mille lignes quoi qu'on demande : sans
     pagination, le total se figerait un jour à mille sans prévenir. */
  const ventes: Vente[] = []
  for (let page = 0; page < 50; page++) {
    const { data, error } = await supabase
      .from('commandes')
      .select('created_at, montant_cents')
      .eq('statut', 'payee')
      .order('created_at')
      .range(page * 1000, page * 1000 + 999)
    if (error) {
      console.error('[partenaire] lecture impossible', error.message)
      return NextResponse.json({ error: 'Lecture impossible' }, { status: 502, headers: ENTETES_CORS })
    }
    ventes.push(...((data ?? []) as Vente[]))
    if ((data?.length ?? 0) < 1000) break
  }

  const compter = (depuis: Date | null, jusqua?: Date) => {
    const lot = ventes.filter((v) => {
      const t = new Date(v.created_at).getTime()
      return (!depuis || t >= depuis.getTime()) && (!jusqua || t < jusqua.getTime())
    })
    const montant = lot.reduce((s, v) => s + v.montant_cents, 0) / 100
    return { ventes: lot.length, montant_eur: Number(montant.toFixed(2)) }
  }

  const corps = {
    site: process.env.PARTENAIRE_LIBELLE ?? 'Site 1',
    devise: 'EUR',
    genere_a: new Date().toISOString(),
    aujourdhui: compter(minuitParis(0)),
    hier: compter(minuitParis(1), minuitParis(0)),
    sept_jours: compter(minuitParis(7)),
    trente_jours: compter(minuitParis(30)),
    depuis_le_debut: compter(null),
  }

  cache = { a: Date.now(), corps }
  return NextResponse.json(corps, { headers: ENTETES_CORS })
}
