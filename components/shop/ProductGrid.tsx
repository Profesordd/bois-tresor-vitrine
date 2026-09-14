import type { Product } from '@/types/database'
import ProductCard from '@/components/shop/ProductCard'

interface ProductGridProps {
  products: Product[]
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg">Aucun produit trouvé.</p>
      </div>
    )
  }

  /* Grille volontairement aérée : 3 colonnes max, grandes photos et gros
     boutons — le persona cible se perd dans les grilles denses. */
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
