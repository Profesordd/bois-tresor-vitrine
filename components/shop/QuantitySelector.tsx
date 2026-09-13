'use client'

import { useState } from 'react'
import { Minus, Plus, ShoppingCart, Check } from 'lucide-react'
import { useCartStore } from '@/stores/cart'
import type { Product } from '@/types/database'

interface Props {
  product: Product
}

export default function QuantitySelector({ product }: Props) {
  const [qty, setQty]     = useState(1)
  const [added, setAdded] = useState(false)
  const { addItem }       = useCartStore()
  const isOutOfStock      = product.stock === 0

  function dec() { setQty(q => Math.max(1, q - 1)) }
  function inc() { setQty(q => q + 1) }

  function handleAdd() {
    if (isOutOfStock) return
    addItem(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-0">
        <button
          onClick={dec}
          disabled={qty <= 1}
          className="w-12 h-12 border border-brand-200 rounded-l-xl flex items-center justify-center text-brand-600 hover:bg-brand-50 disabled:opacity-40 transition-colors"
        >
          <Minus size={16} />
        </button>
        <div className="w-16 h-12 border-t border-b border-brand-200 flex items-center justify-center font-bold text-brand-900 text-lg">
          {qty}
        </div>
        <button
          onClick={inc}
          className="w-12 h-12 border border-brand-200 rounded-r-xl flex items-center justify-center text-brand-600 hover:bg-brand-50 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>

      {isOutOfStock ? (
        <button disabled className="w-full py-4 rounded-xl bg-brand-100 text-brand-400 font-semibold cursor-not-allowed">
          Rupture de stock
        </button>
      ) : (
        <button
          onClick={handleAdd}
          className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2.5 transition-all duration-200
            ${added
              ? 'bg-brand-700 text-white'
              : 'bg-brand-900 hover:bg-brand-800 text-white shadow-md hover:shadow-lg'
            }`}
        >
          {added ? (
            <><Check size={20} />Ajouté au panier !</>
          ) : (
            <><ShoppingCart size={20} />Ajouter au panier</>
          )}
        </button>
      )}

      <p className="text-center text-xs text-brand-400 flex items-center justify-center gap-1.5">
        <svg className="w-3.5 h-3.5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
        Paiement sécurisé — démonstration, aucun débit réel
      </p>
    </div>
  )
}
