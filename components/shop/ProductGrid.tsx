import type { Product } from '@/types/database'
import ProductCard from '@/components/shop/ProductCard'

interface ProductGridProps {
  products: Product[]
  /** Colonnes sur grand écran. 3 par défaut (page collection), 4 pour les
   *  aperçus de la page d'accueil, qui tiennent ainsi sur une seule ligne. */
  columns?: 3 | 4
}

export default function ProductGrid({ products, columns = 3 }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg">Aucun produit trouvé.</p>
      </div>
    )
  }

  /* 2 colonnes dès le mobile : une seule carte par écran obligeait à faire
     défiler interminablement pour comparer deux palettes. 3 colonnes au-delà,
     pas plus — le persona cible se perd dans les grilles denses. */
  return (
    <div
      className={`grid grid-cols-2 gap-4 sm:gap-6 lg:gap-8 ${
        columns === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
      }`}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
