'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Minus, Plus, ShoppingCart, Mail, PackagePlus, AlertCircle } from 'lucide-react'
import { useCartStore } from '@/stores/cart'
import type { Product } from '@/types/database'
import { buildCheckoutUrl, maxParCommande, messageLimite } from '@/lib/checkout'
import { formatPrice } from '@/lib/utils'
import { trackAddToCart, trackAddToCartThenRedirect } from '@/lib/analytics/meta'

interface Props {
  product: Product
}

/**
 * Le seul endroit du site où l'on peut commander.
 *
 * Deux chemins, volontairement inégaux :
 *   - « Commander maintenant », gros et plein, mène droit au paiement.
 *     C'est le parcours de l'immense majorité : on clique, on paie.
 *   - « Ajouter à ma commande », discret, sert au client rare qui veut
 *     plusieurs produits. Le mettre au même niveau visuel obligerait tous
 *     les autres à trancher entre deux boutons — exactement l'hésitation
 *     qu'il faut éviter chez un public peu à l'aise avec internet.
 *
 * Sur téléphone, une barre fixe en bas d'écran reprend le prix et le bouton
 * principal tant que celui-ci n'est pas visible. Les mesures montraient le
 * bouton à 20 % de la hauteur de page pour un défilement moyen de 19 % :
 * une bonne partie des visiteurs mobiles ne l'atteignait jamais. La barre
 * vit dans ce composant pour partager la quantité choisie et le même clic.
 */
export default function QuantitySelector({ product }: Props) {
  const [qty, setQty] = useState(1)
  const [redirecting, setRedirecting] = useState(false)

  /* La barre n'apparaît que lorsque le vrai bouton est hors de l'écran :
     deux boutons identiques visibles en même temps sèmeraient le doute. */
  const boutonPrincipal = useRef<HTMLButtonElement>(null)
  const [barreVisible, setBarreVisible] = useState(false)

  useEffect(() => {
    const el = boutonPrincipal.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const obs = new IntersectionObserver(([entry]) => setBarreVisible(!entry.isIntersecting))
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  /* Elle recouvre le bas de page : on réserve la place pour que le pied de
     page reste atteignable. Rien à faire sur ordinateur, la barre y est
     masquée par CSS. */
  useEffect(() => {
    if (!barreVisible) return
    const mobile = window.matchMedia('(max-width: 1023px)')
    if (!mobile.matches) return
    document.body.style.paddingBottom = '5.5rem'
    return () => { document.body.style.paddingBottom = '' }
  }, [barreVisible])

  const { items, addItem, setOpen } = useCartStore()
  const isOutOfStock = product.stock === 0

  /* Limite par commande, dite avant que le client ne bute dessus. Quand il
     tente de la dépasser, le même message passe en avertissement : rien
     n'est bloqué en silence. */
  const max = maxParCommande(product)
  const [depassement, setDepassement] = useState(false)
  const dejaDansCommande = items.find((i) => i.product.id === product.id)?.quantity ?? 0

  function dec() { setDepassement(false); setQty((q) => Math.max(1, q - 1)) }
  function inc() {
    if (qty >= max) { setDepassement(true); return }
    setQty((q) => q + 1)
  }

  /** Le clic mène au paiement, sans étape intermédiaire à comprendre. */
  function handleBuy() {
    if (isOutOfStock) return
    /* Ce qui a déjà été retenu part avec : l'ignorer reviendrait à effacer
       sans prévenir une commande que le client croit constituée. */
    const autresProduits = items.filter((i) => i.product.id !== product.id)
    const url = buildCheckoutUrl([...autresProduits, { product, quantity: qty }])
    if (!url) return
    addItem(product, qty)
    setRedirecting(true)
    /* AddToCart part avant la redirection : sans ce signal, aucune audience
       « panier abandonné » ne peut être constituée côté Meta. */
    trackAddToCartThenRedirect(product, qty, url)
  }

  /** Chemin secondaire : le produit rejoint la commande, on reste sur le site. */
  function handleAjouter() {
    if (isOutOfStock) return
    if (dejaDansCommande + qty > max) {
      setDepassement(true)
      if (dejaDansCommande >= max) return
    }
    addItem(product, qty, { open: true })
    /* Même signal publicitaire que l'achat direct : dans les deux cas, le
       visiteur a mis un produit au panier. */
    trackAddToCart(product, qty)
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
            aria-disabled={qty >= max}
            className={`w-14 h-14 border-2 border-gray-200 rounded-r-lg flex items-center justify-center transition-colors ${
              qty >= max ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <p
        role={depassement ? 'alert' : undefined}
        className={`flex items-start gap-2 text-[15px] leading-snug -mt-1 ${
          depassement ? 'text-red-700 font-semibold' : 'text-gray-600'
        }`}
      >
        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
        <span>
          {messageLimite(product)}
          {depassement && ' — vous ne pouvez pas en commander davantage.'}
        </span>
      </p>

      {isOutOfStock ? (
        <button disabled className="w-full py-5 rounded-lg bg-gray-100 text-gray-400 font-bold text-lg cursor-not-allowed">
          Rupture de stock
        </button>
      ) : (
        <>
          <button
            ref={boutonPrincipal}
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

          {/* Chemin secondaire : bordure fine, fond blanc, texte plus petit.
              Visible pour qui le cherche, effacé pour les autres. */}
          <button
            onClick={handleAjouter}
            className="w-full py-3 rounded-lg border border-gray-200 bg-white text-[15px] font-medium text-gray-600 hover:border-brand-400 hover:text-brand-700 flex items-center justify-center gap-2 transition-colors"
          >
            <PackagePlus size={17} />
            Ajouter à ma commande
          </button>
          <p className="text-center text-[13px] text-gray-400 -mt-2">
            Pour commander plusieurs produits ensemble.
          </p>

          {/* Barre d'achat fixe, téléphone et tablette uniquement. Toujours
              montée, glissée hors de l'écran quand le bouton principal est
              visible : le mouvement dit d'où elle vient. */}
          <div
            aria-hidden={!barreVisible}
            className={`lg:hidden fixed inset-x-0 bottom-0 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-transform duration-200 ${
              barreVisible ? 'translate-y-0' : 'translate-y-full pointer-events-none'
            }`}
          >
            <div className="flex items-center gap-3 max-w-lg mx-auto">
              <div className="min-w-0 flex-shrink-0">
                <p className="text-xl font-bold text-ink leading-tight">
                  {formatPrice(product.price * qty)}
                </p>
                <p className="text-[12px] text-gray-500 leading-tight">
                  {qty > 1 ? `Quantité : ${qty}` : 'Livraison offerte'}
                </p>
              </div>
              <button
                onClick={handleBuy}
                disabled={redirecting}
                tabIndex={barreVisible ? 0 : -1}
                data-track="Commander (barre mobile)"
                data-product-slug={product.slug}
                data-product-name={product.name}
                data-product-qty={qty}
                data-product-value={(product.price * qty).toFixed(2)}
                className="flex-1 min-w-0 py-3.5 rounded-lg font-bold text-[17px] flex items-center justify-center gap-2 shadow-md bg-brand-600 hover:bg-brand-700 disabled:opacity-70 text-white transition-colors"
              >
                {redirecting ? (
                  'Redirection…'
                ) : (
                  <><ShoppingCart size={22} className="flex-shrink-0" />Commander maintenant</>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
