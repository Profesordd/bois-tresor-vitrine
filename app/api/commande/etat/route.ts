import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * L'état d'une commande, en lecture seule.
 *
 * Sert au client qui revient sur le checkout après être parti chez sa
 * banque, en général par le bouton « précédent ». Sans cela il retrouve
 * un formulaire vide, sans un mot, et il repart en croyant avoir payé.
 * C'est arrivé le 22/10/2026 : une cliente a écrit le soir même pour
 * demander sa date de livraison alors que rien n'avait abouti.
 *
 * ⚠️ Ne touche à rien et n'interroge pas CAWL. Une route appelée depuis
 * le navigateur ne doit jamais pouvoir faire basculer un statut : la
 * confirmation et le rattrapage s'en chargent, eux seuls parlent à CAWL.
 *
 * L'identifiant est un UUID tiré au sort, impossible à deviner, et la
 * réponse ne contient que le statut et la référence. Ni adresse, ni
 * téléphone, ni montant.
 */

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('c') ?? ''
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Référence invalide' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('commandes')
    .select('statut, reference')
    .eq('id', id)
    .maybeSingle()

  if (!data) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  return NextResponse.json(
    { statut: data.statut, reference: data.reference },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
