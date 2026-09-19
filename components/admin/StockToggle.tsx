'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  slug: string
  epuise: boolean
}

/**
 * Bascule rupture / en vente pour un produit, depuis le tableau de bord.
 * La route purge le cache des fiches : le changement est visible sur le
 * site dès la réponse.
 */
export default function StockToggle({ slug, epuise }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [erreur, setErreur] = useState<string | null>(null)

  async function basculer() {
    setErreur(null)
    const res = await fetch('/api/admin/stock/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, epuise: !epuise }),
    })
    if (!res.ok) { setErreur('Échec, réessayez.'); return }
    startTransition(() => router.refresh())
  }

  return (
    <span className="inline-flex items-center gap-2">
      {erreur && <span className="text-xs text-red-600">{erreur}</span>}
      <button
        onClick={basculer}
        disabled={pending}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-60 ${
          epuise
            ? 'border-brand-300 text-brand-700 bg-brand-50 hover:border-brand-500'
            : 'border-gray-200 text-gray-700 bg-white hover:border-red-400 hover:text-red-700'
        }`}
      >
        {pending ? '…' : epuise ? 'Remettre en vente' : 'Marquer en rupture'}
      </button>
    </span>
  )
}
