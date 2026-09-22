import ProductVisual from '@/components/shop/ProductVisual'

interface ProductGalleryProps {
  fit?: 'cover' | 'contain'
  image: string
  name: string
}

export default function ProductGallery({ image, name, fit = 'cover' }: ProductGalleryProps) {
  return (
    <div className="relative aspect-square rounded-lg overflow-hidden shadow-sm bg-gray-50">
      <ProductVisual image={image} name={name} priority fit={fit} />
    </div>
  )
}
