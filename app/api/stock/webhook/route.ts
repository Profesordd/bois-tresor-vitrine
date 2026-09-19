import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { PRODUCTS } from '@/lib/products'
import { estDernierExemplaire, invaliderStock } from '@/lib/stock'

/**
 * Webhook Shopify « orders/paid ».
 *
 * Dès qu'une commande payée contient un produit vendu à l'unité (stock
 * catalogue = 1), le produit passe en rupture sur le site. Les autres
 * produits ne sont pas concernés : leur stock n'est pas suivi ici.
 *
 * Shopify signe chaque envoi (HMAC-SHA256 du corps brut, en base64, en-tête
 * X-Shopify-Hmac-Sha256). Sans signature valide, rien n'est écrit : sinon
 * n'importe qui pourrait mettre le catalogue en rupture avec un simple POST.
 *
 * Réglage côté Shopify : Paramètres > Notifications > Webhooks > Créer,
 * événement « Paiement de commande », format JSON, URL
 * https://www.bois-tresor.com/api/stock/webhook/ — puis coller le secret
 * affiché sous la liste des webhooks dans SHOPIFY_WEBHOOK_SECRET.
 */

async function signatureValide(corps: string, recue: string | null, secret: string): Promise<boolean> {
  if (!recue) return false
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(corps)))
  let binaire = ''
  for (let i = 0; i < sig.length; i++) binaire += String.fromCharCode(sig[i])
  const attendue = btoa(binaire)

  /* Comparaison à temps constant : ne pas révéler par la durée de réponse
     combien de caractères sont justes. */
  if (attendue.length !== recue.length) return false
  let diff = 0
  for (let i = 0; i < attendue.length; i++) diff |= attendue.charCodeAt(i) ^ recue.charCodeAt(i)
  return diff === 0
}

export async function POST(req: NextRequest) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Webhook non configuré' }, { status: 503 })

  const corps = await req.text()
  if (!(await signatureValide(corps, req.headers.get('x-shopify-hmac-sha256'), secret))) {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
  }

  let commande: { line_items?: Array<{ variant_id?: number | string }> } = {}
  try { commande = JSON.parse(corps) } catch { return NextResponse.json({ ok: true }) }

  const variantes = new Set((commande.line_items ?? []).map((l) => String(l.variant_id ?? '')))
  const epuises = PRODUCTS.filter(
    (p) => p.variantId && variantes.has(p.variantId) && estDernierExemplaire(p)
  )

  if (epuises.length > 0) {
    const supabase = createAdminClient()
    await supabase.from('stock_epuise').upsert(
      epuises.map((p) => ({ slug: p.slug, source: 'shopify' })),
      { onConflict: 'slug' }
    )
    invaliderStock()
  }

  /* Toujours 200 une fois la signature vérifiée : Shopify réessaie sinon,
     et finit par désactiver le webhook après trop d'échecs. */
  return NextResponse.json({ ok: true, epuises: epuises.map((p) => p.slug) })
}
