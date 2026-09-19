import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ADMIN_COOKIE, verifyToken } from '@/lib/admin/session'
import { getProductBySlug } from '@/lib/products'
import { invaliderStock } from '@/lib/stock'

/**
 * Marquer un produit en rupture, ou le remettre en vente.
 *
 * Même règle que les autres routes d'administration : le middleware ne
 * protège que les pages, la route vérifie donc elle-même le jeton.
 */
export async function POST(req: NextRequest) {
  const autorise = await verifyToken(
    req.cookies.get(ADMIN_COOKIE)?.value,
    process.env.ADMIN_SESSION_SECRET ?? ''
  )
  if (!autorise) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { slug, epuise } = await req.json().catch(() => ({}))
  if (typeof slug !== 'string' || typeof epuise !== 'boolean' || !getProductBySlug(slug)) {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = epuise
    ? await supabase.from('stock_epuise').upsert({ slug, source: 'admin' }, { onConflict: 'slug' })
    : await supabase.from('stock_epuise').delete().eq('slug', slug)

  if (error) return NextResponse.json({ error: 'Mise à jour impossible' }, { status: 502 })

  /* Les fiches et collections sont statiques : sans cette purge, la rupture
     n'apparaîtrait qu'à la prochaine revalidation. */
  invaliderStock()
  return NextResponse.json({ ok: true })
}
