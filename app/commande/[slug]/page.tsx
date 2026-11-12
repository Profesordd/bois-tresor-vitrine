import { notFound } from 'next/navigation'
import { getProductBySlug } from '@/lib/products'
import { lotsDisponibles, lotParDefaut } from '@/lib/lots'
import FormulaireCommande from '@/components/shop/FormulaireCommande'

/**
 * Checkout maison, réservé aux fiches qui portent `checkoutInterne`.
 *
 * Toutes les autres continuent de passer par le prestataire externe : une
 * adresse fabriquée à la main sur un produit ordinaire renvoie donc une
 * page introuvable, et aucun client ne peut arriver ici par hasard.
 *
 * Le lot se choisit par `?lot=<id>`, comme sur la fiche produit.
 */

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ lot?: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const produit = getProductBySlug(slug)
  return {
    title: produit ? `Commander — ${produit.name}` : 'Commander',
    robots: { index: false, follow: false },
  }
}

export default async function CommandePage({ params, searchParams }: Props) {
  const { slug } = await params
  const { lot: lotVoulu } = await searchParams

  const produit = getProductBySlug(slug)
  if (!produit || !produit.checkoutInterne) notFound()

  const lots = lotsDisponibles(produit)
  const lot = lots.length > 0
    ? (lots.find((l) => l.id === lotVoulu) ?? lotParDefaut(produit) ?? lots[0])
    : null
  const montant = lot ? lot.price : produit.price

  return <FormulaireCommande product={produit} lot={lot} montant={montant} />
}
