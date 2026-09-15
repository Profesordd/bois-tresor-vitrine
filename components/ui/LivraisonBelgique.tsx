'use client'

import { useEffect, useState } from 'react'
import { Truck } from 'lucide-react'

/**
 * Message affiché aux visiteurs belges.
 *
 * Un Belge qui arrive sur un site français au nom français se demande
 * d'abord s'il est concerné. Lui répondre avant qu'il ait à chercher
 * évite le départ silencieux — c'est le même ressort que le reste du
 * site : lever le doute avant qu'il ne devienne un renoncement.
 *
 * Le pays est lu dans le cookie posé par le middleware. Rien n'est rendu
 * côté serveur : les pages restent statiques, et le message apparaît une
 * fois la page affichée.
 */
export default function LivraisonBelgique({
  variant = 'bandeau',
}: {
  variant?: 'bandeau' | 'ligne'
}) {
  const [belge, setBelge] = useState(false)

  useEffect(() => {
    const pays = document.cookie
      .split('; ')
      .find((c) => c.startsWith('bt_pays='))
      ?.split('=')[1]
    if (pays === 'BE') setBelge(true)
  }, [])

  if (!belge) return null

  if (variant === 'ligne') {
    return (
      <p className="flex items-center gap-2 text-[15px] font-semibold text-brand-700">
        <Truck size={18} className="flex-shrink-0" />
        Oui, nous livrons en Belgique — livraison offerte dès 89 € d’achat.
      </p>
    )
  }

  return (
    <div className="flex items-start gap-3 bg-brand-50 border border-brand-200 rounded-lg p-4">
      <Truck size={20} className="text-brand-600 flex-shrink-0 mt-0.5" />
      <p className="text-[15px] text-gray-800 leading-snug">
        <strong className="text-ink">Vous êtes en Belgique&nbsp;? Nous livrons chez vous.</strong>{' '}
        Mêmes conditions qu’en France : livraison offerte dès 89&nbsp;€ d’achat, palette déposée au
        plus près de votre lieu de stockage.
      </p>
    </div>
  )
}
