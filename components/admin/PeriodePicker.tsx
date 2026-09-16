'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { CalendarDays } from 'lucide-react'

interface Props {
  du: string
  au: string
  /** Date du jour à Paris, pour borner les champs. */
  max: string
  raccourcis: { label: string; du: string; au: string }[]
}

/**
 * Choix de la période, exprimée en journées françaises.
 *
 * Les raccourcis couvrent l'usage courant ; les deux champs de date
 * permettent d'isoler une journée précise — « le 15 septembre », et non
 * « les 7 derniers jours » — pour comparer l'effet d'une campagne au jour
 * le jour.
 */
export default function PeriodePicker({ du, au, max, raccourcis }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [debut, setDebut] = useState(du)
  const [fin, setFin] = useState(au)

  function aller(d: string, f: string) {
    /* Dates inversées : on les remet dans l'ordre plutôt que d'afficher
       une erreur, l'intention est sans ambiguïté. */
    const [a, b] = d <= f ? [d, f] : [f, d]
    startTransition(() => router.push(`/admin/?du=${a}&au=${b}`))
  }

  const actif = (r: { du: string; au: string }) => r.du === du && r.au === au

  return (
    <div className="flex flex-wrap items-center gap-2">
      {raccourcis.map((r) => (
        <button
          key={r.label}
          onClick={() => aller(r.du, r.au)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            actif(r)
              ? 'bg-brand-600 text-white border-brand-600'
              : 'border-gray-200 text-gray-600 hover:border-brand-400 bg-white'
          }`}
        >
          {r.label}
        </button>
      ))}

      <span className="flex items-center gap-1.5 border border-gray-200 rounded-lg bg-white px-2.5 py-1">
        <CalendarDays size={15} className="text-gray-400 flex-shrink-0" />
        <input
          type="date"
          value={debut}
          max={max}
          onChange={(e) => { setDebut(e.target.value); aller(e.target.value, fin) }}
          className="text-sm text-gray-700 bg-transparent outline-none w-[125px]"
          aria-label="Date de début"
        />
        <span className="text-gray-300">→</span>
        <input
          type="date"
          value={fin}
          max={max}
          onChange={(e) => { setFin(e.target.value); aller(debut, e.target.value) }}
          className="text-sm text-gray-700 bg-transparent outline-none w-[125px]"
          aria-label="Date de fin"
        />
      </span>

      {pending && <span className="text-xs text-gray-400">chargement…</span>}
    </div>
  )
}
