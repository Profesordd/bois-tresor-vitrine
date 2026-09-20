'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Mail, Clock, MapPin, CheckCircle, Package } from 'lucide-react'

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
      const res = await fetch('/api/contact/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      /* Le serveur explique précisément ce qui a échoué et donne l'adresse
         de repli : on affiche son message plutôt qu'un texte générique. */
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || '')
      }
      setSent(true)
    } catch (err) {
      setError(
        (err instanceof Error && err.message) ||
          'Une erreur est survenue. Réessayez ou écrivez-nous directement à contact@bois-tresor.com.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="bg-brand-800 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 font-serif">On vous répond.</h1>
          <p className="text-brand-100">
            Vous voulez juste suivre votre colis ?{' '}
            <Link href="/suivi-commande" className="underline font-semibold">Suivi de commande →</Link>
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid lg:grid-cols-3 gap-10">

          <div className="space-y-6">
            <h2 className="text-xl font-bold text-ink mb-6">Coordonnées</h2>

            {[
              { icon: Mail,   title: 'E-mail',    val: 'contact@bois-tresor.com', sub: 'Un vrai humain vous répond sous 24h' },
              { icon: Clock,  title: 'Horaires',  val: 'Lun – Ven · 9h – 18h', sub: 'Fermé week-end et jours fériés' },
              { icon: MapPin, title: 'Zone de livraison', val: 'France métropolitaine, Belgique, Suisse et Luxembourg', sub: 'Livraison par transporteur spécialisé' },
            ].map(({ icon: Icon, title, val, sub }) => (
              <div key={title} className="flex gap-4 p-4 bg-brand-50 rounded-lg">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-brand-600" />
                </div>
                <div>
                  <p className="font-semibold text-ink text-sm">{title}</p>
                  <p className="text-gray-700 text-sm">{val}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{sub}</p>
                </div>
              </div>
            ))}

            <div className="p-4 border border-brand-100 rounded-lg">
              <p className="font-semibold text-ink text-sm mb-2 flex items-center gap-2">
                <Package size={15} className="text-brand-600" /> Pour un traitement plus rapide
              </p>
              <ul className="text-sm text-gray-600 space-y-1.5 list-disc pl-4">
                <li>Votre numéro de commande (commence par « BA »)</li>
                <li>L’e-mail utilisé lors de l’achat</li>
                <li>Une photo si le produit est endommagé ou non conforme</li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-ink mb-6">Écrivez-nous</h2>
            {sent ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <CheckCircle size={56} className="text-brand-600 mb-4" />
                <h3 className="text-2xl font-bold text-ink mb-2">Message envoyé !</h3>
                <p className="text-gray-500 max-w-sm">
                  Merci {form.name}. Notre équipe vous répondra à <strong>{form.email}</strong> sous 24h ouvrées.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom *</label>
                    <input
                      required
                      name="nom"
                      type="text"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      placeholder="Jean Dupont"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail *</label>
                    <input
                      required
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      placeholder="jean@exemple.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Sujet</label>
                  <select
                    name="sujet"
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
                  >
                    <option value="">Choisir un sujet…</option>
                    <option>Question sur un produit</option>
                    <option>Suivi de commande</option>
                    <option>Retour / remboursement</option>
                    <option>Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Message *</label>
                  <textarea
                    required
                    name="message"
                    rows={6}
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                    placeholder="Décrivez votre demande en détail…"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Envoi en cours…</>
                    : 'Envoyer le message'
                  }
                </button>
                <p className="text-xs text-gray-400 text-center">
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
