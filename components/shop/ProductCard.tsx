import Link from 'next/link'
import { Truck, Flame, ArrowRight, Award, Tag, PackageCheck } from 'lucide-react'
import type { Product } from '@/types/database'
import { formatPrice } from '@/lib/utils'
import ProductVisual from '@/components/shop/ProductVisual'

interface ProductCardProps {
  product: Product
}

/**
 * Carte produit de la page collection.
 *
 * Toute la carte est un lien vers la fiche : c'est le seul chemin possible
 * depuis la collection. On n'achète plus directement d'ici.
 *
 * Les données montraient que la plupart des visiteurs commandaient depuis
 * la carte, sautant ainsi toute la réassurance — bois sec, provenance,
 * entreprise familiale, FAQ — qui est précisément ce qui décide un acheteur
 * méfiant. Le parcours devient linéaire : collection, fiche, paiement.
 *
 * Le bouton est un <span> et non un lien : imbriquer un lien dans un lien
 * produirait un HTML invalide et un comportement imprévisible au clic.
 */
export default function ProductCard({ product }: ProductCardProps) {
  const { slug, name, price, original_price, pricePerStere, stock, image, family, badge } = product
  const isOutOfStock = stock === 0
  const hasPromo = original_price !== null && original_price > price
  const isBestSeller = badge === 'bestseller'
  const dernierExemplaire = stock === 1
  const isDestockage = badge === 'destockage' && hasPromo
  const remise = hasPromo ? Math.round((1 - price / original_price!) * 100) : 0

  return (
    <Link
      href={`/produits/${slug}/`}
      className="group bg-white rounded-lg border-2 border-gray-100 hover:border-brand-400 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="relative aspect-[4/3] overflow-hidden flex-shrink-0 bg-gray-50">
        <ProductVisual image={image} name={name} className="group-hover:scale-105 transition-transform duration-500" />

        {/* Un seul repère dans toute la collection : face à neuf palettes qui
            se ressemblent, il indique par où commencer. Pas un argument de
            vente, un simple constat tiré des commandes. */}
        {isBestSeller && !isOutOfStock && (
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 inline-flex items-center gap-1 sm:gap-1.5 rounded-md bg-ink/90 text-white text-[11px] sm:text-[13px] font-semibold px-2 py-1 sm:px-2.5 sm:py-1.5 shadow-sm">
            <Award size={13} className="sm:hidden" />
            <Award size={15} className="hidden sm:block" />
            Le plus vendu
          </span>
        )}

        {/* Déstockage : la remise est calculée depuis le prix barré, jamais
            saisie à la main, pour que les deux chiffres restent cohérents. */}
        {isDestockage && !isOutOfStock && (
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 inline-flex items-center gap-1 sm:gap-1.5 rounded-md bg-red-700 text-white text-[11px] sm:text-[13px] font-semibold px-2 py-1 sm:px-2.5 sm:py-1.5 shadow-sm">
            <Tag size={13} className="sm:hidden" />
            <Tag size={15} className="hidden sm:block" />
            Déstockage −{remise} %
          </span>
        )}

        {dernierExemplaire && (
          <span className="absolute top-2 right-2 sm:top-3 sm:right-3 inline-flex items-center gap-1 sm:gap-1.5 rounded-md bg-amber-500 text-ink text-[11px] sm:text-[13px] font-semibold px-2 py-1 sm:px-2.5 sm:py-1.5 shadow-sm">
            <PackageCheck size={13} className="sm:hidden" />
            <PackageCheck size={15} className="hidden sm:block" />
            Dernier exemplaire
          </span>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-ink text-white text-base font-semibold px-4 py-2 rounded-lg">
              Rupture de stock
            </span>
          </div>
        )}
      </div>

      <div className="p-3 sm:p-5 flex flex-col flex-1 gap-2 sm:gap-3">
        <h3 className="text-[15px] sm:text-lg font-bold text-ink group-hover:text-brand-700 transition-colors leading-snug">
          {name}
        </h3>

        <p className="flex items-center gap-1.5 sm:gap-2 text-[13px] sm:text-[15px] text-gray-700">
          <Flame size={14} className="text-brand-600 flex-shrink-0 sm:hidden" />
          <Flame size={16} className="text-brand-600 flex-shrink-0 hidden sm:block" />
          {family === 'granules' ? 'Granulés prêts à l’emploi' : 'Bois sec, prêt à brûler'}
        </p>

        <div className="mt-auto pt-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl sm:text-3xl font-bold text-ink">{formatPrice(price)}</span>
            {hasPromo && (
              <span className="text-base sm:text-lg text-gray-400 line-through">
                {formatPrice(original_price!)}
              </span>
            )}
          </div>
          {pricePerStere !== null && (
            <p className="text-[13px] sm:text-[15px] text-gray-600 mt-0.5">
              soit {formatPrice(pricePerStere)} le stère
            </p>
          )}
        </div>

        <p className="flex items-center gap-1.5 sm:gap-2 text-[13px] sm:text-[15px] font-semibold text-brand-700">
          <Truck size={14} className="flex-shrink-0 sm:hidden" />
          <Truck size={16} className="flex-shrink-0 hidden sm:block" />
          Livraison offerte dès 89 €
        </p>

        {isOutOfStock ? (
          <span className="w-full flex items-center justify-center gap-2 rounded-lg font-bold bg-gray-100 text-gray-400 py-3 text-[14px] sm:py-4 sm:text-lg">
            Rupture de stock
          </span>
        ) : (
          <span className="w-full flex items-center justify-center gap-1.5 sm:gap-2.5 rounded-lg font-bold transition-colors shadow-sm bg-brand-600 group-hover:bg-brand-700 text-white py-3 text-[14px] sm:py-4 sm:text-lg">
            Commander
            <ArrowRight size={18} className="hidden min-[360px]:block" />
          </span>
        )}
      </div>
    </Link>
  )
}
