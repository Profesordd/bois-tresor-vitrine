'use client'

import Link from 'next/link'
import { ShoppingCart, Mail } from 'lucide-react'
import { useState } from 'react'
import { useCartStore } from '@/stores/cart'
import type { Product } from '@/types/database'
import { cn } from '@/lib/utils'
import { buildCheckoutUrl } from '@/lib/checkout'
import { trackAddToCartThenRedirect } from '@/lib/analytics/meta'

interface AddToCartButtonProps {
  product: Product
  quantity?: number
  compact?: boolean
}

export default function AddToCartButton({ product, quantity = 1, compact }: AddToCartButtonProps) {
  const { clearCart, addItem } = useCartStore()
  const [redirecting, setRedirecting] = useState(false)
  const isOutOfStock = product.stock === 0

  /**
   * Achat direct : un clic mène au paiement, sans étape intermédiaire.
   * Le panier est synchronisé avec ce seul article pour qu'un retour arrière
   * affiche exactement ce que le client s'apprêtait à payer.
   */
  function handleBuy() {
    if (isOutOfStock) return
    const url = buildCheckoutUrl([{ product, quantity }])
    if (!url) return
    clearCart()
    addItem(product, quantity)
    setRedirecting(true)
    /* AddToCart part avant la redirection : sans ce signal, aucune audience
       « panier abandonné » ne peut être constituée côté Meta. */
    trackAddToCartThenRedirect(product, quantity, url)
  }

  /* Pas d'identifiant de checkout = le produit ne peut pas être payé en ligne. */
  if (!product.variantId) {
    return (
      <Link
        href="/contact"
        className={cn(
          'w-full flex items-center justify-center gap-2 rounded-lg font-semibold border-2 border-brand-600 text-brand-700 hover:bg-brand-50 transition-colors',
          compact ? 'py-2.5 text-sm' : 'py-3 text-[15px] sm:py-4 sm:text-lg'
        )}
      >
        <Mail size={compact ? 16 : 20} />
        Nous consulter
      </Link>
    )
  }

  if (isOutOfStock) {
    return (
      <button
        disabled
        className={cn(
          'w-full flex items-center justify-center gap-2 rounded-lg font-semibold cursor-not-allowed bg-gray-100 text-gray-400',
          compact ? 'py-2.5 text-sm' : 'py-3 text-[15px] sm:py-4 sm:text-lg'
        )}
      >
        Rupture de stock
      </button>
    )
  }

  return (
    <button
      onClick={handleBuy}
      disabled={redirecting}
      className={cn(
        'w-full flex items-center justify-center gap-1.5 sm:gap-2.5 rounded-lg font-bold transition-colors shadow-sm bg-brand-600 hover:bg-brand-700 disabled:opacity-70 text-white',
        compact ? 'py-2.5 text-sm' : 'py-3 text-[14px] sm:py-4 sm:text-lg'
      )}
    >
      {redirecting ? (
        'Redirection…'
      ) : (
        <>
          {/* Sous 360 px, l'icône est sacrifiée pour que le mot « Commander »
              tienne en entier dans une carte de demi-largeur. */}
          <ShoppingCart
            size={compact ? 16 : 22}
            className={compact ? '' : 'hidden min-[360px]:block sm:block'}
          />
          Commander
        </>
      )}
    </button>
  )
}
