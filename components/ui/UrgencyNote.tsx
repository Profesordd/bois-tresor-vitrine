import { CalendarClock } from 'lucide-react'

/**
 * Urgence CRÉDIBLE, jamais artificielle.
 * Le persona lit un faux compteur ou une fausse promo comme un signal d'arnaque :
 * aucune affirmation chiffrée sur les stocks, uniquement des faits saisonniers vrais.
 */
export default function UrgencyNote({ variant = 'saison' }: { variant?: 'saison' | 'destockage' | 'jardin' }) {
  return (
    <div className="flex gap-4 bg-white border-2 border-brand-200 rounded-lg p-5">
      <CalendarClock size={24} className="text-brand-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-bold text-ink mb-1">Mieux vaut commander tôt</p>
        {variant === 'jardin' ? (
          <p className="text-gray-700 leading-relaxed">
            C’est un déstockage : ce prix vaut tant qu’il reste du stock, et il ne sera pas
            renouvelé. Une fois le lot écoulé, il n’y en aura plus à ce prix.
          </p>
        ) : variant === 'destockage' ? (
          /* Un déstockage a une fin, c'est sa nature : on le dit sans chiffre
             et sans compte à rebours. */
          <p className="text-gray-700 leading-relaxed">
            C’est un déstockage : ce prix vaut tant qu’il reste du stock, et il ne sera pas
            renouvelé. Commandez avant les grands froids pour être livré à temps.
          </p>
        ) : (
          <p className="text-gray-700 leading-relaxed">
            Nous sommes une petite entreprise familiale : nos volumes de bois vraiment sec sont
            limités, et ce bois-là se raréfie toujours en cours de saison. Commandez avant les
            grands froids pour être livré à temps.
          </p>
        )}
      </div>
    </div>
  )
}
