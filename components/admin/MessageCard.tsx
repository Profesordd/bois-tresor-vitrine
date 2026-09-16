'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Check, Undo2, Copy, CheckCheck, Ban } from 'lucide-react'

export interface ContactMessage {
  id: string
  created_at: string
  name: string
  email: string
  subject: string | null
  message: string
  handled: boolean
  handled_at: string | null
}

/**
 * Une demande de contact, telle que le gérant la lit avant de répondre
 * depuis sa propre boîte. Le bouton « Répondre » ouvre son logiciel de
 * messagerie avec l'adresse et le sujet déjà remplis.
 */
export default function MessageCard({ m }: { m: ContactMessage }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const [confirmeSpam, setConfirmeSpam] = useState(false)

  /**
   * Marquer comme indésirable supprime le message et bloque l'adresse.
   * L'action demande confirmation : elle est définitive pour ce message, et
   * l'expéditeur ne saura jamais qu'il a été bloqué.
   */
  async function signalerSpam() {
    await fetch('/api/admin/messages/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: m.id }),
    })
    startTransition(() => router.refresh())
  }

  async function toggle() {
    await fetch('/api/admin/messages/', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: m.id, handled: !m.handled }),
    })
    startTransition(() => router.refresh())
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(m.email)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      /* presse-papiers indisponible : l'adresse reste sélectionnable à la main */
    }
  }

  const date = new Date(m.created_at).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const mailto =
    `mailto:${encodeURIComponent(m.email)}` +
    `?subject=${encodeURIComponent(`Re : ${m.subject || 'votre message'} — Bois Tresor`)}`

  return (
    <article
      className={`rounded-lg border p-5 bg-white transition-colors ${
        m.handled ? 'border-gray-200 opacity-70' : 'border-brand-300 shadow-sm'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-ink">{m.name}</h3>
            {!m.handled && (
              <span className="text-[11px] font-bold uppercase tracking-wide bg-brand-600 text-white px-2 py-0.5 rounded-full">
                Nouveau
              </span>
            )}
          </div>
          <button
            onClick={copyEmail}
            title="Copier l’adresse"
            className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-brand-700 hover:underline break-all"
          >
            {m.email}
            {copied ? <CheckCheck size={13} /> : <Copy size={13} className="opacity-50" />}
          </button>
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">{date}</span>
      </div>

      {m.subject && (
        <p className="text-sm text-gray-500 mb-2">
          Sujet : <span className="text-gray-700 font-medium">{m.subject}</span>
        </p>
      )}

      {/* whitespace-pre-line : les retours à la ligne du visiteur sont conservés. */}
      <p className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-line bg-gray-50 rounded-lg p-4">
        {m.message}
      </p>

      <div className="flex flex-wrap items-center gap-2 mt-4">
        <a
          href={mailto}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors"
        >
          <Mail size={15} /> Répondre
        </a>
        <button
          onClick={toggle}
          disabled={pending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:border-brand-400 text-sm font-medium disabled:opacity-60 transition-colors"
        >
          {m.handled ? <><Undo2 size={15} /> Remettre en attente</> : <><Check size={15} /> Marquer comme traité</>}
        </button>
        {m.handled && m.handled_at && (
          <span className="text-xs text-gray-400">
            traité le {new Date(m.handled_at).toLocaleDateString('fr-FR')}
          </span>
        )}

        {!confirmeSpam ? (
          <button
            onClick={() => setConfirmeSpam(true)}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Supprimer et bloquer cette adresse"
          >
            <Ban size={15} /> Indésirable
          </button>
        ) : (
          <span className="ml-auto flex items-center gap-2 text-sm">
            <span className="text-gray-600">Bloquer {m.email} ?</span>
            <button
              onClick={signalerSpam}
              disabled={pending}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-60 transition-colors"
            >
              Oui, bloquer
            </button>
            <button
              onClick={() => setConfirmeSpam(false)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-300 transition-colors"
            >
              Annuler
            </button>
          </span>
        )}
      </div>

      {confirmeSpam && (
        <p className="mt-3 text-xs text-gray-500 leading-snug bg-gray-50 rounded-lg p-3">
          Le message sera supprimé et cette adresse ne pourra plus jamais vous écrire. Elle
          continuera de voir une confirmation d’envoi normale — sans quoi elle réessaierait depuis
          une autre adresse. <strong className="text-gray-700">Cette action est définitive :
          le blocage ne peut pas être annulé.</strong>
        </p>
      )}
    </article>
  )
}
