import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
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

  /* Fond gris comme le modèle : les blocs blancs doivent se détacher. */
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <Link
          href={`/produits/${produit.slug}/`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5"
        >
          <ArrowLeft size={15} /> Revenir au produit
        </Link>

        <FormulaireCommande product={produit} lot={lot} montant={montant} />
      </div>
    </div>
  )
}
