import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, Check, Truck, Lock, Award, Tag, PackageCheck } from 'lucide-react'
import { getProductBySlug, getRelatedProducts, PRODUCTS } from '@/lib/products'
import { chargerProduit, getRuptures } from '@/lib/stock'
import { formatPrice } from '@/lib/utils'
import ProductGallery from '@/components/shop/ProductGallery'
import ProductDetails from '@/components/shop/ProductDetails'
import ProductDescription from '@/components/shop/ProductDescription'
import QuantitySelector from '@/components/shop/QuantitySelector'
import LotSelector from '@/components/shop/LotSelector'
import { lotsDisponibles } from '@/lib/lots'
import ProductGrid from '@/components/shop/ProductGrid'
import ViewContentTracker from '@/components/analytics/ViewContentTracker'
import LivraisonPays from '@/components/ui/LivraisonPays'
import StarRating from '@/components/shop/StarRating'
import Testimonials from '@/components/shop/Testimonials'
import TeamPhoto from '@/components/shop/TeamPhoto'
import ProductFaq from '@/components/shop/ProductFaq'
import BuyReassurance from '@/components/ui/BuyReassurance'
import UrgencyNote from '@/components/ui/UrgencyNote'
import SocialProof from '@/components/ui/SocialProof'

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
  const product = await chargerProduit(slug)
  if (!product) notFound()

  const ruptures = await getRuptures()
  const related = getRelatedProducts(product).map((p) =>
    ruptures.has(p.slug) ? { ...p, stock: 0 } : p
  )
  const hasPromo = product.original_price !== null && product.original_price > product.price
  const isDestockage = product.badge === 'destockage'
  const remise = hasPromo ? Math.round((1 - product.price / product.original_price!) * 100) : 0
  /* Vendu par lot : le choix, le prix et le bouton vivent dans LotSelector,
     placé juste sous le titre — le prix est l'argument de ce produit. */
  const parLot = lotsDisponibles(product).length > 0 && product.stock > 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ViewContentTracker product={product} />

      <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-brand-700">Accueil</Link>
        <ChevronRight size={14} />
        <Link href="/produits" className="hover:text-brand-700">Catalogue</Link>
        <ChevronRight size={14} />
        <span className="text-gray-700 line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-14">

        {/* ── Colonne visuelle : photo produit + photo de l'équipe ── */}
        <div className="space-y-5">
          <ProductGallery image={product.image} name={product.name} />
          {/* Sur mobile, ces blocs passent après le prix et le bouton. */}
          <div className="hidden lg:block space-y-5">
            <TeamPhoto />
          </div>
        </div>

        {/* ── Colonne achat ── */}
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-2">
            {product.category && (
              <p className="text-sm font-semibold uppercase tracking-wider text-brand-700">
                {product.category.name}
              </p>
            )}
            {product.badge === 'bestseller' && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-ink text-white text-[13px] font-semibold px-2.5 py-1">
                <Award size={15} />
                Le plus vendu
              </span>
            )}
            {isDestockage && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-red-700 text-white text-[13px] font-semibold px-2.5 py-1">
                <Tag size={15} />
                {hasPromo ? `Déstockage −${remise} %` : 'Prix déstockage'}
              </span>
            )}
            {product.stock === 1 && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 text-ink text-[13px] font-semibold px-2.5 py-1">
                <PackageCheck size={15} />
                Dernier exemplaire en stock
              </span>
            )}
            {product.stock === 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-200 text-gray-700 text-[13px] font-semibold px-2.5 py-1">
                Rupture de stock
              </span>
            )}
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink mb-3 leading-tight">
            {product.name}
          </h1>

          <StarRating className="mb-5" size={17} />

          {parLot && (
            <div className="mb-8">
              <LotSelector product={product} />
            </div>
          )}

          {!parLot && (<>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-4xl font-bold text-ink">{formatPrice(product.price)}</span>
            {hasPromo && (
              <span className="text-2xl text-gray-400 line-through">
                {formatPrice(product.original_price!)}
              </span>
            )}
          </div>
          {/* Pas de compte à rebours : une urgence fabriquée est exactement
              ce qui fait fuir un acheteur méfiant, et c'est interdit. On dit
              ce qui est vrai : le stock est limité, le prix tient tant qu'il
              en reste. */}
          {isDestockage && (
            <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[15px] text-red-900 leading-snug">
              <span className="font-semibold">Offre de déstockage</span> — dans la limite des
              stocks disponibles. Prix habituel {formatPrice(product.original_price!)}.
            </p>
          )}
          {/* Le prix au stère est l'unité que connaît le client : il rend la
              palette comparable à ce qu'il a toujours payé. */}
          {product.pricePerStere !== null && (
            <p className="text-lg text-gray-700 mt-1">
              soit <span className="font-semibold text-ink">{formatPrice(product.pricePerStere)}</span> le stère
            </p>
          )}
          <p className="flex items-center gap-2 text-lg font-semibold text-brand-700 mt-2 mb-3">
            <Truck size={20} />
            Livraison offerte
          </p>
          </>)}

          {/* Visible depuis la Belgique ou la Suisse, juste sous le prix :
              c'est là que le doute « suis-je concerné ? » se pose. */}
          <div className="mb-7 empty:mb-0">
            <LivraisonPays />
          </div>

          {/* ── L'essentiel, un sujet par ligne ── */}
          <ul className="space-y-3.5 mb-8">
            {product.keyPoints.map((point) => (
              <li key={point} className="flex gap-3 text-[17px] text-gray-800 leading-snug">
                <Check size={21} className="text-brand-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <span>{point}</span>
              </li>
            ))}
          </ul>

          <div className="mb-5">
            <SocialProof variant="inline" />
          </div>

          {!parLot && <QuantitySelector product={product} />}

          <div className="mt-6">
            <BuyReassurance />
          </div>

          <p className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-6">
            <Lock size={15} />
            Tout se règle en ligne, de façon sécurisée.
          </p>

          <div className="mt-6 lg:hidden space-y-5">
            <TeamPhoto />
          </div>
        </div>
      </div>

      <div className="mt-12">
        <ProductDetails specs={product.specs} />
      </div>

      {product.richDescription && product.description && (
        <div className="mt-8">
          <ProductDescription html={product.description} />
        </div>
      )}

      {/* ── Avis clients : la preuve sociale doit être sur la fiche, pas
             seulement sur l'accueil que le client ne voit jamais. ── */}
      <div className="mt-12 rounded-lg bg-brand-50 p-6 sm:p-8">
        <Testimonials
          background={false}
          title="Ce qu’en disent nos clients"
        />
      </div>

      <div className="mt-10">
        <UrgencyNote />
      </div>

      <div className="mt-12 max-w-3xl">
        <ProductFaq />
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
