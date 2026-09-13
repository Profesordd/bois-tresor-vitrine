'use client'

import { useState } from 'react'
import { Mail, Clock, MapPin, CheckCircle } from 'lucide-react'

export default function ContactPage() {
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState({ name: '', email: '', subject: '', message: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/emails/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setSent(true)
    } catch {
      setError('Une erreur est survenue. Réessayez ou contactez-nous directement par email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="bg-gradient-to-r from-brand-800 to-brand-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 font-serif">Contactez-nous</h1>
          <p className="text-brand-100">Notre équipe vous répond sous 24h ouvrées</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid lg:grid-cols-3 gap-10">

          <div className="space-y-6">
            <h2 className="text-xl font-bold text-brand-900 mb-6">Nos coordonnées</h2>

            {[
              { icon: Mail,   title: 'Email',    val: 'contact@bois-tresor.com', sub: 'Réponse sous 24h' },
              { icon: Clock,  title: 'Horaires',  val: 'Lun – Ven : 9h – 18h', sub: 'Fermé week-end et jours fériés' },
              { icon: MapPin, title: 'Adresse',   val: 'France métropolitaine', sub: 'Service 100% en ligne' },
            ].map(({ icon: Icon, title, val, sub }) => (
              <div key={title} className="flex gap-4 p-4 bg-brand-50 rounded-xl">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-brand-600" />
                </div>
                <div>
                  <p className="font-semibold text-brand-900 text-sm">{title}</p>
                  <p className="text-brand-700 text-sm">{val}</p>
                  <p className="text-brand-400 text-xs mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2">
            {sent ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <CheckCircle size={56} className="text-brand-500 mb-4" />
                <h3 className="text-2xl font-bold text-brand-900 mb-2">Message envoyé !</h3>
                <p className="text-brand-500 max-w-sm">
                  Merci {form.name}. Notre équipe vous répondra à <strong>{form.email}</strong> sous 24h ouvrées.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-brand-700 mb-1.5">Nom complet *</label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full border border-brand-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      placeholder="Jean Dupont"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-700 mb-1.5">Email *</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full border border-brand-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      placeholder="jean@exemple.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-1.5">Sujet *</label>
                  <select
                    required
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    className="w-full border border-brand-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
                  >
                    <option value="">Choisir un sujet…</option>
                    <option>Question sur un produit</option>
                    <option>Suivi de commande</option>
                    <option>Retour / remboursement</option>
                    <option>Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-1.5">Message *</label>
                  <textarea
                    required
                    rows={6}
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    className="w-full border border-brand-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                    placeholder="Décrivez votre demande en détail…"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Envoi en cours…</>
                    : 'Envoyer le message'
                  }
                </button>
                <p className="text-xs text-brand-400 text-center">
                  Vos données ne seront jamais partagées avec des tiers.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
