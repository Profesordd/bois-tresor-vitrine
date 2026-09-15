'use client'

import { useState } from 'react'
import { Package, Search, Copy, ArrowLeft } from 'lucide-react'
import type { OrderStatus } from '@/types/database'

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending:    'Commande reçue',
  paid:       'Paiement confirmé',
  processing: 'En préparation',
  shipped:    'Expédiée',
  delivered:  'Livrée',
  cancelled:  'Annulée',
  refunded:   'Remboursée',
}

const STATUS_PROGRESS: Record<OrderStatus, number> = {
  pending: 15, paid: 30, processing: 50, shipped: 75, delivered: 100, cancelled: 0, refunded: 0,
}

interface TrackResult {
  orderCode:    string
  status:       OrderStatus
  createdAt:    string
  city:         string | null
  postalCode:   string | null
  customerName: string
}

function TrackingView({ result, onReset, onCopy, copied }: { result: TrackResult; onReset: () => void; onCopy: () => void; copied: boolean }) {
  const steps: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered']
  const currentIdx = steps.indexOf(result.status)

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-[1fr_260px] gap-5">
        <div className="bg-white rounded-lg border border-brand-100 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex flex-wrap gap-2 mb-5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-200 bg-brand-50 text-xs font-semibold text-brand-600">
                Commande #{result.orderCode}
              </span>
              {result.city && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-200 bg-brand-50 text-xs font-semibold text-brand-600">
                  {result.city}{result.postalCode ? ` (${result.postalCode})` : ''}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-200 bg-brand-50 text-xs font-semibold text-brand-600">
                {fmt(result.createdAt)}
              </span>
            </div>

            <div className="bg-brand-50 border border-brand-100 rounded-lg p-5 mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-400 mb-1">Statut actuel</p>
              <p className="text-2xl font-extrabold text-brand-900 tracking-tight mb-4">{STATUS_LABEL[result.status]}</p>
              <div className="h-1.5 bg-brand-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-600 rounded-full transition-all duration-700"
                  style={{ width: `${STATUS_PROGRESS[result.status]}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {steps.map((s, i) => (
                <div key={s} className="bg-white border border-brand-100 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-sm flex-shrink-0 ${i <= currentIdx ? 'bg-brand-600' : 'bg-brand-200'}`} />
                    <span className="text-xs font-bold text-brand-800">{STATUS_LABEL[s]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-brand-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-brand-100 flex-1">
            <h3 className="font-bold text-brand-900 text-sm mb-2">Besoin d’aide ?</h3>
            <p className="text-brand-500 text-sm leading-relaxed">Notre équipe répond sous 24h ouvrées.</p>
          </div>
          <div className="p-4 flex flex-col gap-2">
            <button
              onClick={onCopy}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-brand-200 bg-white hover:bg-brand-50 text-sm font-semibold text-brand-700 transition-colors"
            >
              <Copy size={13} />
              {copied ? 'Copié !' : 'Copier le n° de commande'}
            </button>
            <button
              onClick={onReset}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-brand-200 bg-white hover:bg-brand-50 text-sm font-semibold text-brand-700 transition-colors"
            >
              <ArrowLeft size={13} />
              Modifier les informations
            </button>
            <a
              href="/contact"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors"
            >
              Contacter le support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SuiviCommandePage() {
  const [form, setForm]       = useState({ number: '', email: '' })
  const [result, setResult]   = useState<TrackResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [copied, setCopied]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.number.trim() || !form.email.trim()) { setError('Veuillez remplir tous les champs.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), orderCode: form.number.trim() }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Commande introuvable.'); return }
      setResult(json)
    } catch {
      setError('Impossible de se connecter. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  function reset() { setResult(null); setForm({ number: '', email: '' }); setError('') }

  function copyOrder() {
    if (!result) return
    navigator.clipboard?.writeText(result.orderCode).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <div className="bg-brand-800 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Package size={40} className="mx-auto mb-3 opacity-90" />
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 font-serif">Suivi de commande</h1>
          <p className="text-brand-100">Suivez l&apos;avancement de votre livraison</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
        {!result ? (
          <div className="bg-white rounded-lg border border-brand-100 shadow-sm p-8">
            <h2 className="text-2xl font-bold text-brand-900 mb-1">Où est ma commande ?</h2>
            <p className="text-brand-500 text-sm mb-7">
              Entrez votre email et votre numéro de commande pour consulter l&apos;état de votre livraison.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-500 mb-1.5">Adresse e-mail</label>
                  <input
                    type="email" required value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="votre@email.com"
                    className="w-full border border-brand-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-500 mb-1.5">Numéro de commande</label>
                  <input
                    type="text" required value={form.number}
                    onChange={e => setForm(f => ({ ...f, number: e.target.value.toUpperCase() }))}
                    placeholder="ex : BA4F2C1D"
                    className="w-full border border-brand-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono tracking-wider"
                  />
                </div>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit" disabled={loading}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Recherche en cours…</>
                  : <><Search size={16} /> Suivre ma commande</>
                }
              </button>
              <p className="text-xs text-brand-400 text-center">
                Vous ne retrouvez pas votre commande ici ? Écrivez-nous à contact@bois-tresor.com
                avec votre numéro de commande, nous vous répondons sous 24 h ouvrées.
              </p>
            </form>
          </div>
        ) : (
          <TrackingView result={result} onReset={reset} onCopy={copyOrder} copied={copied} />
        )}
      </div>
    </div>
  )
}
