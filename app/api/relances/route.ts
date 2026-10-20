import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ADMIN_COOKIE, verifyToken } from '@/lib/admin/session'
import { envoyer, emailConfigure } from '@/lib/emails/envoi'
import { composer, DELAIS_MINUTES, NB_ETAPES, type LeadRelance } from '@/lib/emails/relances'
import { signerLead } from '@/lib/emails/jeton'

/**
 * Envoi des relances dues.
 *
 * Déclenchée toutes les cinq minutes par le planificateur de Vercel
 * (`vercel.json`), et manuellement depuis l'espace d'administration.
 *
 * ⚠️ Cette fréquence n'est pas arbitraire : elle doit rester nettement
 * plus courte que le premier délai de la séquence, trente minutes. Un
 * message dû n'est envoyé qu'au passage suivant. Repasser le
 * planificateur à l'heure annulerait le réglage sans rien signaler.
 *
 * Le créneau est réservé en base AVANT l'envoi, pas après. Deux exécutions
 * qui se chevauchent écriraient sinon la même étape deux fois, et le
 * destinataire recevrait le message en double. La contrainte d'unicité
 * `(lead_id, etape)` tranche : la seconde insertion échoue, et cette
 * exécution-là passe son tour.
 *
 * Une étape qui échoue n'est pas retentée. Sa ligne existe, avec l'erreur.
 * Sans cela, une adresse invalide serait réessayée à chaque heure, pour
 * toujours.
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Au-delà, on s'arrête : l'exécution suivante prendra la suite. */
const LOT_MAX = 25
/** Resend limite le débit. Un envoi toutes les 600 ms reste sous la limite. */
const PAUSE_MS = 600
/** Passé ce délai, une tentative d'achat est trop vieille pour être relancée. */
const FENETRE_JOURS = 12
/**
 * Espacement minimal entre deux messages à la même personne.
 *
 * Le calendrier normal laisse au moins deux heures et demie entre deux
 * étapes, cette règle n'y change rien. Elle protège d'un cas particulier :
 * une adresse laissée il y a plusieurs heures a d'un coup deux ou trois
 * étapes échues. Sans ce garde-fou, elle les recevrait à quelques minutes
 * d'intervalle, ce qui ressemble à du harcèlement et finit en signalement.
 */
const ESPACEMENT_MIN_MS = 2 * 3600_000

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.bois-tresor.com').replace(/\/$/, '')

async function autorise(req: NextRequest): Promise<boolean> {
  /* Le planificateur de Vercel présente CRON_SECRET en Bearer. */
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') === `Bearer ${secret}`) return true
  /* Sinon, une session d'administration ouverte : c'est le bouton
     « Envoyer les relances dues » du tableau de bord. */
  return verifyToken(req.cookies.get(ADMIN_COOKIE)?.value, process.env.ADMIN_SESSION_SECRET ?? '')
}

interface Bilan {
  examines: number
  envoyes: number
  echecs: number
  details: { email: string; etape: number; ok: boolean; erreur?: string }[]
}

async function traiter(): Promise<Bilan | { erreur: string }> {
  if (!emailConfigure()) return { erreur: 'RESEND_API_KEY ou EMAIL_FROM absent' }

  const supabase = createAdminClient()
  const depuis = new Date(Date.now() - FENETRE_JOURS * 86400_000).toISOString()

  /* Les candidats : pas de commande payée, pas de désinscription, et une
     tentative assez récente pour que la relance ait du sens. */
  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, email, created_at, produit_slug, produit_nom, lot, montant')
    .eq('a_commande', false)
    .eq('desinscrit', false)
    .gte('created_at', depuis)
    .order('created_at', { ascending: true })
    .limit(400)

  if (error) return { erreur: `lecture des leads impossible : ${error.message}` }

  const { data: deja } = await supabase
    .from('relances')
    .select('lead_id, etape, envoye_a')
    .in('lead_id', (leads ?? []).map((l) => l.id as string))

  /* Étape la plus avancée déjà écrite, et date du dernier envoi, par lead. */
  const avancement = new Map<string, number>()
  const dernierEnvoi = new Map<string, number>()
  for (const r of deja ?? []) {
    const id = r.lead_id as string
    avancement.set(id, Math.max(avancement.get(id) ?? 0, Number(r.etape)))
    const quand = new Date(r.envoye_a as string).getTime()
    dernierEnvoi.set(id, Math.max(dernierEnvoi.get(id) ?? 0, quand))
  }

  const bilan: Bilan = { examines: leads?.length ?? 0, envoyes: 0, echecs: 0, details: [] }

  for (const lead of leads ?? []) {
    if (bilan.envoyes + bilan.echecs >= LOT_MAX) break

    const etape = (avancement.get(lead.id as string) ?? 0) + 1
    if (etape > NB_ETAPES) continue

    const du = new Date(lead.created_at as string).getTime() + DELAIS_MINUTES[etape - 1] * 60_000
    if (du > Date.now()) continue

    /* Deux messages ne partent jamais coup sur coup, même si deux étapes
       sont échues en même temps. */
    const precedent = dernierEnvoi.get(lead.id as string)
    if (precedent && Date.now() - precedent < ESPACEMENT_MIN_MS) continue

    /* Réservation du créneau. Un conflit signifie qu'une autre exécution
       s'en occupe déjà : on la laisse faire. */
    const { data: ligne, error: conflit } = await supabase
      .from('relances')
      .insert({ lead_id: lead.id, etape })
      .select('id')
      .single()
    if (conflit || !ligne) continue

    const jeton = await signerLead(lead.id as string)
    const params = `id=${encodeURIComponent(lead.id as string)}&t=${encodeURIComponent(jeton)}`
    const pageDesinscription = `${SITE}/desinscription/?${params}`
    const apiDesinscription = `${SITE}/api/desinscription/?${params}`

    const message = composer(etape, lead as unknown as LeadRelance, pageDesinscription)
    const envoi = await envoyer({
      a: lead.email as string,
      sujet: message.sujet,
      html: message.html,
      texte: message.texte,
      desinscription: apiDesinscription,
    })

    await supabase
      .from('relances')
      .update(envoi.ok ? { resend_id: envoi.id } : { erreur: envoi.erreur })
      .eq('id', ligne.id)

    if (envoi.ok) bilan.envoyes++
    else bilan.echecs++
    bilan.details.push({
      email: lead.email as string,
      etape,
      ok: envoi.ok,
      ...(envoi.ok ? {} : { erreur: envoi.erreur }),
    })

    await new Promise((r) => setTimeout(r, PAUSE_MS))
  }

  return bilan
}

export async function GET(req: NextRequest) {
  if (!(await autorise(req))) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  return NextResponse.json(await traiter())
}

/* Même traitement en POST : c'est ce qu'envoie le bouton de l'admin. */
export async function POST(req: NextRequest) {
  return GET(req)
}
