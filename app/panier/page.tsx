'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Trash2, ShoppingBag, Truck, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useCartStore } from '@/stores/cart'
import { formatPrice } from '@/lib/utils'
import ProductVisual from '@/components/shop/ProductVisual'

const FREE_SHIPPING = 150
const SHIPPING_COST = 14.9

export default function PanierPage() {
  const { items, removeItem, updateQuantity, getTotalPrice, getTotalItems, clearCart } = useCartStore()
  const [confirmed, setConfirmed] = useState<{ orderNumber: string; total: number } | null>(null)

  const total = getTotalPrice()
  const count = getTotalItems()
  const shipping = total >= FREE_SHIPPING ? 0 : SHIPPING_COST
  const grandTotal = total + shipping
  const remaining = FREE_SHIPPING - total

  function handleConfirm() {
    const orderNumber = Math.random().toString(36).slice(2, 8).toUpperCase()
    setConfirmed({ orderNumber, total: grandTotal })
    clearCart()
  }

  if (confirmed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <CheckCircle2 size={64} className="mx-auto text-brand-500 mb-6" />
        <h1 className="font-serif text-3xl font-bold text-brand-900 mb-4">Récapitulatif de commande</h1>
        <p className="text-brand-600 mb-2">
          Commande de démonstration <strong>#{confirmed.orderNumber}</strong> — total {formatPrice(confirmed.total)}.
        </p>
        <p className="text-sm text-brand-500 bg-brand-50 border border-brand-100 rounded-xl p-4 mt-6 mb-8">
          Ceci est une démonstration visuelle : aucun paiement n’a été effectué et aucune commande réelle n’a été enregistrée.
          Le paiement en ligne sera activé après validation du site.
        </p>
        <Link
          href="/produits"
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          Retour au catalogue
          <ArrowRight size={18} />
        </Link>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <ShoppingBag size={64} className="mx-auto text-brand-200 mb-6" />
        <h1 className="font-serif text-3xl font-bold text-brand-900 mb-4">Votre panier est vide</h1>
        <p className="text-brand-500 mb-8">Découvrez notre bois de chauffage et nos granulés premium.</p>
        <Link
          href="/produits"
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          Voir le catalogue
          <ArrowRight size={18} />
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-serif text-3xl font-bold text-brand-900 mb-2">Panier</h1>
      <p className="text-brand-500 mb-8 text-sm">
        {count} article{count !== 1 ? 's' : ''}
      </p>

      {total < FREE_SHIPPING && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-brand-700 mb-2">
            <Truck size={16} />
            <span>Plus que <strong>{formatPrice(remaining)}</strong> pour la livraison offerte !</span>
          </div>
          <div className="w-full bg-brand-200 rounded-full h-2">
            <div
              className="bg-brand-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min((total / FREE_SHIPPING) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
      {total >= FREE_SHIPPING && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-3 mb-6 flex items-center gap-2 text-brand-700 text-sm font-semibold">
          <Truck size={16} />
          Livraison offerte !
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex gap-4 bg-white rounded-xl p-4 shadow-sm">
              <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                <ProductVisual subtype={product.subtype} />
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/produits/${product.slug}`}
                  className="font-medium text-brand-900 hover:text-brand-600 line-clamp-2 text-sm"
                >
                  {product.name}
                </Link>
                <p className="text-brand-600 font-semibold mt-1">{formatPrice(product.price)}</p>
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center border border-brand-200 rounded-lg hover:bg-brand-50 text-brand-600 font-bold"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-semibold">{quantity}</span>
                  <button
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center border border-brand-200 rounded-lg hover:bg-brand-50 text-brand-600 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between flex-shrink-0">
                <button
                  onClick={() => removeItem(product.id)}
                  className="text-brand-300 hover:text-promo transition-colors"
                  aria-label="Supprimer"
                >
                  <Trash2 size={18} />
                </button>
                <span className="font-bold text-brand-900">{formatPrice(product.price * quantity)}</span>
              </div>
            </div>
          ))}

          <Link href="/produits" className="inline-flex items-center gap-1 text-sm text-brand-500 hover:text-brand-600 mt-2">
            ← Continuer mes achats
          </Link>
        </div>

        <div>
          <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
            <h2 className="font-serif text-xl font-semibold mb-5">Récapitulatif</h2>
            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between text-brand-600">
                <span>Sous-total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-brand-600">
                <span>Livraison</span>
                <span className={shipping === 0 ? 'text-brand-700 font-semibold' : ''}>
                  {shipping === 0 ? 'Gratuite' : formatPrice(SHIPPING_COST)}
                </span>
              </div>
            </div>
            <div className="border-t border-brand-100 pt-4 mb-5">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
              <p className="text-xs text-brand-400 mt-1">TTC, livraison incluse</p>
            </div>
            <button
              onClick={handleConfirm}
              className="flex items-center justify-center gap-2 w-full bg-brand-500 hover:bg-brand-600 text-white py-3.5 rounded-lg font-semibold transition-colors"
            >
              Passer commande
              <ArrowRight size={18} />
            </button>
            <p className="text-xs text-brand-400 text-center mt-3">
              Démonstration — aucun paiement réel ne sera demandé.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
