import Link from 'next/link'
import { PRODUCTS, CATEGORIES } from '@/lib/products'
import ProductGrid from '@/components/shop/ProductGrid'
import FamilyBlock from '@/components/ui/FamilyBlock'
import UrgencyNote from '@/components/ui/UrgencyNote'
import SocialProof from '@/components/ui/SocialProof'
import LivraisonBelgique from '@/components/ui/LivraisonBelgique'

interface Props {
  /** Slug de catégorie actif, ou undefined pour « tout voir ». */
  categorySlug?: string
}

/**
 * Page de collection, partagée par deux URL :
 *   - /produits?categorie=<slug>          (navigation interne)
 *   - /product-category/<slug>/           (URL historique WooCommerce,
 *                                          utilisée par les publicités)
 * Les deux servent le même rendu, pour qu'une campagne ne tombe jamais
 * sur une page différente de celle que voient les visiteurs du site.
 */
export default function CollectionView({ categorySlug }: Props) {
  const activeCategory = CATEGORIES.find((c) => c.slug === categorySlug)
  const products = activeCategory
    ? PRODUCTS.filter((p) => p.category_id === activeCategory.id)
    : PRODUCTS

  return (
    <div>
      {/* ── En-tête : message n°1 = confiance, puis produit ── */}
      <div className="bg-brand-800 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-brand-200 font-semibold mb-3 text-base sm:text-lg">
            Entreprise familiale française — Jean-Paul &amp; Julien
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold mb-4 font-serif leading-tight">
            {activeCategory ? activeCategory.name : 'Bois de chauffage sec, prêt à brûler'}
          </h1>
          <p className="text-brand-50 text-lg sm:text-xl max-w-2xl mx-auto">
            Moins de 20 % d’humidité : notre bois chauffe vraiment et ne fume pas.
            Livraison offerte, paiement sécurisé.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Visiteur belge : on lève le doute avant tout le reste ── */}
        <div className="mb-6 empty:mb-0">
          <LivraisonBelgique />
        </div>

        {/* ── Preuve sociale, vue dès l'arrivée ── */}
        <div className="mb-8">
          <SocialProof />
        </div>

        {/* ── Réassurance : qui nous sommes ── */}
        <FamilyBlock />

        {/* ── Urgence crédible ──
             Sur grand écran elle précède les produits. Sur téléphone elle
             passe après : placée ici, elle repoussait les produits d'un
             écran entier, alors qu'elle se lit très bien une fois le choix
             fait — le client vient de voir les palettes, on l'incite à ne
             pas attendre. ── */}
        <div className="mt-6 hidden sm:block">
          <UrgencyNote />
        </div>

        {/* ── Filtres ── */}
        <div className="flex flex-wrap gap-3 mt-10 mb-8">
          <Link
            href="/produits"
            className={`px-5 py-3 rounded-full text-base font-semibold border-2 transition-colors ${
              !activeCategory
                ? 'bg-brand-700 text-white border-brand-700'
                : 'border-gray-200 text-gray-700 hover:border-brand-400 hover:text-brand-700'
            }`}
          >
            Tout voir
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/product-category/${c.slug}/`}
              className={`px-5 py-3 rounded-full text-base font-semibold border-2 transition-colors ${
                activeCategory?.slug === c.slug
                  ? 'bg-brand-700 text-white border-brand-700'
                  : 'border-gray-200 text-gray-700 hover:border-brand-400 hover:text-brand-700'
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        {activeCategory ? (
          <ProductGrid products={products} />
        ) : (
          /* Sans filtre, on sépare clairement les deux univers plutôt que
             d'aligner 53 produits d'affilée : le persona a besoin de repères. */
          <div className="space-y-14">
            {CATEGORIES.map((c) => {
              const list = PRODUCTS.filter((p) => p.category_id === c.id)
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
          <UrgencyNote />
        </div>
      </div>
    </div>
  )
}
