import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, verifyToken } from '@/lib/admin/session'
import { envoyer, emailConfigure } from '@/lib/emails/envoi'
import { composer, lienPaiement, NB_ETAPES, DELAIS_MINUTES, libelleDelai, type LeadRelance } from '@/lib/emails/relances'

/**
 * Envoi des cinq relances à une adresse choisie, pour relecture.
 *
 * Réservé à l'administration. Rien n'est écrit dans `relances` : ces envois
 * ne doivent pas compter comme des étapes franchies, sinon un essai
 * priverait un vrai prospect de son message.
 *
 * Le sujet est préfixé par l'étape et son délai. Le destinataire reçoit les
 * cinq d'affilée, il doit pouvoir les remettre dans l'ordre.
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i

/* Commande fictive, choisie pour qu'elle produise un vrai lien de paiement :
   c'est le lien qu'il faut pouvoir cliquer pour le vérifier. */
const EXEMPLE: LeadRelance = {
  id: 'apercu',
  email: '',
  produit_slug: 'granules-de-bois-limouzi-palette-de-134-sacs-de-15-kg',
  produit_nom: 'Granulés de bois Limouzi – sacs de 15 kg — 30 sacs (450 kg)',
  lot: '30',
  montant: 59.97,
}



export async function POST(req: NextRequest) {
  const autorise = await verifyToken(
    req.cookies.get(ADMIN_COOKIE)?.value,
    process.env.ADMIN_SESSION_SECRET ?? ''
  )
  if (!autorise) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  if (!emailConfigure()) {
    return NextResponse.json({ erreur: 'RESEND_API_KEY ou EMAIL_FROM absent' })
  }

  const { email } = await req.json().catch(() => ({}))
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: 'Adresse invalide' }, { status: 400 })
  }
  const destinataire = email.trim()

  /* Le lien de désinscription est volontairement inerte : un clic depuis
     une relecture ne doit désinscrire personne. */
  const desinscription = `${(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.bois-tresor.com').replace(/\/$/, '')}/desinscription/`

  const details: { etape: number; ok: boolean; erreur?: string }[] = []
  for (let etape = 1; etape <= NB_ETAPES; etape++) {
    const m = composer(etape, { ...EXEMPLE, email: destinataire }, desinscription)
    const r = await envoyer({
      a: destinataire,
      sujet: `[Relance ${etape}/${NB_ETAPES} · ${libelleDelai(DELAIS_MINUTES[etape - 1])}] ${m.sujet}`,
      html: m.html,
      texte: m.texte,
    })
    details.push({ etape, ok: r.ok, ...(r.ok ? {} : { erreur: r.erreur }) })
    /* Resend limite le débit : un envoi toutes les 600 ms reste dessous. */
    await new Promise((r) => setTimeout(r, 600))
  }

  return NextResponse.json({
    destinataire,
    envoyes: details.filter((d) => d.ok).length,
    lienPaiement: lienPaiement(EXEMPLE),
    details,
  })
}
