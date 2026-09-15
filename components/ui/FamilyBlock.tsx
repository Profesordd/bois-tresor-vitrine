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
          <Image src="/equipe.jpg" alt="Jean-Paul et Julien" fill className="object-cover" sizes="80px" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-ink leading-snug">Entreprise familiale française</p>
          <p className="text-sm text-gray-600 mt-1 leading-snug">
            Jean-Paul et Julien, deux frères du Jura. Notre histoire
            <ArrowRight size={14} className="inline ml-1 -mt-0.5 text-brand-600" />
          </p>
        </div>
      </Link>
    )
  }

  /**
   * Sur téléphone, ce bloc est réduit à l'essentiel : le récit complet
   * repoussait les produits à plus de deux écrans de haut. Il reste entier
   * sur grand écran, où la place ne manque pas, et sur la page « à propos »
   * à laquelle le lien conduit.
   */
  return (
    <section className="bg-brand-50 border border-brand-100 rounded-lg overflow-hidden">
      {/* Colonne image large : un cadrage étroit couperait l'un des deux frères. */}
      <div className="grid sm:grid-cols-2 gap-0">
        <div className="relative h-36 sm:h-full min-h-0 sm:min-h-[260px]">
          <Image
            src="/equipe.jpg"
            alt="Jean-Paul et Julien devant leur stock de bûches"
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        </div>
        <div className="p-4 sm:p-7">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink mb-2 sm:mb-3">
            Une entreprise familiale française
          </h2>

          {/* Version courte, téléphone uniquement. */}
          <p className="sm:hidden text-[15px] text-gray-700 leading-snug mb-3">
            Jean-Paul et Julien, deux frères du Jura. Nous préparons le bois nous-mêmes et
            répondons nous-mêmes à vos e-mails.
          </p>

          {/* Récit complet, à partir des écrans larges. */}
          <div className="hidden sm:block">
            <p className="text-gray-700 leading-relaxed mb-2">
              Nous sommes Jean-Paul et Julien, deux frères du Jura. Notre père était bûcheron, notre
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
          </div>

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
