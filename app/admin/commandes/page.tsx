import Link from 'next/link'
import { ArrowLeft, Receipt, Check, Clock, X, Phone, Mail } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import RefreshButton from '@/components/admin/RefreshButton'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Commandes' }

/**
 * Les commandes passées par le checkout maison.
 *
 * Les paiements réglés chez le prestataire externe n'apparaissent pas ici :
 * il ne nous rend rien. Cette page ne montre que ce qui est encaissé par
 * CAWL, sur les fiches basculées.
 *
 * Trois états. « Payée » vient du serveur CAWL, jamais du navigateur. « En
 * attente » signifie que le client a commencé et n'est pas allé au bout, ou
 * qu'il a fermé sa page entre la banque et nous. « Refusée » est un refus
 * constaté, avec son motif.
 */

type Filtre = 'payees' | 'attente' | 'toutes'

const ONGLETS: { cle: Filtre; label: string }[] = [
  { cle: 'payees', label: 'Payées' },
  { cle: 'attente', label: 'En attente' },
  { cle: 'toutes', label: 'Toutes' },
]

interface Commande {
  id: string
  reference: string
  created_at: string
  statut: 'en_attente' | 'payee' | 'refusee'
  produit_nom: string
  lot: string | null
  montant_cents: number
  prenom: string
  nom: string
  email: string
  telephone: string
  adresse: string
  complement: string | null
  code_postal: string
  ville: string
  pays: string
  paiement_id: string | null
  paiement_statut: string | null
  payee_a: string | null
  erreur: string | null
}

async function getCommandes(filtre: Filtre): Promise<Commande[]> {
  const supabase = createAdminClient()
  let q = supabase.from('commandes').select('*').order('created_at', { ascending: false }).limit(200)
  if (filtre === 'payees') q = q.eq('statut', 'payee')
  if (filtre === 'attente') q = q.neq('statut', 'payee')
  const { data, error } = await q
  if (error || !data) return []
  return data as Commande[]
}

async function compter(): Promise<{ payees: number; total: number; recette: number }> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('commandes').select('statut, montant_cents').limit(5000)
  const lignes = data ?? []
  return {
    payees: lignes.filter((l) => l.statut === 'payee').length,
    total: lignes.length,
    recette: lignes
      .filter((l) => l.statut === 'payee')
      .reduce((s, l) => s + Number(l.montant_cents), 0),
  }
}

function quand(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    timeZone: 'Europe/Paris', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

const ETATS = {
  payee: { libelle: 'Payée', classe: 'bg-brand-100 text-brand-800', icone: Check },
  en_attente: { libelle: 'En attente', classe: 'bg-amber-100 text-amber-800', icone: Clock },
  refusee: { libelle: 'Refusée', classe: 'bg-red-100 text-red-800', icone: X },
} as const

interface Props {
  searchParams: Promise<{ filtre?: string }>
}

export default async function AdminCommandesPage({ searchParams }: Props) {
  const { filtre } = await searchParams
  const actif: Filtre = ONGLETS.some((o) => o.cle === filtre) ? (filtre as Filtre) : 'payees'

  const [commandes, bilan] = await Promise.all([getCommandes(actif), compter()])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/admin/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6">
        <ArrowLeft size={15} /> Retour au tableau de bord
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink flex items-center gap-2.5">
            <Receipt size={24} className="text-brand-600" />
            Commandes
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Payées sur le site par carte. Les commandes réglées chez le prestataire externe
            n’apparaissent pas ici.
          </p>
        </div>
        <RefreshButton label="Actualiser" />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Payées', valeur: String(bilan.payees) },
          { label: 'Encaissé', valeur: formatPrice(bilan.recette / 100) },
          { label: 'Tentatives', valeur: String(bilan.total) },
        ].map((c) => (
          <div key={c.label} className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="font-serif text-2xl font-bold text-ink mt-0.5">{c.valeur}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {ONGLETS.map((o) => (
          <Link
            key={o.cle}
            href={`/admin/commandes/?filtre=${o.cle}`}
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

      {commandes.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
          {actif === 'payees' ? 'Aucune commande payée pour l’instant.' : 'Rien à afficher.'}
        </p>
      ) : (
        <div className="space-y-3">
          {commandes.map((c) => {
            const etat = ETATS[c.statut]
            const Icone = etat.icone
            return (
              <article
                key={c.id}
                className={`rounded-lg border p-4 sm:p-5 ${
                  c.statut === 'payee' ? 'border-brand-200 bg-white' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <div className="min-w-0">
                    <p className="font-mono font-bold text-ink">{c.reference}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {quand(c.created_at)}
                      {c.payee_a && ` · payée à ${quand(c.payee_a)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <span className="text-xl font-bold text-ink">{formatPrice(c.montant_cents / 100)}</span>
                    <span className={`inline-flex items-center gap-1 rounded-md text-xs font-semibold px-2 py-1 ${etat.classe}`}>
                      <Icone size={13} /> {etat.libelle}
                    </span>
                  </div>
                </div>

                <p className="text-[15px] text-gray-700 mt-2.5">
                  {c.produit_nom}
                  {c.lot && <span className="text-gray-500"> · lot {c.lot}</span>}
                </p>

                <div className="mt-3 pt-3 border-t border-gray-100 grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[14px]">
                  <p className="font-semibold text-ink">{c.prenom} {c.nom}</p>
                  <p className="text-gray-600 sm:text-right">
                    {c.adresse}
                    {c.complement && `, ${c.complement}`}
                    {`, ${c.code_postal} ${c.ville} (${c.pays})`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <a
                    href={`mailto:${c.email}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 hover:border-brand-500 text-gray-700 text-sm px-3 py-1.5"
                  >
                    <Mail size={14} /> {c.email}
                  </a>
                  <a
                    href={`tel:${c.telephone.replace(/\s/g, '')}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 hover:border-brand-500 text-gray-700 text-sm px-3 py-1.5"
                  >
                    <Phone size={14} /> {c.telephone}
                  </a>
                </div>

                {/* Le détail technique, utile quand il faut écrire au support CAWL. */}
                {(c.paiement_id || c.erreur) && (
                  <p className="text-[12px] text-gray-400 mt-3 break-all">
                    {c.paiement_id && <>paiement {c.paiement_id}</>}
                    {c.paiement_statut && <> · {c.paiement_statut}</>}
                    {c.erreur && <span className="text-red-600"> · {c.erreur}</span>}
                  </p>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
