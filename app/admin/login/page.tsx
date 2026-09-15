'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Connexion impossible.')
        return
      }
      router.push('/admin/')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-lg border border-gray-200 p-7 shadow-sm">
        <div className="flex items-center gap-2.5 mb-6">
          <Lock size={20} className="text-brand-600" />
          <h1 className="font-serif text-xl font-bold text-ink">Espace administrateur</h1>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />

        {error && <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <button
          type="submit"
          disabled={busy || password.length === 0}
          className="mt-5 w-full bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400 text-white py-3 rounded-lg font-semibold transition-colors"
        >
          {busy ? 'Vérification…' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}
