import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { jetonValide } from '@/lib/emails/jeton'

/**
 * Désinscription des relances.
 *
 * En POST uniquement, et c'est volontaire. Un lien de désinscription qui
 * agit en GET se déclenche tout seul : les antivirus et les filtres de
 * messagerie ouvrent les liens d'un message pour les inspecter, et
 * désinscrivent des gens qui n'ont rien demandé.
 *
 * Deux appelants, le même traitement :
 *   - la page /desinscription/, qui envoie ce POST au clic ;
 *   - le bouton « Se désabonner » de Gmail et Outlook, qui envoie un POST
 *     direct (en-tête List-Unsubscribe-Post, RFC 8058).
 *
 * La désinscription porte sur l'adresse, pas sur une tentative d'achat :
 * quelqu'un qui dit stop ne doit plus rien recevoir, quelle que soit la
 * visite concernée.
 */
export async function POST(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const id = searchParams.get('id') ?? ''
  const jeton = searchParams.get('t')

  if (!id || !(await jetonValide(id, jeton))) {
    return NextResponse.json({ error: 'Lien invalide' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase.from('leads').select('email').eq('id', id).maybeSingle()
  if (error || !data?.email) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  const { error: majErreur } = await supabase
    .from('leads')
    .update({ desinscrit: true, desinscrit_a: new Date().toISOString() })
    .eq('email', data.email)

  if (majErreur) return NextResponse.json({ error: 'Enregistrement impossible' }, { status: 502 })
  return NextResponse.json({ ok: true })
}
