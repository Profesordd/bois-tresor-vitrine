import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, Check, Truck, Lock } from 'lucide-react'
import { getProductBySlug, getRelatedProducts, PRODUCTS } from '@/lib/products'
import { formatPrice } from '@/lib/utils'
import ProductGallery from '@/components/shop/ProductGallery'
import ProductDetails from '@/components/shop/ProductDetails'
import QuantitySelector from '@/components/shop/QuantitySelector'
import ProductGrid from '@/components/shop/ProductGrid'
import VideoSlot from '@/components/shop/VideoSlot'
import BuyReassurance from '@/components/ui/BuyReassurance'
import FamilyBlock from '@/components/ui/FamilyBlock'
import UrgencyNote from '@/components/ui/UrgencyNote'

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }))
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const product = getProductBySlug(slug)
  return {
    title: product?.name ?? 'Produit',
    description: product?.keyPoints[0],
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = getProductBySlug(slug)
  if (!product) notFound()

  const related = getRelatedProducts(product)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-brand-700">Accueil</Link>
        <ChevronRight size={14} />
        <Link href="/produits" className="hover:text-brand-700">Catalogue</Link>
        <ChevronRight size={14} />
        <span className="text-gray-700 line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-14">

        {/* ── Colonne visuelle : photo réelle + vidéo + qui nous sommes ── */}
        <div className="space-y-5">
          <ProductGallery image={product.image} name={product.name} />
          {/* Sur mobile, ces blocs passent après le prix et le bouton. */}
          <div className="hidden lg:block space-y-5">
            <VideoSlot />
            <FamilyBlock variant="compact" />
          </div>
        </div>

        {/* ── Colonne achat ── */}
        <div>
          {product.category && (
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-700 mb-2">
              {product.category.name}
            </p>
          )}
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink mb-5 leading-tight">
            {product.name}
          </h1>

          <p className="text-4xl font-bold text-ink mb-2">{formatPrice(product.price)}</p>
          <p className="flex items-center gap-2 text-lg font-semibold text-brand-700 mb-7">
            <Truck size={20} />
            Livraison offerte pour votre 1ère commande
          </p>

          {/* ── L'essentiel, un sujet par ligne ── */}
          <ul className="space-y-3.5 mb-8">
            {product.keyPoints.map((point) => (
              <li key={point} className="flex gap-3 text-[17px] text-gray-800 leading-snug">
                <Check size={21} className="text-brand-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <span>{point}</span>
              </li>
            ))}
          </ul>

          <QuantitySelector product={product} />

          <div className="mt-6">
            <BuyReassurance />
          </div>

          <p className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-6">
            <Lock size={15} />
            Tout se règle en ligne, de façon sécurisée. Aucun paiement par téléphone.
          </p>

          <div className="mt-6 lg:hidden space-y-5">
            <VideoSlot />
            <FamilyBlock variant="compact" />
          </div>
        </div>
      </div>

      <div className="mt-12">
        <ProductDetails specs={product.specs} />
      </div>

      <div className="mt-10">
        <UrgencyNote />
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="font-serif text-2xl font-bold text-ink mb-6">Nos autres produits</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  )
}
