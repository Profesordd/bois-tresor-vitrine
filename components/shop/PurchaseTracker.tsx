'use client'

import { useEffect, useRef } from 'react'
import { trackPurchase } from '@/lib/analytics/meta'

/**
 * Envoie l'achat au pixel, depuis la page de remerciement.
 *
 * L'`eventId` est l'identifiant de la commande, le même que celui envoyé
 * par le serveur à l'API Conversions. Meta rapproche les deux et n'en
 * compte qu'un. Sans cet identifiant partagé, chaque vente compterait
 * double et le coût par achat serait divisé par deux.
 *
 * Les valeurs viennent du serveur, qui les a lues en base. Elles ne
 * transitent pas par l'adresse de la page : un montant passé dans l'URL
 * serait modifiable, et c'est lui que Meta retiendrait.
 */
export default function PurchaseTracker({
  commandeId, reference, produitSlug, produitNom, montant,
}: {
  commandeId: string
  reference: string
  produitSlug: string
  produitNom: string
  montant: number
}) {
  const envoye = useRef(false)

  useEffect(() => {
    if (envoye.current) return
    envoye.current = true
    trackPurchase(commandeId, {
      content_type: 'product',
      content_ids: [produitSlug],
      content_name: produitNom,
      value: Number(montant.toFixed(2)),
      currency: 'EUR',
      order_id: reference,
    })
  }, [commandeId, reference, produitSlug, produitNom, montant])

  return null
}
