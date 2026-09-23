import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidateTag } from 'next/cache'
import { PRODUCTS, getProductBySlug } from '@/lib/products'
import type { Product } from '@/types/database'

/**
 * Stock réel, par-dessus le catalogue en dur.
 *
 * Le catalogue porte un stock indicatif ; la table `stock_epuise` liste les
 * produits qui ne sont plus vendables. Ici on lit cette liste et on
 * l'applique aux produits avant tout rendu.
 *
 * La lecture passe par le cache de données de Next (60 s, étiquette
 * `stock`) et non par le client « no-store » de l'admin : les fiches
 * restent statiques, et une rupture déclenchée par l'admin ou le webhook
 * purge l'étiquette pour être visible immédiatement.
 */
export const STOCK_TAG = 'stock'

/**
 * Produits qui partagent le même stock physique — typiquement les deux
 * fiches d'un test A/B. Marquer l'un en rupture les marque tous : ce sont
 * les mêmes sacs, il ne peut pas en rester d'un côté et plus de l'autre.
 */
const STOCK_PARTAGE: string[][] = [
  [
    'granules-de-bois-limouzi-palette-de-134-sacs-de-15-kg',
    'granules-de-bois-limouzi-sacs-de-15-kg',
  ],
]

/** Étend une liste de ruptures aux produits qui partagent leur stock. */
function etendreAuxLies(ruptures: Set<string>): Set<string> {
  for (const groupe of STOCK_PARTAGE) {
    if (groupe.some((s) => ruptures.has(s))) groupe.forEach((s) => ruptures.add(s))
  }
  return ruptures
}

/** Stock catalogue à 1 : le produit est vendu à l'unité, la vente l'épuise. */
export function estDernierExemplaire(product: Pick<Product, 'stock'>): boolean {
  return product.stock === 1
}

function clientStock() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
      global: {
        fetch: (url, options = {}) =>
          fetch(url, { ...options, next: { revalidate: 60, tags: [STOCK_TAG] } }),
      },
    }
  )
}

/** Slugs des produits épuisés. En cas d'erreur, aucun : mieux vaut vendre que bloquer. */
export async function getRuptures(): Promise<Set<string>> {
  try {
    const { data, error } = await clientStock().from('stock_epuise').select('slug')
    if (error) return new Set()
    return etendreAuxLies(new Set((data ?? []).map((r) => r.slug as string)))
  } catch {
    return new Set()
  }
}

function appliquer(product: Product, ruptures: Set<string>): Product {
  return ruptures.has(product.slug) ? { ...product, stock: 0 } : product
}

/** Tout le catalogue, stock réel appliqué. */
export async function chargerProduits(): Promise<Product[]> {
  const ruptures = await getRuptures()
  return PRODUCTS.map((p) => appliquer(p, ruptures))
}

/** Un produit, stock réel appliqué. */
export async function chargerProduit(slug: string): Promise<Product | undefined> {
  const product = getProductBySlug(slug)
  if (!product) return undefined
  return appliquer(product, await getRuptures())
}

/** À appeler après toute écriture dans `stock_epuise`. */
export function invaliderStock() {
  revalidateTag(STOCK_TAG)
}
