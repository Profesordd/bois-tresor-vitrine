import { Users } from 'lucide-react'

interface Props {
  /** 'bar' : ligne pleine largeur (page collection). 'inline' : encart resserré (fiche produit). */
  variant?: 'bar' | 'inline'
}

/** Nombre de familles clientes, fourni par le client. */
const FAMILIES = 743

/**
 * Preuve sociale par le nombre. Volontairement statique et sobre :
 * un compteur animé serait lu comme un signal d'arnaque par le persona.
 */
export default function SocialProof({ variant = 'bar' }: Props) {
  const sentence = (
    <>
      Déjà <strong className="font-bold text-ink">{FAMILIES} familles</strong> nous font confiance
      pour se chauffer cet hiver.
    </>
  )

  if (variant === 'inline') {
    return (
      <p className="flex items-start gap-2.5 text-[15px] text-gray-700 leading-snug">
        <Users size={18} className="text-brand-600 flex-shrink-0 mt-0.5" />
        <span>{sentence}</span>
      </p>
    )
  }

  return (
    <p className="flex items-center justify-center gap-2.5 text-center text-base sm:text-lg text-gray-800 border-y border-gray-200 py-4">
      <Users size={20} className="text-brand-600 flex-shrink-0" />
      <span>{sentence}</span>
    </p>
  )
}
