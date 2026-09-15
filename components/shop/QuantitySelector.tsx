'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Minus, Plus, ShoppingCart, Check, Mail } from 'lucide-react'
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

  /* Pas d'identifiant de checkout : le produit n'est pas encore payable en
     ligne, on oriente vers le contact au lieu d'un panier sans issue. */
  if (!product.variantId) {
    return (
      <div className="space-y-3">
        <Link
          href="/contact"
          className="w-full py-5 rounded-lg font-bold text-xl flex items-center justify-center gap-3 border-2 border-brand-600 text-brand-700 hover:bg-brand-50 transition-colors"
        >
          <Mail size={24} />
          Nous consulter pour commander
        </Link>
        <p className="text-center text-[15px] text-gray-600">
          Ce produit n’est pas encore commandable en ligne. Écrivez-nous, nous vous répondons
          sous 24 h ouvrées.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-base font-semibold text-gray-700">Quantité</span>
        <div className="flex items-center">
          <button
            onClick={dec}
            disabled={qty <= 1}
            aria-label="Retirer un article"
            className="w-14 h-14 border-2 border-gray-200 rounded-l-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            <Minus size={20} />
          </button>
          <div className="w-16 h-14 border-t-2 border-b-2 border-gray-200 flex items-center justify-center font-bold text-ink text-xl">
            {qty}
          </div>
          <button
            onClick={inc}
            aria-label="Ajouter un article"
            className="w-14 h-14 border-2 border-gray-200 rounded-r-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {isOutOfStock ? (
        <button disabled className="w-full py-5 rounded-lg bg-gray-100 text-gray-400 font-bold text-lg cursor-not-allowed">
          Rupture de stock
        </button>
      ) : (
        <button
          onClick={handleAdd}
          className={`w-full py-5 rounded-lg font-bold text-xl flex items-center justify-center gap-3 transition-all duration-200 shadow-md
            ${added
              ? 'bg-brand-800 text-white'
              : 'bg-brand-600 hover:bg-brand-700 text-white hover:shadow-lg'
            }`}
        >
          {added ? (
            <><Check size={26} strokeWidth={2.5} />Ajouté au panier</>
          ) : (
            <><ShoppingCart size={26} />Commander maintenant</>
          )}
        </button>
      )}
    </div>
  )
}
