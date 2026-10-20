import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { lirePaiement, capturerPaiement, STATUTS_REFUS, STATUTS_DEJA_ENCAISSES } from '@/lib/cawl'

/**
 * Confirmation d'une commande après le 3-D Secure.
 *
 * ⚠️ Le statut est relu chez CAWL, jamais pris du navigateur. Un visiteur
 * qui appellerait cette route à la main ne peut donc pas faire passer sa
 * commande en « payee » : c'est le serveur CAWL qui tranche.
 */
export async function POST(req: NextRequest) {
  const { commandeId } = await req.json().catch(() => ({}))
  if (typeof commandeId !== 'string' || !commandeId) {
    return NextResponse.json({ error: 'Commande manquante' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: commande } = await supabase
    .from('commandes')
    .select('id, reference, statut, montant_cents, paiement_id')
    .eq('id', commandeId)
    .maybeSingle()

  if (!commande) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })

  /* Déjà confirmée : on renvoie la même réponse, sans rien refaire. */
  if (commande.statut === 'payee') {
    return NextResponse.json({ ok: true, reference: commande.reference })
  }
  if (!commande.paiement_id) {
    return NextResponse.json({ error: 'Aucun paiement associé' }, { status: 409 })
  }

  try {
    const paiement = await lirePaiement(commande.paiement_id as string)

    if (STATUTS_REFUS.includes(paiement.statut)) {
      await supabase.from('commandes')
        .update({ statut: 'refusee', paiement_statut: paiement.statut })
        .eq('id', commande.id)
      return NextResponse.json({ error: `Paiement refusé (${paiement.statut})` }, { status: 402 })
    }

    if (paiement.statut === 'PENDING_CAPTURE') {
      const pris = await capturerPaiement(commande.paiement_id as string, paiement.montantCents)
      if (!pris) {
        await supabase.from('commandes')
          .update({ statut: 'refusee', paiement_statut: paiement.statut })
          .eq('id', commande.id)
        return NextResponse.json({ error: 'Capture refusée' }, { status: 402 })
      }
    } else if (!STATUTS_DEJA_ENCAISSES.includes(paiement.statut)) {
      /* Statut inconnu : on ne déclare jamais une commande payée par défaut. */
      return NextResponse.json({ error: `Statut inattendu (${paiement.statut})` }, { status: 402 })
    }

    await supabase.from('commandes')
      .update({ statut: 'payee', paiement_statut: paiement.statut, payee_a: new Date().toISOString() })
      .eq('id', commande.id)

    return NextResponse.json({ ok: true, reference: commande.reference })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 502 })
  }
}
