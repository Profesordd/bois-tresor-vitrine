import type { Product, Lot } from '@/types/database'

/**
 * Produits vendus par lot : une seule fiche, plusieurs formats, chacun avec
 * son propre identifiant de checkout.
 *
 * Le reste du site (panier, checkout, mesure, Meta) ne connaît que des
 * produits. Plutôt que de leur apprendre les lots, on fabrique au moment
 * du choix un « produit dérivé » qui porte le prix, l'identifiant et le
 * multiplicateur du lot : tout l'aval fonctionne sans changement.
 */

/** Lots réellement commandables : ceux dont l'identifiant Shopify est connu. */
export function lotsDisponibles(product: Product): Lot[] {
  return (product.lots ?? []).filter((l) => l.variantId)
}

export function lotParDefaut(product: Product): Lot | undefined {
  const lots = lotsDisponibles(product)
  return lots.find((l) => l.id === product.defaultLotId) ?? lots[0]
}

/** Prix d'appel de la fiche et de la carte : le lot le moins cher. */
export function prixMinimum(product: Product): number {
  const lots = lotsDisponibles(product)
  return lots.length > 0 ? Math.min(...lots.map((l) => l.price)) : product.price
}

/** Meilleur prix au sac, atteint sur le plus grand lot. */
export function prixAuSacMinimum(product: Product): number | null {
  const lots = lotsDisponibles(product)
  return lots.length > 0 ? Math.min(...lots.map((l) => l.price / l.sacs)) : null
}

export function libelleLot(lot: Lot): string {
  return lot.label ?? `${lot.sacs} sacs`
}

/** Le produit tel qu'il entre dans la commande : un lot précis, à son prix. */
export function produitDuLot(product: Product, lot: Lot): Product {
  const { lots: _lots, defaultLotId: _def, ...base } = product
  return {
    ...base,
    id: `${product.id}:${lot.id}`,
    name: `${product.name} — ${libelleLot(lot)} (${lot.poids})`,
    price: lot.price,
    variantId: lot.variantId,
    checkoutMultiplier: lot.checkoutMultiplier,
    lot,
  }
}
