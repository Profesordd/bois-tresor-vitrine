import Link from 'next/link'
import { ArrowLeft, Inbox } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import MessageCard, { type ContactMessage } from '@/components/admin/MessageCard'
import RefreshButton from '@/components/admin/RefreshButton'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Demandes de contact' }

type Filter = 'nouveaux' | 'traites' | 'tous'

async function getMessages(filter: Filter): Promise<ContactMessage[]> {
  const supabase = createAdminClient()
  let q = supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(200)
  if (filter === 'nouveaux') q = q.eq('handled', false)
  if (filter === 'traites') q = q.eq('handled', true)
  const { data, error } = await q
  if (error || !data) return []
  return data as ContactMessage[]
}

const TABS: { key: Filter; label: string }[] = [
  { key: 'nouveaux', label: 'À traiter' },
  { key: 'traites', label: 'Traités' },
  { key: 'tous', label: 'Tous' },
]

interface Props {
  searchParams: Promise<{ filtre?: string }>
}

export default async function AdminMessagesPage({ searchParams }: Props) {
  const { filtre } = await searchParams
  const filter: Filter = TABS.some((t) => t.key === filtre) ? (filtre as Filter) : 'nouveaux'

  const messages = await getMessages(filter)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/admin/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6">
        <ArrowLeft size={15} /> Retour au tableau de bord
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink flex items-center gap-2.5">
            <Inbox size={24} className="text-brand-600" />
            Demandes de contact
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Répondez depuis votre boîte mail : le bouton « Répondre » l’ouvre avec l’adresse déjà remplie.
          </p>
        </div>
        <RefreshButton label="Voir les nouvelles" />
      </div>

      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/messages/?filtre=${t.key}`}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              t.key === filter
                ? 'bg-brand-600 text-white border-brand-600'
                : 'border-gray-200 text-gray-600 hover:border-brand-400 bg-white'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="space-y-4">
        {messages.map((m) => (
          <MessageCard key={m.id} m={m} />
        ))}

        {messages.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <Inbox size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-500">
              {filter === 'nouveaux' ? 'Aucune demande en attente.' : 'Aucune demande dans cette catégorie.'}
            </p>
          </div>
        )}
      </div>

    </div>
  )
}
