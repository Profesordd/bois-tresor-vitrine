'use client'

import { useEffect, useState } from 'react'
import ProductVisual from '@/components/shop/ProductVisual'

interface ProductGalleryProps {
  fit?: 'cover' | 'contain'
  image: string
  /** Toutes les photos, `image` comprise. Une seule = pas de vignettes. */
  images?: string[]
  name: string
}

/**
 * Photo principale, et les vignettes dessous quand il y en a plusieurs.
 *
 * Pas de flèches ni de défilement automatique : le persona ne les cherche
 * pas et les rate. Des vignettes visibles d'un coup d'œil, qu'on clique.
 */
export default function ProductGallery({ image, images, name, fit = 'cover' }: ProductGalleryProps) {
  const photos = images?.length ? images : [image]
  const [active, setActive] = useState(0)

  /* Changer de produit sans changer de page (produits liés) : on revient
     à la première photo, sinon l'index pointe dans le vide. */
  useEffect(() => setActive(0), [image])

  return (
    <div className="space-y-2.5">
      <div className="relative aspect-square rounded-lg overflow-hidden shadow-sm bg-gray-50">
        <ProductVisual image={photos[active] ?? image} name={name} priority fit={fit} />
      </div>

      {photos.length > 1 && (
        <div className="grid grid-cols-6 gap-2">
          {photos.map((p, i) => (
            <button
              key={p}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Photo ${i + 1} sur ${photos.length}`}
              aria-current={i === active}
              className={`relative aspect-square rounded-md overflow-hidden bg-gray-50 border-2 transition-colors ${
                i === active ? 'border-brand-600' : 'border-gray-200 hover:border-brand-400'
              }`}
            >
              <ProductVisual image={p} name={name} fit={fit} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
