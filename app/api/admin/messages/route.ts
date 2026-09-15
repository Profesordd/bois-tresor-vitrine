import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ADMIN_COOKIE, verifyToken } from '@/lib/admin/session'

/**
 * Marquer une demande comme traitée, ou revenir en arrière.
 *
 * Le middleware ne protège que les pages ; cette route vérifie donc
 * elle-même le jeton d'administration, sans quoi n'importe qui pourrait
 * modifier l'état des demandes du client.
 */
export async function PATCH(req: NextRequest) {
  const ok = await verifyToken(
    req.cookies.get(ADMIN_COOKIE)?.value,
    process.env.ADMIN_SESSION_SECRET ?? ''
  )
  if (!ok) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

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
