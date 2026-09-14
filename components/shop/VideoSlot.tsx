'use client'

import { useState } from 'react'
import Image from 'next/image'
import { PlayCircle } from 'lucide-react'

/**
 * Emplacement vidéo de la fiche produit.
 *
 * ATTENTION — la vidéo actuellement branchée est celle de SERVI BOIS
 * (Aix-en-Provence) : c'est une AUTRE entreprise, son camion et son logo sont
 * visibles à l'écran. Elle sert uniquement à tester le rendu. À remplacer par
 * la vidéo de Jean-Paul et Julien avant toute mise en ligne réelle.
 *
 * Lecture au clic seulement, et domaine youtube-nocookie : rien n'est chargé
 * depuis YouTube tant que le visiteur ne lance pas la vidéo. C'est ce qui
 * permet à la page « politique cookies » de rester exacte.
 */
const VIDEO_ID = 'HD0YeBFFbw8'

export default function VideoSlot() {
  const [playing, setPlaying] = useState(false)

  return (
    <figure>
      <div className="relative aspect-video rounded-lg bg-ink overflow-hidden">
        {playing ? (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&rel=0`}
            title="Livraison de bois de chauffage sur palette"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 w-full h-full"
            aria-label="Lire la vidéo de livraison"
          >
            <Image
              src="/video/apercu-video.jpg"
              alt="Livraison d’une palette de bois de chauffage par camion"
              fill
              className="object-cover opacity-85 group-hover:opacity-100 transition-opacity"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <span className="absolute inset-0 flex flex-col items-center justify-center bg-black/35">
              <PlayCircle size={62} className="text-white drop-shadow" strokeWidth={1.4} />
              <span className="text-white font-semibold mt-2 drop-shadow">
                Voir une livraison en vidéo
              </span>
            </span>
            <span className="absolute top-3 right-3 bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5 rounded border border-dashed border-amber-400">
              vidéo d’exemple — à remplacer
            </span>
          </button>
        )}
      </div>
      <figcaption className="text-sm text-gray-500 mt-2">
        Vidéo d’exemple (SERVI BOIS) affichée pour le test : à remplacer par votre propre vidéo
        avant la mise en ligne.
      </figcaption>
    </figure>
  )
}
