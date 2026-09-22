import Link from 'next/link'
import { CATEGORIES, CATEGORIES_VISIBLES } from '@/lib/products'
import type { Product } from '@/types/database'
import ProductGrid from '@/components/shop/ProductGrid'
import FamilyBlock from '@/components/ui/FamilyBlock'
import UrgencyNote from '@/components/ui/UrgencyNote'
import SocialProof from '@/components/ui/SocialProof'
import LivraisonPays from '@/components/ui/LivraisonPays'

interface Props {
  /** Slug de catégorie actif, ou undefined pour « tout voir ». */
  categorySlug?: string
  /** Catalogue complet, stock réel appliqué (voir lib/stock.ts). */
  allProducts: Product[]
}

/**
 * Page de collection, partagée par deux URL :
 *   - /produits?categorie=<slug>          (navigation interne)
 *   - /product-category/<slug>/           (URL historique WooCommerce,
 *                                          utilisée par les publicités)
 * Les deux servent le même rendu, pour qu'une campagne ne tombe jamais
 * sur une page différente de celle que voient les visiteurs du site.
 */
export default function CollectionView({ categorySlug, allProducts }: Props) {
  const activeCategory = CATEGORIES.find((c) => c.slug === categorySlug)
  const products = activeCategory
    ? allProducts.filter((p) => p.category_id === activeCategory.id)
    : allProducts.filter((p) => !p.category?.hidden)
  const jardin = activeCategory?.family === 'jardin'

  return (
    <div>
      {/* ── En-tête : message n°1 = confiance, puis produit ──
             Resserré sur téléphone : mêmes informations, moins de hauteur,
             pour que les palettes arrivent plus vite à l'écran. Les tailles
             de texte sont conservées — seuls les espaces se réduisent, et
             le sous-titre passe à sa formulation courte. ── */}
      <div className="bg-brand-800 text-white py-8 sm:py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-brand-200 font-semibold mb-2 sm:mb-3 text-[15px] sm:text-lg">
            Entreprise familiale française — Jean-Paul &amp; Julien
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold mb-2.5 sm:mb-4 font-serif leading-tight">
            {activeCategory ? activeCategory.name : 'Bois de chauffage sec, prêt à brûler'}
          </h1>

          {jardin ? (
            <p className="text-brand-50 text-[17px] sm:text-xl max-w-2xl mx-auto leading-snug">
              Désherbants professionnels en déstockage. Livraison offerte, paiement sécurisé.
            </p>
          ) : (<>
          {/* Téléphone : l'essentiel en une ligne de moins. */}
          <p className="sm:hidden text-brand-50 text-[17px] leading-snug">
            Moins de 20 % d’humidité : il chauffe vraiment et ne fume pas.
          </p>
          <p className="hidden sm:block text-brand-50 text-xl max-w-2xl mx-auto">
            Moins de 20 % d’humidité : notre bois chauffe vraiment et ne fume pas.
            Livraison offerte, paiement sécurisé.
          </p>
          </>)}
        </div>
      </div>

      {/* Marge haute réduite de moitié sur téléphone : l'écart entre le hero
          et la preuve sociale y était disproportionné. */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-10">

        {/* ── Visiteur belge ou suisse : on lève le doute avant tout le reste ── */}
        <div className="mb-6 empty:mb-0">
          <LivraisonPays />
        </div>

        {/* ── Preuve sociale, vue dès l'arrivée (elle parle de chauffage :
               pas sur le jardin) ── */}
        {!jardin && (
          <div className="mb-5 sm:mb-8">
            <SocialProof />
          </div>
        )}

        {/* ── Réassurance : qui nous sommes ── */}
        <FamilyBlock />

        {/* ── Urgence crédible ──
             Sur grand écran elle précède les produits. Sur téléphone elle
             passe après : placée ici, elle repoussait les produits d'un
             écran entier, alors qu'elle se lit très bien une fois le choix
             fait — le client vient de voir les palettes, on l'incite à ne
             pas attendre. ── */}
        <div className="mt-6 hidden sm:block">
          <UrgencyNote variant={jardin ? 'destockage' : 'saison'} />
        </div>

        {/* ── Filtres ──
             Sur téléphone : une seule ligne qui défile latéralement. En
             passant à la ligne, ces quatre libellés occupaient un quart de
             l'écran — beaucoup pour une navigation secondaire, quand le
             visiteur vient d'abord voir des palettes.
             Les marges négatives laissent le défilement atteindre les bords
             de l'écran, sinon la dernière pastille semble coupée net. ── */}
        <div
          className="flex gap-2 sm:gap-3 mt-5 mb-4 sm:mt-10 sm:mb-8
                     overflow-x-auto sm:overflow-visible sm:flex-wrap
                     -mx-4 px-4 sm:mx-0 sm:px-0
                     [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <Link
            href="/produits"
            className={`flex-shrink-0 whitespace-nowrap rounded-full border-2 transition-colors
              px-3.5 py-1.5 text-sm sm:px-5 sm:py-3 sm:text-base font-semibold ${
              !activeCategory
                ? 'bg-brand-700 text-white border-brand-700'
                : 'border-gray-200 text-gray-700 hover:border-brand-400 hover:text-brand-700'
            }`}
          >
            Tout voir
          </Link>
          {(jardin ? CATEGORIES.filter((c) => c.hidden) : CATEGORIES_VISIBLES).map((c) => (
            <Link
              key={c.slug}
              href={`/product-category/${c.slug}/`}
              className={`flex-shrink-0 whitespace-nowrap rounded-full border-2 transition-colors
                px-3.5 py-1.5 text-sm sm:px-5 sm:py-3 sm:text-base font-semibold ${
                activeCategory?.slug === c.slug
                  ? 'bg-brand-700 text-white border-brand-700'
                  : 'border-gray-200 text-gray-700 hover:border-brand-400 hover:text-brand-700'
              }`}
            >
              {/* Libellé abrégé sur téléphone : « Bois densifié & bûches
                  compressées » tient mal sur une pastille. */}
              <span className="sm:hidden">{c.shortName ?? c.name}</span>
              <span className="hidden sm:inline">{c.name}</span>
            </Link>
          ))}
        </div>

        {activeCategory ? (
          <ProductGrid products={products} />
        ) : (
          /* Sans filtre, on sépare clairement les deux univers plutôt que
             d'aligner 53 produits d'affilée : le persona a besoin de repères. */
          <div className="space-y-14">
            {CATEGORIES_VISIBLES.map((c) => {
              const list = allProducts.filter((p) => p.category_id === c.id)
              if (list.length === 0) return null
              return (
                <section key={c.id}>
                  <div className="flex items-baseline justify-between gap-4 mb-6">
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink">{c.name}</h2>
                    <span className="text-gray-500">{list.length} produits</span>
                  </div>
                  <ProductGrid products={list} />
                </section>
              )
            })}
          </div>
        )}

        {/* Sur téléphone uniquement : l'urgence arrive après les produits. */}
        <div className="mt-10 sm:hidden">
          <UrgencyNote variant={jardin ? 'destockage' : 'saison'} />
        </div>
      </div>
    </div>
  )
}
