import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface Props {
  /** 'full' : bloc large avec photo (page collection, accueil). 'compact' : encart resserré (fiche produit). */
  variant?: 'full' | 'compact'
}

/**
 * Message n°1 du persona : « on est une vraie entreprise familiale française,
 * pas un site anonyme qui arnaque ». Incarné par la vraie photo des deux frères.
 */
export default function FamilyBlock({ variant = 'full' }: Props) {
  if (variant === 'compact') {
    return (
      <Link
        href="/a-propos"
        className="flex items-center gap-4 bg-brand-50 border border-brand-100 rounded-lg p-4 hover:border-brand-300 transition-colors"
      >
        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
          <Image src="/thomas-julien.jpg" alt="Thomas et Julien" fill className="object-cover" sizes="80px" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-ink leading-snug">Entreprise familiale française</p>
          <p className="text-sm text-gray-600 mt-1 leading-snug">
            Thomas et Julien, deux frères du Jura. Notre histoire
            <ArrowRight size={14} className="inline ml-1 -mt-0.5 text-brand-600" />
          </p>
        </div>
      </Link>
    )
  }

  return (
    <section className="bg-brand-50 border border-brand-100 rounded-lg overflow-hidden">
      {/* Colonne image large : un cadrage étroit couperait l'un des deux frères. */}
      <div className="grid sm:grid-cols-2 gap-0">
        <div className="relative h-56 sm:h-full min-h-[260px]">
          <Image
            src="/thomas-julien.jpg"
            alt="Thomas et Julien devant leur stock de bûches"
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        </div>
        <div className="p-6 sm:p-7">
          <h2 className="font-serif text-2xl font-bold text-ink mb-3">
            Une entreprise familiale française
          </h2>
          <p className="text-gray-700 leading-relaxed mb-2">
            Nous sommes Thomas et Julien, deux frères du Jura. Notre père était bûcheron, notre
            grand-père aussi.
          </p>
          <p className="text-gray-700 leading-relaxed mb-3">
            Nous vendons le bois que nous préparons nous-mêmes, et nous répondons nous-mêmes à vos e-mails.
            Pas de société anonyme, pas de mauvaise surprise.
          </p>
          <p className="text-gray-800 leading-relaxed mb-5 font-medium">
            On se chauffe nous-mêmes au bois depuis toujours : on sait ce que c’est d’attendre une
            livraison en plein hiver.
          </p>
          <Link
            href="/a-propos"
            className="inline-flex items-center gap-2 text-brand-700 font-semibold hover:text-brand-800 transition-colors"
          >
            Découvrir notre histoire
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  )
}
