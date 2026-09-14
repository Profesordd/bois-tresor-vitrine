import Image from 'next/image'

/**
 * Marque NF délivrée par le FCBA.
 *
 * ATTENTION — le fichier fourni s'appelait « NF-Parquets_generique_logo.png ».
 * Le visuel lui-même est générique (« NF » + « Certifié par FCBA », sans
 * mention de gamme), et le FCBA est bien l'organisme certificateur de
 * NF Bois de Chauffage. Il reste à faire confirmer par le client que c'est
 * bien le visuel que le FCBA lui a remis pour SA certification bois de
 * chauffage — le remplacer ici le cas échéant.
 *
 * Ce logo ne doit apparaître que sur les bûches : la certification
 * NF Bois de Chauffage ne couvre pas les granulés.
 */
interface Props {
  /** Largeur affichée en pixels. */
  width?: number
  className?: string
}

export default function NfBadge({ width = 74, className = '' }: Props) {
  return (
    <Image
      src="/certifications/nf-fcba.png"
      alt="Certifié NF Bois de Chauffage par le FCBA"
      width={width}
      height={Math.round((width * 560) / 701)}
      className={className}
    />
  )
}
