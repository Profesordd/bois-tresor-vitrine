import { notFound } from 'next/navigation'
import { CATEGORIES } from '@/lib/products'
import CollectionView from '@/components/shop/CollectionView'
import { chargerProduits } from '@/lib/stock'

/**
 * URL historique du site WooCommerce : /product-category/<slug>/
 *
 * Les campagnes publicitaires pointent déjà vers ces adresses. Elles sont
 * donc servies telles quelles, sans redirection — changer d'URL obligerait
 * à reprendre toutes les annonces, et une redirection ferait perdre le
 * paramétrage de destination des campagnes en cours.
 */

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }))
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const category = CATEGORIES.find((c) => c.slug === slug)
  if (!category) return { title: 'Catalogue' }

  return {
    title: `${category.name} — livraison offerte`,
    description:
      'Entreprise familiale française. Bois de chauffage sec prêt à brûler (moins de 20 % d’humidité) et granulés certifiés. Livraison offerte, paiement sécurisé.',
    alternates: { canonical: `/product-category/${category.slug}/` },
  }
}

export default async function ProductCategoryPage({ params }: Props) {
  const { slug } = await params
  const category = CATEGORIES.find((c) => c.slug === slug)
  if (!category) notFound()

  return <CollectionView categorySlug={category.slug} allProducts={await chargerProduits()} />
}
