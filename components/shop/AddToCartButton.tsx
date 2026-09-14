'use client'

import { ShoppingCart, Check } from 'lucide-react'
import { useState } from 'react'
import { useCartStore } from '@/stores/cart'
import type { Product } from '@/types/database'
import { cn } from '@/lib/utils'

interface AddToCartButtonProps {
  product: Product
  quantity?: number
  compact?: boolean
}

export default function AddToCartButton({ product, quantity = 1, compact }: AddToCartButtonProps) {
  const { addItem } = useCartStore()
  const [added, setAdded] = useState(false)
  const isOutOfStock = product.stock === 0

  function handleAdd() {
    if (isOutOfStock) return
    addItem(product, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (isOutOfStock) {
    return (
      <button
        disabled
        className={cn(
          'w-full flex items-center justify-center gap-2 rounded-xl font-semibold cursor-not-allowed bg-gray-100 text-gray-400',
          compact ? 'py-2.5 text-sm' : 'py-4 text-lg'
        )}
      >
        Rupture de stock
      </button>
    )
  }

  return (
    <button
      onClick={handleAdd}
      className={cn(
        'w-full flex items-center justify-center gap-2.5 rounded-xl font-bold transition-colors shadow-sm',
        compact ? 'py-2.5 text-sm' : 'py-4 text-lg',
        added
          ? 'bg-brand-800 text-white'
          : 'bg-brand-600 hover:bg-brand-700 text-white'
      )}
    >
      {added ? (
        <>
          <Check size={compact ? 16 : 22} />
          Ajouté au panier
        </>
      ) : (
        <>
          <ShoppingCart size={compact ? 16 : 22} />
          {compact ? 'Ajouter' : 'Ajouter au panier'}
        </>
      )}
    </button>
  )
}
