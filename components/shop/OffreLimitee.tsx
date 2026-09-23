'use client'

import { useEffect, useState } from 'react'
import { CalendarClock, PackageCheck } from 'lucide-react'

interface Props {
  finAt: string
  lotsRestants: number
  /** Prévient le sélecteur dès que l'offre s'arrête, pour retirer l'achat. */
  onTermine?: (termine: boolean) => void
}

function restant(finAt: string) {
  const ms = new Date(finAt).getTime() - Date.now()
  if (ms <= 0) return null
  const s = Math.floor(ms / 1000)
  return { j: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 }
}

const FIN = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  timeZone: 'Europe/Paris',
})

/**
 * Offre à durée et quantité limitées.
 *
 * Le compte à rebours vise une date fixe, écrite dans le catalogue : il
 * affiche la même chose pour tout le monde et ne repart pas à zéro d'une
 * visite à l'autre. La date de fin est écrite en toutes lettres à côté —
 * c'est ce qui distingue une vraie échéance d'un minuteur décoratif, et
 * un acheteur méfiant fait la différence.
 */
export default function OffreLimitee({ finAt, lotsRestants, onTermine }: Props) {
  /* Rien au premier rendu : l'heure du serveur et celle du visiteur
     diffèrent, et React refuserait l'hydratation. */
  const [temps, setTemps] = useState<ReturnType<typeof restant> | undefined>(undefined)

  useEffect(() => {
    const tic = () => {
      const t = restant(finAt)
      setTemps(t)
      onTermine?.(t === null)
    }
    tic()
    const id = setInterval(tic, 1000)
    return () => clearInterval(id)
  }, [finAt, onTermine])

  if (temps === undefined) return null

  if (temps === null) {
    return (
      <div className="rounded-lg border-2 border-gray-300 bg-gray-50 p-4">
        <p className="font-bold text-ink">Cette offre est terminée</p>
        <p className="text-[15px] text-gray-600 mt-1 leading-snug">
          Le prix affiché n’est plus valable. Écrivez-nous pour connaître nos disponibilités.
        </p>
      </div>
    )
  }

  const bloc = (valeur: number, unite: string) => (
    <span className="flex flex-col items-center min-w-[52px] rounded-md bg-white border border-amber-300 px-2 py-1.5">
      <span className="text-xl font-bold text-ink tabular-nums leading-none">
        {String(valeur).padStart(2, '0')}
      </span>
      <span className="text-[11px] uppercase tracking-wide text-gray-500 mt-0.5">{unite}</span>
    </span>
  )

  return (
    <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-4">
      <p className="flex items-center gap-2 font-bold text-ink">
        <PackageCheck size={19} className="text-amber-700 flex-shrink-0" />
        Plus que {lotsRestants} lot{lotsRestants > 1 ? 's' : ''} disponible{lotsRestants > 1 ? 's' : ''} à ce prix
      </p>
      <p className="text-[15px] text-gray-700 mt-1 leading-snug">
        Ce lot vient d’un arrivage particulier : une fois écoulé, il ne sera pas renouvelé à ce prix.
      </p>

      <div className="flex items-center gap-2 mt-3">
        {bloc(temps.j, temps.j > 1 ? 'jours' : 'jour')}
        {bloc(temps.h, 'h')}
        {bloc(temps.m, 'min')}
        {bloc(temps.s, 'sec')}
      </div>
      <p className="flex items-center gap-1.5 text-[13px] text-gray-600 mt-2">
        <CalendarClock size={14} className="text-amber-700 flex-shrink-0" />
        Offre valable jusqu’au {FIN.format(new Date(finAt))}
      </p>
    </div>
  )
}
