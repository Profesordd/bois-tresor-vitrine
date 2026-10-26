import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ADMIN_COOKIE, PARTENAIRE_COOKIE, verifyToken } from '@/lib/admin/session'

/**
 * Enregistre le spend publicitaire d'une journée pour le canal partenaire.
 *
 * Accessible au super-admin comme au partenaire : l'un ou l'autre peut
 * saisir, et les deux voient le même historique. Un jour = une ligne, mise
 * à jour si elle existe déjà.
 */

export const dynamic = 'force-dynamic'

const JOUR_RE = /^\d{4}-\d{2}-\d{2}$/

async function autorise(req: NextRequest): Promise<boolean> {
  const admin = await verifyToken(req.cookies.get(ADMIN_COOKIE)?.value, process.env.ADMIN_SESSION_SECRET ?? '')
  if (admin) return true
  return verifyToken(req.cookies.get(PARTENAIRE_COOKIE)?.value, process.env.PARTENAIRE_SESSION_SECRET ?? '')
}

export async function POST(req: NextRequest) {
  if (!(await autorise(req))) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const b = await req.json().catch(() => null)
  const jour = typeof b?.jour === 'string' && JOUR_RE.test(b.jour) ? b.jour : null
  if (!jour) return NextResponse.json({ error: 'Date invalide' }, { status: 400 })

  const spend = Number(b?.spend)
  const taux = Number(b?.taux)
  if (!Number.isFinite(spend) || spend < 0) return NextResponse.json({ error: 'Spend invalide' }, { status: 400 })
  if (!Number.isFinite(taux) || taux <= 0) return NextResponse.json({ error: 'Taux invalide' }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase.from('partenaire_spend').upsert({
    jour,
    spend_usd: Math.round(spend * 100) / 100,
    taux_eur_usd: Math.round(taux * 10000) / 10000,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'jour' })

  if (error) {
    console.error('[spend] enregistrement impossible', error.message)
    return NextResponse.json({ error: 'Enregistrement impossible' }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
