'use client'

import { X, Trash2, ShoppingBag, Truck, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useCartStore } from '@/stores/cart'
import { formatPrice } from '@/lib/utils'
import { maxParCommande, messageLimite } from '@/lib/checkout'
import ProductVisual from '@/components/shop/ProductVisual'

/** Au-delà, la commande date d'une visite précédente : on le dit. */
const ANCIENNE_APRES_MS = 2 * 60 * 60 * 1000

export default function CartDrawer() {
  const [mounted, setMounted] = useState(false)
  const { items, isOpen, setOpen, removeItem, updateQuantity, clearCart, getTotalPrice, getTotalItems, startedAt } =
    useCartStore()

  useEffect(() => setMounted(true), [])

  const total = getTotalPrice()
  const count = getTotalItems()

  /* Une commande retrouvée d'une visite précédente doit être annoncée :
     sans cela, le client voit des produits qu'il ne se rappelle pas avoir
     choisis, et se demande s'il a déjà payé. */
  const ancienne =
    mounted && count > 0 && startedAt !== null && Date.now() - startedAt > ANCIENNE_APRES_MS

  const depuis = startedAt
    ? new Date(startedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    : null

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col
          transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        aria-label="Ma commande"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-serif text-xl font-semibold text-ink">
            Ma commande {mounted && count > 0 && <span className="text-brand-600">({count})</span>}
          </h2>
          <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-700" aria-label="Fermer">
            <X size={24} />
          </button>
        </div>

        {ancienne && (
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-200">
            <p className="text-[13px] text-amber-900 leading-snug">
              <strong>Ces produits ont été choisis lors d’une visite précédente</strong>
              {depuis ? ` (le ${depuis})` : ''}. <strong>Aucun paiement n’a été effectué.</strong>{' '}
              Vous pouvez les commander maintenant, ou tout effacer.
            </p>
            <button
              onClick={clearCart}
              className="mt-2 text-[13px] font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-700"
            >
              Effacer et repartir de zéro
            </button>
          </div>
        )}

        {mounted && total > 0 && (
          <div className="px-4 py-2 bg-brand-50 border-b border-gray-100 flex items-center gap-2 text-xs text-brand-700">
            <Truck size={14} />
            <span className="font-semibold">Livraison offerte</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!mounted || items.length === 0 ? (
            <div className="text-center py-16 text-gray-300">
              <ShoppingBag size={48} className="mx-auto mb-4 opacity-40" />
              <p className="font-medium text-gray-500">Vous n’avez pas encore choisi de produit</p>
              <Link
                href="/produits"
                onClick={() => setOpen(false)}
                className="inline-block mt-4 text-brand-600 hover:text-brand-700 font-medium text-sm"
              >
                Voir le catalogue →
              </Link>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div key={product.id} className="flex gap-3">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                  <ProductVisual image={product.image} name={product.name} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink line-clamp-2">{product.name}</p>
                  <p className="text-sm text-brand-700 font-semibold mt-1">{formatPrice(product.price)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded text-gray-600 hover:bg-gray-50"
                    >
                      −
                    </button>
                    <span className="text-sm w-6 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      aria-disabled={quantity >= maxParCommande(product)}
                      className={`w-7 h-7 flex items-center justify-center border border-gray-200 rounded ${
                        quantity >= maxParCommande(product)
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      +
                    </button>
                  </div>
                  {quantity >= maxParCommande(product) && (
                    <p className="text-[12px] text-amber-800 mt-1.5 leading-snug">
                      {messageLimite(product)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeItem(product.id)}
                  className="text-gray-300 hover:text-promo self-start mt-1 flex-shrink-0"
                  aria-label="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {mounted && items.length > 0 && (
          <div className="border-t border-gray-100 p-4 space-y-3">

            <div className="flex justify-between text-sm text-gray-600">
              <span>Sous-total</span>
              <span className="font-semibold text-ink">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Livraison</span>
              <span className="text-brand-700 font-semibold">Offerte</span>
            </div>
            <div className="flex justify-between text-base font-bold text-ink pt-1 border-t border-gray-100">
              <span>Total TTC</span>
              <span>{formatPrice(total)}</span>
            </div>

            <Link
              href="/panier"
              onClick={() => setOpen(false)}
              className="block w-full bg-brand-600 hover:bg-brand-700 text-white text-center py-4 rounded-lg font-bold text-base transition-colors shadow-md"
            >
              Voir ma commande
            </Link>

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {[
                { icon: ShieldCheck, label: 'Paiement sécurisé' },
                { icon: Truck,       label: 'Livraison soignée' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1 bg-gray-50 rounded-lg py-2 px-1">
                  <Icon size={13} className="text-brand-600" />
                  <span className="text-xs text-gray-500 text-center leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
