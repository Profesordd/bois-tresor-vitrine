'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Phone, Copy, CheckCheck, Check, Undo2, BadgeCheck, MailCheck, MailX, Send } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

export interface Lead {
  id: string
  created_at: string
  email: string
  telephone: string | null
  consent: boolean
  produit_nom: string | null
  produit_slug: string | null
  lot: string | null
  montant: string | number | null
  session_id: string | null
  utm_source: string | null
  utm_campaign: string | null
  pays: string | null
  appareil: string | null
  a_commande: boolean
  desinscrit: boolean
  traite: boolean
  note: string | null
}

export interface Relance {
  etape: number
  envoye_a: string
  erreur: string | null
}

const SUJETS = [
  'commande non aboutie',
  'souci de paiement',
  'qui nous sommes',
  'ce qu’il reste',
  'dernier message',
]

const APPAREIL: Record<string, string> = { mobile: 'téléphone', tablet: 'tablette', desktop: 'ordinateur' }

function quand(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    timeZone: 'Europe/Paris', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

/**
 * Une adresse laissée avant le paiement.
 *
 * L'important est en haut : l'adresse, le téléphone s'il y en a un, et ce
 * que la personne s'apprêtait à payer. Le gérant appelle ou écrit depuis
 * ses propres outils, comme pour les demandes de contact.
 */
export default function LeadCard({ l, relances = [] }: { l: Lead; relances?: Relance[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [copie, setCopie] = useState<'email' | 'tel' | null>(null)
  const [note, setNote] = useState(l.note ?? '')

  async function patch(corps: Record<string, unknown>) {
    await fetch('/api/admin/leads/', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: l.id, ...corps }),
    })
    startTransition(() => router.refresh())
  }

  async function copier(valeur: string, quoi: 'email' | 'tel') {
    try {
      await navigator.clipboard.writeText(valeur)
      setCopie(quoi)
      window.setTimeout(() => setCopie(null), 1800)
    } catch {
      /* presse-papiers indisponible : la valeur reste sélectionnable à la main */
    }
  }

  const montant = l.montant === null ? null : Number(l.montant)

  return (
    <article
      className={`rounded-lg border p-4 sm:p-5 ${
        l.a_commande ? 'border-gray-200 bg-gray-50' : l.traite ? 'border-gray-200 bg-white' : 'border-brand-300 bg-white'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="font-semibold text-ink break-all">{l.email}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {quand(l.created_at)}
            {l.pays && ` · ${l.pays}`}
            {l.appareil && ` · ${APPAREIL[l.appareil] ?? l.appareil}`}
            {l.utm_campaign && ` · ${l.utm_campaign}`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {l.a_commande && (
            <span className="inline-flex items-center gap-1 rounded-md bg-brand-100 text-brand-800 text-xs font-semibold px-2 py-1">
              <BadgeCheck size={13} /> A commandé
            </span>
          )}
          {l.desinscrit && (
            <span className="inline-flex items-center gap-1 rounded-md bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-1">
              <MailX size={13} /> Désinscrit
            </span>
          )}
          {l.consent && (
            <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 text-gray-700 text-xs font-semibold px-2 py-1">
              <MailCheck size={13} /> Accepte les offres
            </span>
          )}
        </div>
      </div>

      {(l.produit_nom || montant !== null) && (
        <p className="text-[15px] text-gray-700 mt-2.5">
          {l.produit_nom}
          {l.lot && ` · lot ${l.lot}`}
          {montant !== null && <strong className="font-semibold text-ink"> — {formatPrice(montant)}</strong>}
        </p>
      )}

      {/* Les relances déjà parties, dans l'ordre. Une étape en échec est
          montrée en rouge avec son motif : sans ça, une adresse invalide
          passerait inaperçue et le client croirait avoir relancé. */}
      {relances.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <Send size={13} className="text-gray-400" />
          {relances.map((r) => (
            <span
              key={r.etape}
              title={`${SUJETS[r.etape - 1] ?? ''} · ${quand(r.envoye_a)}${r.erreur ? ` · ${r.erreur}` : ''}`}
              className={`inline-flex items-center rounded-md text-xs font-semibold px-2 py-0.5 ${
                r.erreur ? 'bg-red-100 text-red-800' : 'bg-brand-50 text-brand-800'
              }`}
            >
              {r.etape}. {SUJETS[r.etape - 1] ?? `étape ${r.etape}`}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-3.5">
        <a
          href={`mailto:${l.email}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-3 py-2"
        >
          <Mail size={15} /> Écrire
        </a>
        <button
          type="button"
          onClick={() => copier(l.email, 'email')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 hover:border-gray-400 text-gray-700 text-sm px-3 py-2"
        >
          {copie === 'email' ? <CheckCheck size={15} className="text-brand-600" /> : <Copy size={15} />}
          {copie === 'email' ? 'Copiée' : 'Copier l’adresse'}
        </button>

        {l.telephone && (
          <>
            <a
              href={`tel:${l.telephone.replace(/\s/g, '')}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 bg-brand-50 hover:border-brand-500 text-brand-800 text-sm font-semibold px-3 py-2"
            >
              <Phone size={15} /> {l.telephone}
            </a>
            <button
              type="button"
              onClick={() => copier(l.telephone!, 'tel')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 hover:border-gray-400 text-gray-700 text-sm px-3 py-2"
            >
              {copie === 'tel' ? <CheckCheck size={15} className="text-brand-600" /> : <Copy size={15} />}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => patch({ traite: !l.traite })}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 hover:border-gray-400 text-gray-700 text-sm px-3 py-2 ml-auto"
        >
          {l.traite ? <><Undo2 size={15} /> À rappeler</> : <><Check size={15} /> Marquer traité</>}
        </button>
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={() => { if (note !== (l.note ?? '')) void patch({ note }) }}
        rows={1}
        placeholder="Note : ce que vous avez fait, ce qu’il a répondu…"
        className="w-full mt-3 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-brand-500 resize-y"
      />

      {l.session_id && (
        <a
          href={`/admin/visiteurs/${l.session_id}/`}
          className="inline-block text-xs text-gray-400 hover:text-brand-700 mt-2"
        >
          Voir son parcours sur le site →
        </a>
      )}
    </article>
  )
}
