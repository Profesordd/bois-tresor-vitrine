'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, AlertTriangle } from 'lucide-react'

/** Le bouton qui déclenche la désinscription, en POST. Voir la route. */
export default function FormulaireDesinscription({ id, jeton }: { id: string; jeton: string }) {
  const [etat, setEtat] = useState<'attente' | 'envoi' | 'fait' | 'erreur'>('attente')

  async function desinscrire() {
    setEtat('envoi')
    try {
      const r = await fetch(
        `/api/desinscription/?id=${encodeURIComponent(id)}&t=${encodeURIComponent(jeton)}`,
        { method: 'POST' }
      )
      setEtat(r.ok ? 'fait' : 'erreur')
    } catch {
      setEtat('erreur')
    }
  }

  if (etat === 'fait') {
    return (
      <div className="mt-8">
        <p className="flex items-center justify-center gap-2 text-brand-800 font-semibold text-lg">
          <Check size={22} className="text-brand-600" />
          C’est fait, votre adresse est retirée.
        </p>
        <Link
          href="/"
          className="inline-block mt-6 text-brand-700 hover:text-brand-800 font-medium underline"
        >
          Retour au site
        </Link>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={desinscrire}
        disabled={etat === 'envoi'}
        className="w-full sm:w-auto px-8 py-4 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-70 text-white font-bold text-[17px] transition-colors"
      >
        {etat === 'envoi' ? 'Un instant…' : 'Confirmer ma désinscription'}
      </button>

      {etat === 'erreur' && (
        <p className="flex items-center justify-center gap-2 text-red-700 mt-4 text-[15px]">
          <AlertTriangle size={17} className="flex-shrink-0" />
          Nous n’avons pas pu enregistrer votre demande. Écrivez-nous à contact@bois-tresor.com.
        </p>
      )}
    </div>
  )
}
