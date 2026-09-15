import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

/**
 * Photo de l'équipe sur la fiche produit : incarner l'entreprise au moment
 * où le client décide. C'est la même photo que celle de la page « Qui
 * sommes-nous », volontairement, pour qu'il retrouve les mêmes visages.
 */
export default function TeamPhoto() {
  return (
    <figure>
      <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-gray-50">
        <Image
          src="/equipe.jpg"
          alt="Jean-Paul et Julien devant leur stock de bûches"
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>
      <figcaption className="mt-2 text-[15px] text-gray-600">
        Jean-Paul et Julien, entreprise familiale française.{' '}
        <Link href="/a-propos" className="text-brand-700 font-semibold hover:text-brand-800 whitespace-nowrap">
          Notre histoire
          <ArrowRight size={15} className="inline ml-1 -mt-0.5" />
        </Link>
      </figcaption>
    </figure>
  )
}
