import Link from 'next/link'
import { Truck, Flame } from 'lucide-react'
import type { Product } from '@/types/database'
import { formatPrice } from '@/lib/utils'
import ProductVisual from '@/components/shop/ProductVisual'
import AddToCartButton from '@/components/shop/AddToCartButton'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { slug, name, price, original_price, stock, image, family } = product
  const isOutOfStock = stock === 0
  const hasPromo = original_price !== null && original_price > price

  return (
    <div className="group bg-white rounded-lg border-2 border-gray-100 hover:border-brand-300 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">

      <Link href={`/produits/${slug}`} className="block relative aspect-[4/3] overflow-hidden flex-shrink-0 bg-gray-50">
        <ProductVisual image={image} name={name} className="group-hover:scale-105 transition-transform duration-500" />

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-ink text-white text-base font-semibold px-4 py-2 rounded-lg">
              Rupture de stock
            </span>
          </div>
        )}
      </Link>

      {/* Deux cartes par ligne sur téléphone : tout le contenu se resserre
          d'un cran en dessous de 640 px pour rester lisible sans déborder. */}
      <div className="p-3 sm:p-5 flex flex-col flex-1 gap-2 sm:gap-3">
        <Link href={`/produits/${slug}`}>
          <h3 className="text-[15px] sm:text-lg font-bold text-ink hover:text-brand-700 transition-colors leading-snug">
            {name}
          </h3>
        </Link>

        <p className="flex items-center gap-1.5 sm:gap-2 text-[13px] sm:text-[15px] text-gray-700">
          <Flame size={14} className="text-brand-600 flex-shrink-0 sm:hidden" />
          <Flame size={16} className="text-brand-600 flex-shrink-0 hidden sm:block" />
          {family === 'granules' ? 'Granulés prêts à l’emploi' : 'Bois sec, prêt à brûler'}
        </p>

        <div className="mt-auto pt-1 flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl sm:text-3xl font-bold text-ink">{formatPrice(price)}</span>
          {hasPromo && (
            <span className="text-base sm:text-lg text-gray-400 line-through">
              {formatPrice(original_price!)}
            </span>
          )}
        </div>

        <p className="flex items-center gap-1.5 sm:gap-2 text-[13px] sm:text-[15px] font-semibold text-brand-700">
          <Truck size={14} className="flex-shrink-0 sm:hidden" />
          <Truck size={16} className="flex-shrink-0 hidden sm:block" />
          Livraison offerte dès 89 €
        </p>

        <AddToCartButton product={product} />
      </div>
    </div>
  )
}
