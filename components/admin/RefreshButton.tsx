'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCw } from 'lucide-react'

/**
 * Recharge les données de la page sans recharger le navigateur.
 *
 * Les pages d'administration sont rendues à la demande : un simple
 * router.refresh() suffit à rejouer les requêtes et à faire apparaître les
 * demandes arrivées entre-temps.
 */
export default function RefreshButton({ label = 'Actualiser' }: { label?: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null)

  function refresh() {
    startTransition(() => {
      router.refresh()
      setRefreshedAt(new Date())
    })
  }

  return (
    <div className="flex items-center gap-2.5">
      {refreshedAt && !pending && (
        <span className="text-xs text-gray-400">
          à jour à {refreshedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      )}
      <button
        onClick={refresh}
        disabled={pending}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:border-brand-400 hover:text-brand-700 disabled:opacity-60 transition-colors bg-white"
      >
        <RotateCw size={15} className={pending ? 'animate-spin' : ''} />
        {pending ? 'Actualisation…' : label}
      </button>
    </div>
  )
}
