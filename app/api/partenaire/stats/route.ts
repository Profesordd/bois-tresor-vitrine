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
 * Trois niveaux de lecture, parce qu'un tableau de bord ne sait pas
 * toujours quoi faire d'un total. Les totaux par période, la série
 * quotidienne continue pour tracer une courbe, et la liste des ventes
 * datées pour qui veut agréger autrement. Une vente n'y est qu'une date
 * et un montant : ni nom, ni produit, ni client.
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

/**
 * Garde-fou du détail vente par vente. Au-delà, la réponse pèserait sans
 * servir : c'est au destinataire de pagineur avec `depuis`.
 */
const DETAIL_MAX = 5000

/** Un jour calendaire, au format que lisent les outils de graphique. */
const JOUR_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Le jour calendaire d'une vente, à l'heure de Paris.
 *
 * `en-CA` rend « 2026-10-22 », le seul format que les outils de graphique
 * lisent sans discuter. Le serveur tourne en UTC : sans le fuseau, une
 * vente de 23 h 30 serait comptée le lendemain.
 */
function jourParis(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })
}

/* Les chiffres changent peu d'une seconde à l'autre, et un tableau de bord
   qui interroge en boucle ne doit pas peser sur la base. Une minute de
   mémoire suffit sans que personne voie la différence. */
let cache: { a: number; question: string; corps: unknown } | null = null
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

  /* Le canal demandé : « site » (défaut) = les ventes propres de
     bois-tresor ; « partenaire » = celles du checkout partenaire (Burban),
     comptées à part. Sans ce filtre, les ventes du partenaire gonfleraient
     le chiffre de bois-tresor dans le tableau de bord. */
  const canal = req.nextUrl.searchParams.get('canal') === 'partenaire' ? 'partenaire' : 'site'

  /* Le cache porte sur la question posée : deux `depuis` ou deux canaux
     différents ne doivent pas se répondre l'un pour l'autre. */
  const question = `${canal}:${req.nextUrl.searchParams.get('depuis') ?? ''}`
  if (cache && cache.question === question && Date.now() - cache.a < CACHE_MS) {
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
      .eq('canal', canal)
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

  /* `depuis` limite la série et le détail. Absent, on rend tout
     l'historique : un tableau de bord qui n'interroge qu'une fois par
     semaine doit pouvoir rattraper ce qu'il a manqué. */
  const demande = req.nextUrl.searchParams.get('depuis')
  const depuisJour = demande && JOUR_RE.test(demande) ? demande : null

  /* La série quotidienne, continue. Les jours sans vente valent zéro et
     doivent figurer : une courbe qui saute les jours creux raconte une
     progression qui n'existe pas. */
  const parJour = new Map<string, { ventes: number; montant_cents: number }>()
  for (const v of ventes) {
    const j = jourParis(v.created_at)
    const e = parJour.get(j) ?? { ventes: 0, montant_cents: 0 }
    e.ventes++
    e.montant_cents += v.montant_cents
    parJour.set(j, e)
  }

  /* Du premier jour utile à aujourd'hui, sans trou. Le premier jour est
     celui demandé, ou celui de la première vente. */
  const aujourdhui = jourParis(new Date().toISOString())
  const premiereVente = ventes.length > 0 ? jourParis(ventes[0].created_at) : aujourdhui
  /* `depuis` est honoré à la lettre, y compris avant la première vente :
     le destinataire a demandé une grille qui commence là, il doit la
     recevoir complète, zéros compris. */
  const premier = depuisJour ?? premiereVente

  const jours: { jour: string; ventes: number; montant_eur: number }[] = []
  /* Midi plutôt que minuit : à midi, aucun changement d'heure ne fait
     basculer la date d'un jour à l'autre entre UTC et Paris. */
  const curseur = new Date(`${premier}T12:00:00Z`)
  for (let i = 0; i < 1500; i++) {
    const date = jourParis(curseur.toISOString())
    const e = parJour.get(date)
    jours.push({
      jour: date,
      ventes: e?.ventes ?? 0,
      montant_eur: Number(((e?.montant_cents ?? 0) / 100).toFixed(2)),
    })
    if (date >= aujourdhui) break
    curseur.setUTCDate(curseur.getUTCDate() + 1)
  }

  const detail = ventes
    .filter((v) => !depuisJour || jourParis(v.created_at) >= depuisJour)
    .slice(-DETAIL_MAX)
    .map((v) => ({
      date: new Date(v.created_at).toISOString(),
      jour: jourParis(v.created_at),
      montant_eur: Number((v.montant_cents / 100).toFixed(2)),
    }))
    .reverse()

  const corps = {
    site: process.env.PARTENAIRE_LIBELLE ?? 'Site 1',
    devise: 'EUR',
    genere_a: new Date().toISOString(),
    aujourdhui: compter(minuitParis(0)),
    hier: compter(minuitParis(1), minuitParis(0)),
    sept_jours: compter(minuitParis(7)),
    trente_jours: compter(minuitParis(30)),
    depuis_le_debut: compter(null),
    fuseau: 'Europe/Paris',
    jours,
    ventes_detail: detail,
  }

  cache = { a: Date.now(), question, corps }
  return NextResponse.json(corps, { headers: ENTETES_CORS })
}
