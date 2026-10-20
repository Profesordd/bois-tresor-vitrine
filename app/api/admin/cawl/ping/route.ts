import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, verifyToken } from '@/lib/admin/session'
import { lirePaiement, cawlConfigure, cawlEnvironnement } from '@/lib/cawl'

/**
 * Test de connexion à CAWL, sans rien débiter.
 *
 * On demande un identifiant de paiement volontairement invalide. CAWL doit
 * répondre « PaymentId has an invalid length » : cela prouve que la
 * signature a été acceptée, donc que le PSPID et les deux clés sont bons.
 *
 * Utile parce qu'une clé tronquée au copier-coller ne se voit qu'au premier
 * paiement, et que ce premier paiement est un vrai débit.
 */
export async function GET(req: NextRequest) {
  if (!(await verifyToken(req.cookies.get(ADMIN_COOKIE)?.value, process.env.ADMIN_SESSION_SECRET ?? ''))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  if (!cawlConfigure()) {
    return NextResponse.json({ ok: false, message: 'Clés absentes de la configuration' })
  }

  const env = cawlEnvironnement()
  try {
    await lirePaiement('000000000000000000_0')
    /* Inattendu : cet identifiant ne peut pas exister. On ne crie pas
       victoire, mais la signature est forcément passée. */
    return NextResponse.json({ ok: true, environnement: env, message: 'Connexion établie' })
  } catch (err) {
    const m = err instanceof Error ? err.message : ''
    /* Le serveur conteste l'identifiant, pas la signature : les clés sont bonnes. */
    if (/invalid length|PaymentId/i.test(m)) {
      return NextResponse.json({ ok: true, environnement: env, message: 'Clés valides, CAWL répond' })
    }
    if (/ACCESS_TO_MERCHANT_NOT_ALLOWED/i.test(m)) {
      return NextResponse.json({
        ok: false, environnement: env,
        message: 'Les clés ne sont pas autorisées sur cette plateforme. Clés de production sur la préprod, ou l’inverse.',
      })
    }
    return NextResponse.json({ ok: false, environnement: env, message: m || 'CAWL ne répond pas' })
  }
}
