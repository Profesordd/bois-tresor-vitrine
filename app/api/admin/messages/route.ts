import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ADMIN_COOKIE, verifyToken } from '@/lib/admin/session'

/**
 * Actions sur les demandes de contact.
 *
 * Le middleware ne protège que les pages ; cette route vérifie donc
 * elle-même le jeton d'administration, sans quoi n'importe qui pourrait
 * supprimer les demandes du client ou bloquer ses vrais clients.
 */

async function autorise(req: NextRequest): Promise<boolean> {
  return verifyToken(req.cookies.get(ADMIN_COOKIE)?.value, process.env.ADMIN_SESSION_SECRET ?? '')
}

/** Marquer traité, ou revenir en arrière. */
export async function PATCH(req: NextRequest) {
  if (!(await autorise(req))) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id, handled } = await req.json().catch(() => ({}))
  if (typeof id !== 'string' || typeof handled !== 'boolean') {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('contact_messages')
    .update({ handled, handled_at: handled ? new Date().toISOString() : null })
    .eq('id', id)

  if (error) return NextResponse.json({ error: 'Mise à jour impossible' }, { status: 502 })
  return NextResponse.json({ ok: true })
}

/**
 * Marquer comme indésirable : le message est supprimé et l'adresse bloquée.
 *
 * Le blocage est définitif : il n'existe aucune route de déblocage. Seule
 * l'adresse est conservée, sans le nom ni le message — une fois la décision
 * prise et le message effacé, les garder n'aurait plus d'objet.
 */
export async function POST(req: NextRequest) {
  if (!(await autorise(req))) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await req.json().catch(() => ({}))
  if (typeof id !== 'string') return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })

  const supabase = createAdminClient()

  const { data: msg } = await supabase
    .from('contact_messages')
    .select('email')
    .eq('id', id)
    .maybeSingle()

  if (!msg) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })

  /* L'adresse est mise en minuscules : changer la casse ne doit rien
     contourner. */
  await supabase.from('contact_blocklist').upsert(
    { email: String(msg.email).toLowerCase(), blocked_at: new Date().toISOString() },
    { onConflict: 'email' }
  )

  const { error } = await supabase.from('contact_messages').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'Suppression impossible' }, { status: 502 })

  return NextResponse.json({ ok: true })
}
