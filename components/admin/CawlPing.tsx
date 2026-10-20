'use client'

import { useState } from 'react'
import { Plug, Check, AlertTriangle, Loader2 } from 'lucide-react'

/**
 * Vérifie que les clés enregistrées sur l'hébergeur sont les bonnes.
 *
 * Une clé tronquée au copier-coller ne se voit qu'au premier paiement, et
 * ce premier paiement débite une vraie carte. Ce bouton ne débite rien.
 */
export default function CawlPing() {
  const [etat, setEtat] = useState<'attente' | 'essai' | 'ok' | 'erreur'>('attente')
  const [message, setMessage] = useState('')

  async function tester() {
    setEtat('essai')
    try {
      const r = await fetch('/api/admin/cawl/ping/')
      const j = await r.json()
      setEtat(j.ok ? 'ok' : 'erreur')
      setMessage(j.message ?? j.error ?? `Erreur ${r.status}`)
    } catch {
      setEtat('erreur')
      setMessage('La requête n’a pas abouti')
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={tester}
        disabled={etat === 'essai'}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 hover:border-brand-500 bg-white text-gray-700 text-sm font-medium px-3.5 py-2 disabled:opacity-60"
      >
        {etat === 'essai'
          ? <Loader2 size={15} className="animate-spin text-brand-600" />
          : <Plug size={15} className="text-brand-600" />}
        {etat === 'essai' ? 'Vérification…' : 'Tester la connexion (sans débit)'}
      </button>
      {message && (
        <p className={`flex items-center gap-1.5 text-[14px] mt-2 ${etat === 'erreur' ? 'text-red-700' : 'text-brand-800'}`}>
          {etat === 'erreur' ? <AlertTriangle size={14} /> : <Check size={14} className="text-brand-600" />}
          {message}
        </p>
      )}
    </div>
  )
}
