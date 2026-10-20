import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ADMIN_COOKIE, verifyToken } from '@/lib/admin/session'

/**
 * Suivi d'un lead par le gérant.
 *
 * Le middleware ne protège que les pages ; cette route vérifie donc
 * elle-même le jeton, sans quoi n'importe qui pourrait lire ou modifier
 * les adresses laissées par les visiteurs.
 *
 * Aucune suppression : un lead reste, même traité. Ce qu'on en a fait est
 * une information en soi, et le client a déjà été gêné par des listes qui
 * se vident.
 */

async function autorise(req: NextRequest): Promise<boolean> {
  return verifyToken(req.cookies.get(ADMIN_COOKIE)?.value, process.env.ADMIN_SESSION_SECRET ?? '')
}

export async function PATCH(req: NextRequest) {
  if (!(await autorise(req))) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id, traite, note } = await req.json().catch(() => ({}))
  if (typeof id !== 'string') {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }

  const champs: Record<string, unknown> = {}
  if (typeof traite === 'boolean') {
    champs.traite = traite
    champs.traite_a = traite ? new Date().toISOString() : null
  }
  if (typeof note === 'string') champs.note = note.trim().slice(0, 1000) || null

  if (Object.keys(champs).length === 0) {
    return NextResponse.json({ error: 'Rien à modifier' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('leads').update(champs).eq('id', id)

  if (error) return NextResponse.json({ error: 'Mise à jour impossible' }, { status: 502 })
  return NextResponse.json({ ok: true })
}
