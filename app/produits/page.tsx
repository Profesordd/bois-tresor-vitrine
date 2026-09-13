import Link from 'next/link'
import { PRODUCTS, CATEGORIES } from '@/lib/products'
import ProductGrid from '@/components/shop/ProductGrid'

export const metadata = { title: 'Catalogue' }

interface Props {
  searchParams: Promise<{ categorie?: string }>
}

export default async function ProduitsPage({ searchParams }: Props) {
  const { categorie } = await searchParams
  const activeCategory = CATEGORIES.find(c => c.slug === categorie)
  const products = activeCategory
    ? PRODUCTS.filter(p => p.category_id === activeCategory.id)
    : PRODUCTS

  return (
    <div>
      <div className="bg-gradient-to-r from-brand-800 to-brand-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 font-serif">Notre catalogue</h1>
          <p className="text-brand-100">Bois de chauffage et granulés premium, prêts à être livrés</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/produits"
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              !activeCategory ? 'bg-brand-900 text-white border-brand-900' : 'border-brand-200 text-brand-700 hover:bg-brand-50'
            }`}
          >
            Tout voir
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/produits?categorie=${c.slug}`}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                activeCategory?.slug === c.slug ? 'bg-brand-900 text-white border-brand-900' : 'border-brand-200 text-brand-700 hover:bg-brand-50'
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        <ProductGrid products={products} />
      </div>
    </div>
  )
}
