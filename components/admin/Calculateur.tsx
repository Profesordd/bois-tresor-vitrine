'use client'

import { useState, useEffect } from 'react'
import { Calculator } from 'lucide-react'

/**
 * Calculateur de répartition du bénéfice du canal partenaire.
 *
 * Bénéfice = CA partenaire − spend publicitaire (le spend est saisi en
 * dollars, converti en euros par un taux ajustable).
 *
 * Partage : 50 % à l'associé 1, 50 % à l'associé 2. L'associé 2 reverse
 * 25 % de SA part à l'utilisateur. La part de l'utilisateur vaut donc
 * 12,5 % du bénéfice, et l'associé 2 garde 37,5 %.
 *
 * Tout se calcule dans le navigateur, rien n'est enregistré. Le taux de
 * change est mémorisé localement pour ne pas le retaper.
 */

const euro = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number.isFinite(n) ? n : 0)

export default function Calculateur({ caDefaut = 0 }: { caDefaut?: number }) {
  const [ca, setCa] = useState(String(caDefaut || ''))
  const [spend, setSpend] = useState('')
  const [taux, setTaux] = useState('0.92')

  /* Le taux change rarement : on le retient d'une visite à l'autre. */
  useEffect(() => {
    try {
      const t = localStorage.getItem('calc_taux_usd_eur')
      if (t) setTaux(t)
    } catch { /* navigation privée */ }
  }, [])
  useEffect(() => {
    try { localStorage.setItem('calc_taux_usd_eur', taux) } catch { /* ignore */ }
  }, [taux])

  const caN = parseFloat(ca.replace(',', '.')) || 0
  const spendN = parseFloat(spend.replace(',', '.')) || 0
  const tauxN = parseFloat(taux.replace(',', '.')) || 0

  const spendEur = spendN * tauxN
  const benefice = caN - spendEur
  const associe1 = benefice * 0.5
  const maPart = benefice * 0.5 * 0.25      // 25 % de la part de l'associé 2
  const associe2 = benefice * 0.5 * 0.75    // ce qu'il garde

  const champ = 'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-[16px] text-ink focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
  const label = 'block text-[13px] font-semibold text-gray-700 mb-1'

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="flex items-center gap-2 font-semibold text-ink mb-4">
        <Calculator size={18} className="text-brand-600" /> Répartition du bénéfice partenaire
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div>
          <label className={label} htmlFor="calc-ca">CA partenaire (€)</label>
          <input id="calc-ca" inputMode="decimal" className={champ} placeholder="0" value={ca} onChange={(e) => setCa(e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="calc-spend">Spend pub ($)</label>
          <input id="calc-spend" inputMode="decimal" className={champ} placeholder="0" value={spend} onChange={(e) => setSpend(e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="calc-taux">Taux $ → €</label>
          <input id="calc-taux" inputMode="decimal" className={champ} value={taux} onChange={(e) => setTaux(e.target.value)} />
        </div>
      </div>

      <div className="rounded-lg bg-gray-50 border border-gray-100 p-4 space-y-2.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] text-gray-500">Spend converti</span>
          <span className="text-[14px] text-gray-600">{euro(spendEur)}</span>
        </div>
        <div className="flex items-baseline justify-between border-t border-gray-200 pt-2.5">
          <span className="font-semibold text-ink">Bénéfice</span>
          <span className={`text-xl font-bold ${benefice < 0 ? 'text-red-600' : 'text-ink'}`}>{euro(benefice)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Associé 1 <span className="text-gray-400">(50 %)</span></p>
          <p className="font-serif text-xl font-bold text-ink mt-1">{euro(associe1)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Associé 2 <span className="text-gray-400">(37,5 %)</span></p>
          <p className="font-serif text-xl font-bold text-ink mt-1">{euro(associe2)}</p>
        </div>
        <div className="rounded-lg border-2 border-brand-300 bg-brand-50 p-4">
          <p className="text-xs text-brand-800 font-medium">Ta part <span className="text-brand-600">(12,5 %)</span></p>
          <p className="font-serif text-xl font-bold text-brand-800 mt-1">{euro(maPart)}</p>
        </div>
      </div>

      <p className="text-[11px] text-gray-400 mt-3">
        25 % de la part de l’associé 2. Rien n’est enregistré, le calcul se fait sur ton écran.
      </p>
    </section>
  )
}
