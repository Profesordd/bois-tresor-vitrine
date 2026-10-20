'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Check, AlertTriangle } from 'lucide-react'

/**
 * Déclenche l'envoi des relances dues, sans attendre le planificateur.
 *
 * Le planificateur de Vercel passe toutes les heures ; ce bouton sert à
 * vérifier tout de suite que la chaîne fonctionne, et à rattraper une
 * exécution manquée.
 */
export default function BoutonRelances() {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [etat, setEtat] = useState<'attente' | 'envoi' | 'fait' | 'erreur'>('attente')
  const [bilan, setBilan] = useState('')

  async function lancer() {
    setEtat('envoi')
    try {
      const r = await fetch('/api/relances/', { method: 'POST' })
      const data = await r.json().catch(() => null)
      if (!r.ok || data?.erreur) {
        setEtat('erreur')
        setBilan(data?.erreur ?? data?.error ?? `erreur ${r.status}`)
        return
      }
      setEtat('fait')
      setBilan(
        data.envoyes === 0 && data.echecs === 0
          ? 'Aucune relance due pour le moment.'
          : `${data.envoyes} envoyée${data.envoyes > 1 ? 's' : ''}${data.echecs > 0 ? `, ${data.echecs} en échec` : ''}.`
      )
      startTransition(() => router.refresh())
    } catch {
      setEtat('erreur')
      setBilan('la requête n’a pas abouti')
    }
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={lancer}
        disabled={etat === 'envoi'}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 hover:border-brand-500 bg-white text-gray-700 text-sm font-medium px-3.5 py-2 disabled:opacity-60"
      >
        <Send size={15} className="text-brand-600" />
        {etat === 'envoi' ? 'Envoi en cours…' : 'Envoyer les relances dues'}
      </button>
      {bilan && (
        <p className={`flex items-center justify-end gap-1.5 text-[13px] mt-1.5 ${etat === 'erreur' ? 'text-red-700' : 'text-gray-500'}`}>
          {etat === 'erreur' ? <AlertTriangle size={13} /> : <Check size={13} className="text-brand-600" />}
          {bilan}
        </p>
      )}
    </div>
  )
}
