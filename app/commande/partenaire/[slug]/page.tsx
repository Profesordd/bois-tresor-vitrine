import { notFound } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { getProductBySlug } from '@/lib/products'
import { lotsDisponibles, lotParDefaut } from '@/lib/lots'
import FormulaireCommande from '@/components/shop/FormulaireCommande'

/**
 * Checkout du canal partenaire.
 *
 * Un autre site, qui vend nos produits, redirige ses paiements vers ces
 * adresses. Même formulaire, même CAWL que le checkout du site, mais la
 * commande est marquée « partenaire » et apparaît dans son propre tableau
 * de bord, séparé de celui de bois-tresor.
 *
 * À la différence du checkout du site, il n'exige pas `checkoutInterne` :
 * ce sont nos produits, le montant sort du catalogue, et la quantité se
 * règle sur place. Un produit masqué reste introuvable.
 */

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ lot?: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const produit = getProductBySlug(slug)
  /* Titre absolu : on écarte le suffixe « | Bois Tresor » du gabarit. Rien
     de bois-tresor ne doit apparaître, pas même dans l'onglet. */
  return {
    title: { absolute: produit ? `Commander — ${produit.name}` : 'Commander' },
    robots: { index: false, follow: false },
  }
}

export default async function CommandePartenairePage({ params, searchParams }: Props) {
  const { slug } = await params
  const { lot: lotVoulu } = await searchParams

  const produit = getProductBySlug(slug)
  /* Masqué de bois-tresor, mais les produits du partenaire y sont
     légitimes : le drapeau `partenaireOnly` les laisse passer. */
  if (!produit || (produit.unlisted && !produit.partenaireOnly)) notFound()

  const lots = lotsDisponibles(produit)
  const lot = lots.length > 0
    ? (lots.find((l) => l.id === lotVoulu) ?? lotParDefaut(produit) ?? lots[0])
    : null
  const montant = lot ? lot.price : produit.price

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <p className="inline-flex items-center gap-1.5 text-sm text-gray-500 mb-5">
          <ShieldCheck size={15} className="text-brand-600" /> Paiement sécurisé
        </p>

        <FormulaireCommande
          product={produit} lot={lot} montant={montant}
          canal="partenaire"
          redirectSucces={process.env.PARTENAIRE_REDIRECT_URL ?? null}
        />
      </div>
    </div>
  )
}
