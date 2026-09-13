import Link from 'next/link'
import { Truck } from 'lucide-react'
import type { Product } from '@/types/database'
import { formatPrice, calcDiscountPercent } from '@/lib/utils'
import ProductVisual from '@/components/shop/ProductVisual'
import AddToCartButton from '@/components/shop/AddToCartButton'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { slug, name, tagline, price, original_price, stock, badge, subtype } = product
  const isOutOfStock = stock === 0
  const hasPromo      = original_price !== null && original_price > price
  const discount      = hasPromo ? calcDiscountPercent(price, original_price!) : 0

  return (
    <div className="group bg-white rounded-2xl border border-brand-100 hover:border-brand-300 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">

      <Link href={`/produits/${slug}`} className="block relative aspect-square overflow-hidden flex-shrink-0">
        <ProductVisual subtype={subtype} className="group-hover:scale-105 transition-transform duration-500" />

        {hasPromo && (
          <div className="absolute top-3 left-3 bg-promo text-white text-xs font-bold px-2.5 py-1 rounded-lg">
            -{discount}%
          </div>
        )}

        {badge === 'new' && !hasPromo && (
          <div className="absolute top-3 right-3 bg-ember-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
            Nouveauté
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-brand-900 text-white text-sm font-semibold px-4 py-2 rounded-xl">
              Rupture de stock
            </span>
          </div>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1 gap-2">
        <Link href={`/produits/${slug}`}>
          <h3 className="text-sm font-semibold text-brand-900 hover:text-brand-600 transition-colors line-clamp-2 leading-snug">
            {name}
          </h3>
        </Link>

        {tagline && <p className="text-xs text-brand-500 line-clamp-1">{tagline}</p>}

        <div className="flex items-baseline gap-2 mt-auto pt-1">
          <span className="text-lg font-bold text-brand-900">{formatPrice(price)}</span>
          {hasPromo && (
            <span className="text-sm text-brand-300 line-through font-normal">{formatPrice(original_price!)}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-brand-600 font-medium">
          <Truck size={12} className="flex-shrink-0" />
          <span>Livraison offerte dès 150 €</span>
        </div>

        <AddToCartButton product={product} compact />
      </div>
    </div>
  )
}
