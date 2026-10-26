'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calculator } from 'lucide-react'
import type { LigneJournal } from '@/lib/partenaire/journal'

/**
 * Saisie du spend quotidien du partenaire et historique de la répartition.
 *
 * Le CA vient des ventes réelles (en euros), converti en dollars. Le
 * partenaire saisit son spend en dollars pour un jour, ça s'enregistre, et
 * le propriétaire comme le partenaire voient l'historique et les parts.
 */

const usd = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(Number.isFinite(n) ? n : 0)
const eur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number.isFinite(n) ? n : 0)
const jourFr = (j: string) => new Date(`${j}T12:00:00Z`).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })

export default function CalculateurPartenaire({ lignes, tauxDefaut }: { lignes: LigneJournal[]; tauxDefaut: number }) {
  const router = useRouter()
  const aujourdhui = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })
  const [jour, setJour] = useState(aujourdhui)
  const [spend, setSpend] = useState('')
  const [taux, setTaux] = useState(String(tauxDefaut))
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    try { const t = localStorage.getItem('spend_taux_eur_usd'); if (t) setTaux(t) } catch { /* privé */ }
  }, [])

  /* Quand on choisit un jour déjà saisi, on pré-remplit ses valeurs. */
  useEffect(() => {
    const l = lignes.find((x) => x.jour === jour)
    if (l && l.spendUsd > 0) { setSpend(String(l.spendUsd)); setTaux(String(l.taux)) }
  }, [jour, lignes])

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setMsg(null)
    try { localStorage.setItem('spend_taux_eur_usd', taux) } catch { /* ignore */ }
    try {
      const r = await fetch('/api/partenaire/spend/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jour, spend: parseFloat(spend.replace(',', '.')) || 0, taux: parseFloat(taux.replace(',', '.')) || 0 }),
      })
      if (!r.ok) { const j = await r.json().catch(() => ({})); setMsg(j.error ?? 'Erreur'); return }
      setMsg('Enregistré')
      router.refresh()
    } finally { setBusy(false) }
  }

  const champ = 'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-[16px] text-ink focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
  const label = 'block text-[13px] font-semibold text-gray-700 mb-1'

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="flex items-center gap-2 font-semibold text-ink mb-1">
        <Calculator size={18} className="text-brand-600" /> Répartition du bénéfice partenaire
      </h2>
      <p className="text-[13px] text-gray-500 mb-4">
        Le CA vient des ventes (euros), converti en dollars. Saisis le spend pub du jour, tout le
        reste est en dollars. 50 % associé 1 · 37,5 % associé 2 · 12,5 % toi.
      </p>

      <form onSubmit={enregistrer} className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end mb-5">
        <div>
          <label className={label} htmlFor="sp-jour">Jour</label>
          <input id="sp-jour" type="date" max={aujourdhui} className={champ} value={jour} onChange={(e) => setJour(e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="sp-spend">Spend pub ($)</label>
          <input id="sp-spend" inputMode="decimal" className={champ} placeholder="0" value={spend} onChange={(e) => setSpend(e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="sp-taux">Taux € → $</label>
          <input id="sp-taux" inputMode="decimal" className={champ} value={taux} onChange={(e) => setTaux(e.target.value)} />
        </div>
        <button type="submit" disabled={busy}
          className="rounded-lg bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 text-white font-semibold py-2.5 transition-colors">
          {busy ? '…' : 'Enregistrer'}
        </button>
        {msg && <p className="col-span-2 sm:col-span-4 text-[13px] text-gray-500">{msg}</p>}
      </form>

      {lignes.length === 0 ? (
        <p className="text-sm text-gray-500">Aucune journée enregistrée pour l’instant.</p>
      ) : (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="py-2 px-1 font-medium">Jour</th>
                <th className="py-2 px-1 font-medium text-right">CA €</th>
                <th className="py-2 px-1 font-medium text-right">CA $</th>
                <th className="py-2 px-1 font-medium text-right">Spend $</th>
                <th className="py-2 px-1 font-medium text-right">Bénéfice $</th>
                <th className="py-2 px-1 font-medium text-right">Assoc. 1</th>
                <th className="py-2 px-1 font-medium text-right">Assoc. 2</th>
                <th className="py-2 px-1 font-medium text-right text-brand-700">Toi</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => (
                <tr key={l.jour} className="border-b border-gray-100">
                  <td className="py-2 px-1 font-medium text-ink whitespace-nowrap">{jourFr(l.jour)}</td>
                  <td className="py-2 px-1 text-right text-gray-600">{eur(l.caEur)}</td>
                  <td className="py-2 px-1 text-right text-gray-600">{usd(l.caUsd)}</td>
                  <td className="py-2 px-1 text-right text-gray-600">{l.spendUsd > 0 ? usd(l.spendUsd) : '—'}</td>
                  <td className={`py-2 px-1 text-right font-semibold ${l.benefice < 0 ? 'text-red-600' : 'text-ink'}`}>{usd(l.benefice)}</td>
                  <td className="py-2 px-1 text-right text-gray-600">{usd(l.associe1)}</td>
                  <td className="py-2 px-1 text-right text-gray-600">{usd(l.associe2)}</td>
                  <td className="py-2 px-1 text-right font-bold text-brand-700">{usd(l.maPart)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
