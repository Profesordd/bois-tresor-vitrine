'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Minus, Plus, ShoppingCart, Mail, Plus as PlusIcon } from 'lucide-react'
import { useCartStore } from '@/stores/cart'
import type { Product } from '@/types/database'
import { buildCheckoutUrl } from '@/lib/checkout'
import { trackAddToCart, trackAddToCartThenRedirect } from '@/lib/analytics/meta'

interface Props {
  product: Product
}

/**
 * Le seul endroit du site où l'on peut commander.
 *
 * Un bouton unique et visible mène droit au paiement : le visiteur clique,
 * il paie. La notion de panier n'apparaît pas dans ce parcours — elle perd
 * un public peu à l'aise avec internet, qui se demande où est passé son
 * produit et s'il a déjà payé.
 *
 * Commander plusieurs produits reste possible, par un lien discret placé
 * dessous : proposé, jamais imposé.
 */
export default function QuantitySelector({ product }: Props) {
  const [qty, setQty] = useState(1)
  const [redirecting, setRedirecting] = useState(false)
  const [ajoute, setAjoute] = useState(false)
  const [monte, setMonte] = useState(false)

  const { items, addItem, setOpen } = useCartStore()
  const isOutOfStock = product.stock === 0

  /* Le panier est restauré depuis le navigateur après le premier rendu :
     l'afficher avant produirait une différence entre serveur et client. */
  useEffect(() => setMonte(true), [])

  const autresProduits = items.filter((i) => i.product.id !== product.id)

  function dec() { setQty((q) => Math.max(1, q - 1)) }
  function inc() { setQty((q) => q + 1) }

  /** Le clic mène au paiement, sans étape intermédiaire à comprendre. */
  function handleBuy() {
    if (isOutOfStock) return
    /* Ce qui a été ajouté auparavant part avec : l'ignorer reviendrait à
       effacer sans prévenir une commande que le client croit constituée. */
    const url = buildCheckoutUrl([...autresProduits, { product, quantity: qty }])
    if (!url) return
    addItem(product, qty)
    setRedirecting(true)
    /* AddToCart part avant la redirection : sans ce signal, aucune audience
       « panier abandonné » ne peut être constituée côté Meta. */
    trackAddToCartThenRedirect(product, qty, url)
  }

  /** Chemin secondaire : constituer une commande à plusieurs produits. */
  function handleAjouter() {
    if (isOutOfStock) return
    addItem(product, qty)
    trackAddToCart(product, qty)
    setAjoute(true)
    setOpen(true)
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
        <>
          <button
            onClick={handleBuy}
            disabled={redirecting}
            data-track="Commander"
            data-product-slug={product.slug}
            data-product-name={product.name}
            data-product-qty={qty}
            data-product-value={(product.price * qty).toFixed(2)}
            className="w-full py-5 rounded-lg font-bold text-xl flex items-center justify-center gap-3 transition-all duration-200 shadow-md bg-brand-600 hover:bg-brand-700 hover:shadow-lg disabled:opacity-70 text-white"
          >
            {redirecting ? (
              'Redirection vers le paiement…'
            ) : (
              <><ShoppingCart size={26} />Commander maintenant</>
            )}
          </button>

          <p className="text-center text-sm text-gray-500">
            Vous passez directement au paiement sécurisé.
          </p>

          {/* Autres produits déjà choisis : les annoncer, pour que le total
              affiché au paiement ne soit pas une surprise. */}
          {monte && autresProduits.length > 0 && (
            <p className="text-center text-sm text-brand-700 bg-brand-50 border border-brand-100 rounded-lg py-2.5 px-3">
              {autresProduits.length === 1
                ? '1 autre produit déjà choisi partira avec cette commande.'
                : `${autresProduits.length} autres produits déjà choisis partiront avec cette commande.`}
            </p>
          )}

          {/* Chemin secondaire, volontairement discret. */}
          {ajoute ? (
            <p className="text-center text-sm text-brand-700 font-medium">
              Ajouté. Choisissez un autre produit, puis commandez depuis n’importe quelle fiche.
            </p>
          ) : (
            <button
              onClick={handleAjouter}
              className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-brand-700 underline underline-offset-2 py-1 transition-colors"
            >
              <PlusIcon size={14} />
              Je veux aussi commander un autre produit
            </button>
          )}
        </>
      )}
    </div>
  )
}
