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
          'w-full flex items-center justify-center gap-2 rounded-lg font-medium transition-colors cursor-not-allowed',
          compact ? 'py-2 text-sm' : 'py-3',
          'bg-brand-100 text-brand-400'
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
        'w-full flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        compact ? 'py-2 text-sm' : 'py-3',
        added
          ? 'bg-brand-700 text-white'
          : 'bg-brand-900 hover:bg-brand-800 text-white'
      )}
    >
      {added ? (
        <>
          <Check size={16} />
          Ajouté !
        </>
      ) : (
        <>
          <ShoppingCart size={16} />
          {compact ? 'Ajouter' : 'Ajouter au panier'}
        </>
      )}
    </button>
  )
}
