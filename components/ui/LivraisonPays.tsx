'use client'

import { useEffect, useState } from 'react'
import { Truck } from 'lucide-react'

/**
 * Pays voisins où le message mérite d'être dit explicitement.
 *
 * Un visiteur belge ou suisse qui arrive sur un site français, au nom
 * français, se demande d'abord s'il est concerné. Lui répondre avant qu'il
 * ait à chercher évite le départ silencieux — même ressort que le reste du
 * site : lever le doute avant qu'il ne devienne un renoncement.
 *
 * La France n'y figure pas : le site lui est déjà adressé, le dire serait
 * une évidence qui alourdit la page pour rien.
 */
const PAYS: Record<string, { nom: string; enTete: string }> = {
  BE: { nom: 'en Belgique',   enTete: 'Vous êtes en Belgique ?' },
  CH: { nom: 'en Suisse',     enTete: 'Vous êtes en Suisse ?' },
  LU: { nom: 'au Luxembourg', enTete: 'Vous êtes au Luxembourg ?' },
}

export default function LivraisonPays({
  variant = 'bandeau',
}: {
  variant?: 'bandeau' | 'ligne'
}) {
  const [code, setCode] = useState<string | null>(null)

  useEffect(() => {
    const pays = document.cookie
      .split('; ')
      .find((c) => c.startsWith('bt_pays='))
      ?.split('=')[1]
    if (pays && PAYS[pays]) setCode(pays)
  }, [])

  if (!code) return null
  const { nom, enTete } = PAYS[code]

  if (variant === 'ligne') {
    return (
      <p className="flex items-center gap-2 text-[15px] font-semibold text-brand-700">
        <Truck size={18} className="flex-shrink-0" />
        Oui, nous livrons {nom} — livraison offerte.
      </p>
    )
  }

  return (
    <div className="flex items-start gap-3 bg-brand-50 border border-brand-200 rounded-lg p-4">
      <Truck size={20} className="text-brand-600 flex-shrink-0 mt-0.5" />
      <p className="text-[15px] text-gray-800 leading-snug">
        <strong className="text-ink">{enTete} Nous livrons chez vous.</strong>{' '}
        Mêmes conditions qu’en France : livraison offerte, palette déposée au plus près de votre
        lieu de stockage.
      </p>
    </div>
  )
}
