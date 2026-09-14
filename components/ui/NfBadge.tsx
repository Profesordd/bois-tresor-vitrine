import Image from 'next/image'

/**
 * Certification NF Bois de Chauffage.
 *
 * Le logo NF est une marque de certification déposée : il ne peut pas être
 * redessiné, seul le fichier officiel remis au certifié par l'organisme peut
 * être affiché. En attendant ce fichier, on affiche une mention textuelle
 * sobre — véridique puisque le client est certifié — sans imiter la marque.
 *
 * Pour activer le vrai logo : déposer le fichier dans
 * public/certifications/nf-bois-de-chauffage.png puis renseigner NF_LOGO_SRC.
 */
const NF_LOGO_SRC: string | null = null

interface Props {
  className?: string
}

export default function NfBadge({ className = '' }: Props) {
  if (NF_LOGO_SRC) {
    return (
      <Image
        src={NF_LOGO_SRC}
        alt="Certifié NF Bois de Chauffage"
        width={64}
        height={64}
        className={className}
      />
    )
  }

  return (
    <span
      className={`inline-flex flex-col items-center leading-tight border-2 border-gray-300 rounded px-3 py-1.5 text-center ${className}`}
      title="Certification NF Bois de Chauffage — logo officiel à intégrer"
    >
      <span className="text-[11px] font-bold tracking-wide text-gray-600">CERTIFIÉ</span>
      <span className="text-[13px] font-bold text-gray-700">NF Bois de Chauffage</span>
      <span className="text-[10px] text-amber-700 mt-0.5">logo officiel à fournir</span>
    </span>
  )
}
