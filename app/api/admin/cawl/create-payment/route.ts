import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, verifyToken } from '@/lib/admin/session'
import { creerPaiement, cawlConfigure, cawlEnvironnement, MODES_AUTORISATION } from '@/lib/cawl'

/**
 * Création d'un paiement CAWL, banc d'essai.
 *
 * Sous /api/admin/ et protégée par le jeton : le parcours d'achat public
 * ne passe pas par ici, et personne ne doit pouvoir déclencher un paiement
 * sur le compte du client depuis l'extérieur.
 *
 * Rien n'est enregistré en base : c'est un essai, pas une commande.
 */
export async function POST(req: NextRequest) {
  if (!(await verifyToken(req.cookies.get(ADMIN_COOKIE)?.value, process.env.ADMIN_SESSION_SECRET ?? ''))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  if (!cawlConfigure()) {
    return NextResponse.json({ error: 'Clés CAWL absentes de la configuration' }, { status: 503 })
  }

  const b = await req.json().catch(() => null)
  const montantCents = Number(b?.montantCents)
  if (!Number.isInteger(montantCents) || montantCents <= 0
      || !b?.numeroCarte || !b?.moisExpiration || !b?.anneeExpiration || !b?.cvv || !b?.titulaire || !b?.produitId) {
    return NextResponse.json({ error: 'Paramètres manquants ou invalides' }, { status: 400 })
  }

  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.bois-tresor.com').replace(/\/$/, '')
  const essai = String(b.essai ?? Date.now())

  try {
    const resultat = await creerPaiement({
      montantCents,
      numeroCarte: String(b.numeroCarte),
      moisExpiration: String(b.moisExpiration),
      anneeExpiration: String(b.anneeExpiration),
      cvv: String(b.cvv),
      titulaire: String(b.titulaire),
      produitId: Number(b.produitId),
      returnUrl: `${base}/admin/paiement-cawl/retour/?essai=${encodeURIComponent(essai)}`,
      navigateur: b.navigateur,
      modeAutorisation: MODES_AUTORISATION.includes(b?.modeAutorisation) ? b.modeAutorisation : 'SALE',
      ipClient: req.headers.get('x-forwarded-for')?.split(',')[0].trim()
        ?? req.headers.get('x-real-ip') ?? undefined,
      cleIdempotence: essai,
    })
    return NextResponse.json({ ok: true, environnement: cawlEnvironnement(), data: resultat })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur CAWL', environnement: cawlEnvironnement() },
      { status: 502 }
    )
  }
}
