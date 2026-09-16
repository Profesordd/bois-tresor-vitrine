'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw } from 'lucide-react'

export interface AdresseBloquee {
  email: string
  blocked_at: string
  nom: string | null
  extrait: string | null
}

/**
 * Une adresse bloquée, avec de quoi juger et revenir en arrière.
 *
 * L'extrait du message est affiché : sans lui, impossible de se rappeler
 * des semaines plus tard pourquoi telle adresse a été bloquée, ni de
 * distinguer un vrai indésirable d'un client écarté par erreur.
 */
export default function BlocklistItem({ a }: { a: AdresseBloquee }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  async function debloquer() {
    await fetch('/api/admin/messages/', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: a.email }),
    })
    startTransition(() => router.refresh())
  }

  return (
    <div className="px-4 py-3 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-ink break-all">
          {a.email}
          {a.nom && <span className="text-gray-500"> · {a.nom}</span>}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          bloquée le {new Date(a.blocked_at).toLocaleDateString('fr-FR')}
        </p>
        {a.extrait && (
          <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 bg-gray-50 rounded p-2">
            « {a.extrait} »
          </p>
        )}
      </div>
      <button
        onClick={debloquer}
        disabled={pending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-brand-400 hover:text-brand-700 disabled:opacity-60 transition-colors flex-shrink-0"
      >
        <RotateCcw size={14} />
        {pending ? 'Déblocage…' : 'Débloquer'}
      </button>
    </div>
  )
}
