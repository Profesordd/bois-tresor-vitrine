import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { creerPaiement, produitCawl, cawlConfigure } from '@/lib/cawl'
import { estUnRobot } from '@/lib/analytics/geo'

/**
 * Paiement par carte d'une commande déjà enregistrée.
 *
 * ⚠️ Le montant est relu en base, il ne vient pas de la requête. La
 * commande doit exister et être encore « en_attente » : on ne peut donc
 * pas relancer un paiement sur une commande déjà réglée.
 *
 * Les coordonnées de carte traversent cette route sans jamais être
 * enregistrées ni journalisées. Elles partent chez CAWL et disparaissent.
 */
export async function POST(req: NextRequest) {
  if (estUnRobot(req.headers.get('user-agent'))) {
    return NextResponse.json({ error: 'Requête refusée' }, { status: 403 })
  }
  if (!cawlConfigure()) {
    return NextResponse.json({ error: 'Paiement indisponible' }, { status: 503 })
  }

  const b = await req.json().catch(() => null)
  const commandeId = typeof b?.commandeId === 'string' ? b.commandeId : null
  if (!commandeId || !b?.numeroCarte || !b?.moisExpiration || !b?.anneeExpiration || !b?.cvv || !b?.titulaire) {
    return NextResponse.json({ error: 'Informations de carte incomplètes' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: commande } = await supabase
    .from('commandes')
    .select('id, reference, montant_cents, statut')
    .eq('id', commandeId)
    .maybeSingle()

  if (!commande) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
  if (commande.statut !== 'en_attente') {
    return NextResponse.json({ error: 'Cette commande est déjà réglée' }, { status: 409 })
  }

  const produitId = produitCawl(String(b.numeroCarte))
  if (!produitId) {
    return NextResponse.json({ error: 'Carte non acceptée. Visa, Mastercard ou CB.' }, { status: 400 })
  }

  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.bois-tresor.com').replace(/\/$/, '')

  try {
    const r = await creerPaiement({
      montantCents: commande.montant_cents as number,
      numeroCarte: String(b.numeroCarte),
      moisExpiration: String(b.moisExpiration),
      anneeExpiration: String(b.anneeExpiration),
      cvv: String(b.cvv),
      titulaire: String(b.titulaire),
      produitId,
      returnUrl: `${base}/commande/retour/?c=${encodeURIComponent(commande.id as string)}`,
      navigateur: b.navigateur,
      ipClient: req.headers.get('x-forwarded-for')?.split(',')[0].trim()
        ?? req.headers.get('x-real-ip') ?? undefined,
      cleIdempotence: String(commande.id),
    })

    /* L'identifiant du paiement est écrit tout de suite, avant le
       3-D Secure : si le navigateur le perd en route, la page de retour le
       retrouve en base. */
    await supabase
      .from('commandes')
      .update({ paiement_id: r.payment?.id ?? null, paiement_statut: r.payment?.status ?? null })
      .eq('id', commande.id)

    return NextResponse.json({
      ok: true,
      paymentId: r.payment?.id ?? null,
      redirection: r.merchantAction?.actionType === 'REDIRECT'
        ? r.merchantAction.redirectData?.redirectURL ?? null
        : null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Paiement refusé'
    await supabase.from('commandes').update({ erreur: message.slice(0, 300) }).eq('id', commande.id)
    return NextResponse.json({ error: message }, { status: 402 })
  }
}
