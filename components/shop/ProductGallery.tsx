import type { ProductSubtype } from '@/types/database'
import ProductVisual from '@/components/shop/ProductVisual'

interface ProductGalleryProps {
  subtype: ProductSubtype
  name: string
}

export default function ProductGallery({ subtype, name }: ProductGalleryProps) {
  return (
    <div className="relative aspect-square rounded-2xl overflow-hidden shadow-sm" role="img" aria-label={name}>
      <ProductVisual subtype={subtype} />
    </div>
  )
}
