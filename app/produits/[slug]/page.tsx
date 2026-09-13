import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, Truck } from 'lucide-react'
import { getProductBySlug, getRelatedProducts, PRODUCTS } from '@/lib/products'
import { formatPrice } from '@/lib/utils'
import ProductGallery from '@/components/shop/ProductGallery'
import ProductAccordion from '@/components/shop/ProductAccordion'
import QuantitySelector from '@/components/shop/QuantitySelector'
import ProductGrid from '@/components/shop/ProductGrid'
import TrustpilotBadge from '@/components/shop/TrustpilotBadge'

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }))
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const product = getProductBySlug(slug)
  return { title: product?.name ?? 'Produit' }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = getProductBySlug(slug)
  if (!product) notFound()

  const related = getRelatedProducts(product)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
        <Link href="/" className="hover:text-brand-600">Accueil</Link>
        <ChevronRight size={12} />
        <Link href="/produits" className="hover:text-brand-600">Catalogue</Link>
        <ChevronRight size={12} />
        <span className="text-gray-600 line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10">
        <ProductGallery image={product.image} name={product.name} />

        <div>
          {product.category && (
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-2">{product.category.name}</p>
          )}
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink mb-2 leading-tight">{product.name}</h1>
          {product.tagline && <p className="text-gray-500 mb-3">{product.tagline}</p>}

          <div className="mb-4">
            <TrustpilotBadge />
          </div>

          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl font-bold text-ink">{formatPrice(product.price)}</span>
          </div>
          <p className="flex items-center gap-1.5 text-sm text-brand-700 font-medium mb-6">
            <Truck size={15} />
            Livraison offerte pour votre première commande
          </p>

          <QuantitySelector product={product} />

          <div className="mt-8">
            <ProductAccordion description={product.description} specs={product.specs} />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-serif text-2xl font-bold text-ink mb-6">Vous aimerez aussi</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  )
}
