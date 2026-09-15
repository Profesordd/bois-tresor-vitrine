'use client'

import { useEffect, useRef } from 'react'
import type { Product } from '@/types/database'
import { trackViewContent } from '@/lib/analytics/meta'

/**
 * Déclenche ViewContent à l'ouverture d'une fiche produit.
 *
 * La fiche est un composant serveur ; ce petit composant client sert
 * uniquement de déclencheur. Le garde-fou sur le slug évite le double envoi
 * du mode strict de React en développement, tout en laissant l'événement
 * repartir quand le visiteur passe d'une fiche à une autre.
 */
export default function ViewContentTracker({ product }: { product: Product }) {
  const sentFor = useRef<string | null>(null)

  useEffect(() => {
    if (sentFor.current === product.slug) return

    /* Le script du pixel est chargé en « afterInteractive » : il peut ne pas
       être prêt au premier rendu. On réessaie brièvement plutôt que de
       perdre l'événement. */
    let tries = 0
    const timer = window.setInterval(() => {
      if (trackViewContent(product) || ++tries > 20) {
        sentFor.current = product.slug
        window.clearInterval(timer)
      }
    }, 150)

    return () => window.clearInterval(timer)
  }, [product])

  return null
}
