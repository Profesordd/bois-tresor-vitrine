import type { Product } from '@/types/database'
import ProductCard from '@/components/shop/ProductCard'

interface ProductGridProps {
  products: Product[]
  /** Colonnes sur grand écran. 3 par défaut (page collection), 4 pour les
   *  aperçus de la page d'accueil, qui tiennent ainsi sur une seule ligne.
   *  1 ou 2 quand il y a moins de produits que de colonnes : la grille se
   *  resserre au lieu de laisser des trous. */
  columns?: 1 | 2 | 3 | 4
}

const COLONNES = {
  1: 'grid-cols-1 max-w-sm',
  2: 'grid-cols-2 max-w-2xl',
  3: 'grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-4',
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
    <div className={`grid gap-4 sm:gap-6 lg:gap-8 ${COLONNES[columns]}`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
