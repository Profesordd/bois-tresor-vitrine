'use client'

import { useEffect, useRef, useState } from 'react'
import { ShoppingCart, PackagePlus, AlertCircle, Check } from 'lucide-react'
import { useCartStore } from '@/stores/cart'
import type { Product, Lot } from '@/types/database'
import { buildCheckoutUrl, messageLimite } from '@/lib/checkout'
import { lotsDisponibles, lotParDefaut, libelleLot, produitDuLot } from '@/lib/lots'
import { formatPrice } from '@/lib/utils'
import { trackAddToCart, trackAddToCartThenRedirect } from '@/lib/analytics/meta'

interface Props {
  product: Product
}

/**
 * Choix du lot, pour les produits vendus par lot (granulés).
 *
 * Pas de menu déroulant, pas de quantité à saisir : de grandes cartes, une
 * par lot, dont une est toujours sélectionnée. Le client peut cliquer
 * « Commander maintenant » sans rien choisir, ça marche quand même. Le prix
 * affiché est toujours celui qu'il va payer, et il change avec le lot.
 *
 * Le lot peut être présélectionné par l'URL (`?lot=20`) : une publicité
 * peut ainsi atterrir directement sur le format qu'elle annonce.
 */
export default function LotSelector({ product }: Props) {
  const lots = lotsDisponibles(product)
  const [lotId, setLotId] = useState<string | undefined>(lotParDefaut(product)?.id)
  const [redirecting, setRedirecting] = useState(false)
  const [depassement, setDepassement] = useState(false)
  const { items, addItem } = useCartStore()

  const lot = lots.find((l) => l.id === lotId) ?? lots[0]
  const meilleurAuSac = lots.length > 0 ? Math.min(...lots.map((l) => l.price / l.sacs)) : 0

  /* Présélection par l'URL, lue après montage : la page est statique et ne
     connaît pas l'URL au rendu. */
  useEffect(() => {
    const voulu = new URLSearchParams(window.location.search).get('lot')
    if (voulu && lots.some((l) => l.id === voulu)) setLotId(voulu)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Retour depuis le paiement : la page est restaurée telle quelle, on
     remet le bouton en état. */
  useEffect(() => {
    const retour = () => setRedirecting(false)
    window.addEventListener('pageshow', retour)
    return () => window.removeEventListener('pageshow', retour)
  }, [])

  /* Barre fixe sur téléphone, visible tant que le bouton principal ne l'est pas. */
  const boutonPrincipal = useRef<HTMLButtonElement>(null)
  const [barreVisible, setBarreVisible] = useState(false)
  useEffect(() => {
    const el = boutonPrincipal.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const obs = new IntersectionObserver(([entry]) => setBarreVisible(!entry.isIntersecting))
    obs.observe(el)
    return () => obs.disconnect()
  }, [lot])
  useEffect(() => {
    if (!barreVisible || !window.matchMedia('(max-width: 1023px)').matches) return
    document.body.style.paddingBottom = '5.5rem'
    return () => { document.body.style.paddingBottom = '' }
  }, [barreVisible])

  if (!lot) return null

  const article = produitDuLot(product, lot)
  const dejaDansCommande = items.find((i) => i.product.id === article.id)?.quantity ?? 0

  function choisir(l: Lot) {
    setLotId(l.id)
    setDepassement(false)
  }

  function handleBuy() {
    const autres = items.filter((i) => i.product.id !== article.id)
    const url = buildCheckoutUrl([...autres, { product: article, quantity: 1 }])
    if (!url) return
    addItem(article, 1)
    setRedirecting(true)
    trackAddToCartThenRedirect(article, 1, url)
  }

  function handleAjouter() {
    if (dejaDansCommande >= 1) { setDepassement(true); return }
    addItem(article, 1, { open: true })
    trackAddToCart(article, 1)
  }

  const attributs = {
    'data-product-slug': product.slug,
    'data-product-name': article.name,
    'data-product-qty': 1,
    'data-product-value': lot.price.toFixed(2),
  }

  return (
    <div className="space-y-5">
      {/* ── Les lots (masqués tant qu'un seul est commandable) ── */}
      {lots.length > 1 && (
      <div>
        <p className="text-base font-semibold text-gray-800 mb-2.5">Choisissez votre quantité</p>
        <div className="grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="Quantité">
          {lots.map((l) => {
            const actif = l.id === lot.id
            const auSac = l.price / l.sacs
            const meilleur = Math.abs(auSac - meilleurAuSac) < 0.001
            return (
              <button
                key={l.id}
                type="button"
                role="radio"
                aria-checked={actif}
                onClick={() => choisir(l)}
                className={`relative text-left rounded-lg border-2 px-4 py-3.5 transition-colors ${
                  actif
                    ? 'border-brand-600 bg-brand-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-brand-400'
                }`}
              >
                <span className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      actif ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-300 bg-white'
                    }`}
                  >
                    {actif && <Check size={15} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-bold text-ink leading-tight">
                      {libelleLot(l)} <span className="font-normal text-gray-500">· {l.poids}</span>
                    </span>
                    <span className="flex items-baseline gap-2 flex-wrap mt-1">
                      <span className="text-xl font-bold text-ink">{formatPrice(l.price)}</span>
                      <span className="text-[14px] text-gray-600">soit {formatPrice(auSac)} le sac</span>
                    </span>
                    {meilleur && (
                      <span className="block text-[13px] font-semibold text-brand-700 mt-0.5">
                        Le meilleur prix au sac
                      </span>
                    )}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
        {lots.length > 1 && (
          <p className="text-[14px] text-gray-600 mt-2.5">
            Plus vous prenez, moins le sac est cher : de{' '}
            {formatPrice(Math.max(...lots.map((l) => l.price / l.sacs)))} à {formatPrice(meilleurAuSac)} le sac.
          </p>
        )}
      </div>
      )}

      {/* ── Le prix du lot choisi ── */}
      <div>
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-4xl font-bold text-ink">{formatPrice(lot.price)}</span>
          <span className="text-base text-gray-600">
            {libelleLot(lot)} · {lot.poids}
          </span>
        </div>
        <p className="text-[15px] text-gray-700 mt-1">
          <span className="font-semibold text-red-700">Prix déstockage</span> — soit{' '}
          <span className="font-semibold text-ink">{formatPrice(lot.price / lot.sacs)}</span> le sac de 15 kg.
          Livraison offerte.
        </p>
      </div>

      <p
        role={depassement ? 'alert' : undefined}
        className={`flex items-start gap-2 text-[15px] leading-snug ${
          depassement ? 'text-red-700 font-semibold' : 'text-gray-600'
        }`}
      >
        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
        <span>{messageLimite(article)}</span>
      </p>

      <button
        ref={boutonPrincipal}
        onClick={handleBuy}
        disabled={redirecting}
        data-track="Commander"
        {...attributs}
        className="w-full py-5 rounded-lg font-bold text-xl flex items-center justify-center gap-3 transition-all duration-200 shadow-md bg-brand-600 hover:bg-brand-700 hover:shadow-lg disabled:opacity-70 text-white"
      >
        {redirecting ? 'Redirection vers le paiement…' : <><ShoppingCart size={26} />Commander maintenant</>}
      </button>
      <p className="text-center text-sm text-gray-500 -mt-2">
        Vous passez directement au paiement sécurisé.
      </p>

      <button
        onClick={handleAjouter}
        className="w-full py-3 rounded-lg border border-gray-200 bg-white text-[15px] font-medium text-gray-600 hover:border-brand-400 hover:text-brand-700 flex items-center justify-center gap-2 transition-colors"
      >
        <PackagePlus size={17} />
        Ajouter à ma commande
      </button>
      <p className="text-center text-[13px] text-gray-400 -mt-3">
        Pour commander plusieurs produits ensemble.
      </p>

      {/* ── Barre fixe, téléphone ── */}
      <div
        aria-hidden={!barreVisible}
        className={`lg:hidden fixed inset-x-0 bottom-0 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-transform duration-200 ${
          barreVisible ? 'translate-y-0' : 'translate-y-full pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="min-w-0 flex-shrink-0">
            <p className="text-xl font-bold text-ink leading-tight">{formatPrice(lot.price)}</p>
            <p className="text-[12px] text-gray-500 leading-tight">{libelleLot(lot)} · livraison offerte</p>
          </div>
          <button
            onClick={handleBuy}
            disabled={redirecting}
            tabIndex={barreVisible ? 0 : -1}
            data-track="Commander (barre mobile)"
            {...attributs}
            className="flex-1 min-w-0 py-3.5 rounded-lg font-bold text-[17px] flex items-center justify-center gap-2 shadow-md bg-brand-600 hover:bg-brand-700 disabled:opacity-70 text-white transition-colors"
          >
            {redirecting ? 'Redirection…' : <><ShoppingCart size={22} className="flex-shrink-0" />Commander maintenant</>}
          </button>
        </div>
      </div>
    </div>
  )
}
