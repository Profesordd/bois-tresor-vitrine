'use client'

import { useEffect, useRef } from 'react'
import type { Product } from '@/types/database'
import { trackViewContent, attendreLePixel } from '@/lib/analytics/meta'

/**
 * Déclenche ViewContent à l'ouverture d'une fiche produit.
 *
 * La fiche est un composant serveur ; ce petit composant client sert
 * uniquement de déclencheur. Le garde-fou sur le slug évite le double envoi
 * du mode strict de React en développement, tout en laissant l'événement
 * repartir quand le visiteur passe d'une fiche à une autre.
 *
 * L'attente du pixel précède l'envoi et ne le répète pas : chaque envoi
 * tire un nouvel identifiant et part aussi vers le serveur, donc réessayer
 * créerait plusieurs événements serveur pour une seule consultation.
 */
export default function ViewContentTracker({ product }: { product: Product }) {
  const envoyePour = useRef<string | null>(null)

  useEffect(() => {
    if (envoyePour.current === product.slug) return
    envoyePour.current = product.slug

    /* Sans annulation au démontage : combinée au garde-fou ci-dessus, elle
       faisait disparaître l'événement en mode strict — le premier montage
       était annulé et le second bloqué comme doublon. */
    void attendreLePixel(2000).then(() => trackViewContent(product))
  }, [product])

  return null
}
