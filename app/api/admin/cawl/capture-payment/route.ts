import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, verifyToken } from '@/lib/admin/session'
import { lirePaiement, capturerPaiement, cawlConfigure, STATUTS_REFUS, STATUTS_DEJA_ENCAISSES } from '@/lib/cawl'

/**
 * Lecture du statut puis capture, banc d'essai.
 *
 * On relit toujours le paiement avant de capturer : le statut renvoyé au
 * navigateur après le 3-D Secure n'est pas une preuve, seul le serveur
 * CAWL fait foi.
 */
export async function POST(req: NextRequest) {
  if (!(await verifyToken(req.cookies.get(ADMIN_COOKIE)?.value, process.env.ADMIN_SESSION_SECRET ?? ''))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  if (!cawlConfigure()) {
    return NextResponse.json({ error: 'Clés CAWL absentes de la configuration' }, { status: 503 })
  }

  const { paymentId } = await req.json().catch(() => ({}))
  if (typeof paymentId !== 'string' || !paymentId) {
    return NextResponse.json({ error: 'paymentId manquant' }, { status: 400 })
  }

  try {
    const paiement = await lirePaiement(paymentId)

    if (STATUTS_REFUS.includes(paiement.statut)) {
      return NextResponse.json({ error: `Paiement refusé (${paiement.statut})`, statut: paiement.statut }, { status: 402 })
    }

    if (paiement.statut === 'PENDING_CAPTURE') {
      const ok = await capturerPaiement(paymentId, paiement.montantCents)
      if (!ok) return NextResponse.json({ error: 'Capture refusée par CAWL', statut: paiement.statut }, { status: 402 })
      return NextResponse.json({ ok: true, statut: 'CAPTURED', montantCents: paiement.montantCents, paymentId })
    }

    if (STATUTS_DEJA_ENCAISSES.includes(paiement.statut)) {
      return NextResponse.json({ ok: true, statut: paiement.statut, montantCents: paiement.montantCents, paymentId })
    }

    /* Statut inconnu : on ne déclare jamais un paiement bon par défaut. */
    return NextResponse.json({ error: `Statut inattendu (${paiement.statut})`, statut: paiement.statut }, { status: 402 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur CAWL' }, { status: 502 })
  }
}
