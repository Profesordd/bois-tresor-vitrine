import Link from 'next/link'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import LeadCard, { type Lead } from '@/components/admin/LeadCard'
import RefreshButton from '@/components/admin/RefreshButton'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Adresses à rappeler' }

type Filtre = 'a-rappeler' | 'commandes' | 'tous'

const ONGLETS: { cle: Filtre; label: string }[] = [
  { cle: 'a-rappeler', label: 'À rappeler' },
  { cle: 'commandes', label: 'Ont commandé' },
  { cle: 'tous', label: 'Tous' },
]

async function getLeads(filtre: Filtre): Promise<Lead[]> {
  const supabase = createAdminClient()
  let q = supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(300)
  /* « À rappeler » : ceux qui n'ont pas payé et que le gérant n'a pas
     encore traités. C'est la seule liste sur laquelle il y a quelque chose
     à faire, elle est donc ouverte par défaut. */
  if (filtre === 'a-rappeler') q = q.eq('a_commande', false).eq('traite', false)
  if (filtre === 'commandes') q = q.eq('a_commande', true)
  const { data, error } = await q
  if (error || !data) return []
  return data as Lead[]
}

interface Props {
  searchParams: Promise<{ filtre?: string }>
}

export default async function AdminLeadsPage({ searchParams }: Props) {
  const { filtre } = await searchParams
  const actif: Filtre = ONGLETS.some((o) => o.cle === filtre) ? (filtre as Filtre) : 'a-rappeler'

  const leads = await getLeads(actif)
  const avecTelephone = leads.filter((l) => l.telephone).length

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/admin/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6">
        <ArrowLeft size={15} /> Retour au tableau de bord
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink flex items-center gap-2.5">
            <UserPlus size={24} className="text-brand-600" />
            Adresses à rappeler
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Adresses laissées au moment de passer au paiement. Celles qui n’ont pas abouti à
            une commande sont des clients à relancer.
          </p>
        </div>
        <RefreshButton label="Voir les nouvelles" />
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {ONGLETS.map((o) => (
          <Link
            key={o.cle}
            href={`/admin/leads/?filtre=${o.cle}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              actif === o.cle
                ? 'bg-brand-600 border-brand-600 text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:border-brand-400'
            }`}
          >
            {o.label}
          </Link>
        ))}
      </div>

      {leads.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
          {actif === 'a-rappeler'
            ? 'Aucune adresse en attente.'
            : actif === 'commandes'
              ? 'Aucune de ces adresses n’a encore commandé.'
              : 'Aucune adresse enregistrée pour l’instant.'}
        </p>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-3">
            {leads.length} adresse{leads.length > 1 ? 's' : ''}
            {avecTelephone > 0 && `, dont ${avecTelephone} avec un téléphone`}.
          </p>
          <div className="space-y-3">
            {leads.map((l) => <LeadCard key={l.id} l={l} />)}
          </div>
        </>
      )}
    </div>
  )
}
