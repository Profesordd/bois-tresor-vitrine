'use client'

import { useState } from 'react'
import { Send, Check, AlertTriangle } from 'lucide-react'

/**
 * Envoie les cinq relances à une adresse, pour les relire dans une vraie
 * boîte mail. Rien n'est enregistré : ces essais ne consomment aucune
 * étape, un vrai prospect recevra bien ses cinq messages.
 */
export default function EnvoiApercu() {
  const [email, setEmail] = useState('')
  const [etat, setEtat] = useState<'attente' | 'envoi' | 'fait' | 'erreur'>('attente')
  const [bilan, setBilan] = useState('')

  async function envoyer(e: React.FormEvent) {
    e.preventDefault()
    setEtat('envoi')
    try {
      const r = await fetch('/api/relances/apercu/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await r.json().catch(() => null)
      if (!r.ok || data?.erreur) {
        setEtat('erreur')
        setBilan(data?.erreur ?? data?.error ?? `erreur ${r.status}`)
        return
      }
      const rates = (data.details ?? []).filter((d: { ok: boolean }) => !d.ok)
      setEtat(rates.length > 0 ? 'erreur' : 'fait')
      setBilan(
        rates.length > 0
          ? `${data.envoyes}/5 partis. Échec : ${rates[0].erreur}`
          : `Les 5 messages sont partis vers ${data.destinataire}.`
      )
    } catch {
      setEtat('erreur')
      setBilan('la requête n’a pas abouti')
    }
  }

  return (
    <form onSubmit={envoyer} className="rounded-lg border border-gray-200 bg-white p-5 mt-6">
      <label htmlFor="apercu-email" className="block font-semibold text-ink">
        Recevoir les 5 messages
      </label>
      <p className="text-sm text-gray-500 mt-0.5 mb-3">
        Pour les relire dans une vraie boîte mail. Ces envois ne comptent pas comme des
        étapes : personne n’est privé de son message.
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          id="apercu-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@adresse.fr"
          className="flex-1 min-w-[220px] rounded-lg border border-gray-300 px-3.5 py-2.5 text-[15px] focus:outline-none focus:border-brand-600"
        />
        <button
          type="submit"
          disabled={etat === 'envoi'}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5"
        >
          <Send size={15} />
          {etat === 'envoi' ? 'Envoi…' : 'Me les envoyer'}
        </button>
      </div>
      {bilan && (
        <p className={`flex items-center gap-1.5 text-[13px] mt-2.5 ${etat === 'erreur' ? 'text-red-700' : 'text-brand-800'}`}>
          {etat === 'erreur' ? <AlertTriangle size={13} /> : <Check size={13} className="text-brand-600" />}
          {bilan}
        </p>
      )}
    </form>
  )
}
