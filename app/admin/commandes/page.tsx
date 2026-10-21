import Link from 'next/link'
import { ArrowLeft, Receipt, Check, Clock, X, Phone, Mail, MapPin } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import RefreshButton from '@/components/admin/RefreshButton'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Checkout' }

/**
 * Tableau de bord du checkout maison.
 *
 * Ne montre que ce qui passe par notre page de paiement : les commandes
 * réglées chez le prestataire externe n'apparaissent pas, il ne nous rend
 * rien.
 *
 * L'entonnoir croise deux sources. Les arrivées viennent de la mesure
 * d'audience, qui compte les visites distinctes sur `/commande/` ; les
 * tentatives et les paiements viennent de la table des commandes. Un
 * visiteur qui arrive et repart sans rien remplir n'existe donc que dans
 * la première, et c'est précisément ce qu'on veut voir.
 *
 * « Payée » vient toujours du serveur CAWL, jamais du navigateur.
 */

type Filtre = 'toutes' | 'payees' | 'echouees'

const ONGLETS: { cle: Filtre; label: string }[] = [
  { cle: 'toutes', label: 'Toutes' },
  { cle: 'payees', label: 'Payées' },
  { cle: 'echouees', label: 'Non abouties' },
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
  let q = supabase.from('commandes').select('*').order('created_at', { ascending: false }).limit(300)
  if (filtre === 'payees') q = q.eq('statut', 'payee')
  if (filtre === 'echouees') q = q.neq('statut', 'payee')
  const { data, error } = await q
  if (error || !data) return []
  return data as Commande[]
}

/**
 * Visites distinctes arrivées sur le checkout.
 *
 * Le dédoublonnage se fait ici plutôt qu'en base : la table n'a pas de vue
 * dédiée, et le volume reste très inférieur à la limite de lecture.
 */
async function arriveesCheckout(): Promise<number> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('analytics_events')
    .select('session_id')
    .eq('type', 'pageview')
    .like('path', '/commande/%')
    .limit(5000)
  if (error || !data) return 0
  return new Set(data.map((e) => e.session_id as string)).size
}

function quand(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    timeZone: 'Europe/Paris', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

const ETATS = {
  payee: { libelle: 'Payée', classe: 'bg-brand-100 text-brand-800', icone: Check },
  en_attente: { libelle: 'Abandonnée', classe: 'bg-amber-100 text-amber-800', icone: Clock },
  refusee: { libelle: 'Refusée', classe: 'bg-red-100 text-red-800', icone: X },
} as const

interface Props {
  searchParams: Promise<{ filtre?: string }>
}

export default async function AdminCheckoutPage({ searchParams }: Props) {
  const { filtre } = await searchParams
  const actif: Filtre = ONGLETS.some((o) => o.cle === filtre) ? (filtre as Filtre) : 'toutes'

  const [commandes, arrivees, toutes] = await Promise.all([
    getCommandes(actif),
    arriveesCheckout(),
    getCommandes('toutes'),
  ])

  const payees = toutes.filter((c) => c.statut === 'payee')
  const refusees = toutes.filter((c) => c.statut === 'refusee')
  const abandonnees = toutes.filter((c) => c.statut === 'en_attente')
  const encaisse = payees.reduce((s, c) => s + c.montant_cents, 0)
  const pourcent = (n: number, total: number) => (total > 0 ? Math.round((n * 1000) / total) / 10 : 0)

  const CHIFFRES = [
    { label: 'Arrivés sur le checkout', valeur: String(arrivees), aide: 'visites distinctes' },
    { label: 'Ont tenté de payer', valeur: String(toutes.length), aide: `${pourcent(toutes.length, arrivees)} % des arrivées` },
    { label: 'Payées', valeur: String(payees.length), aide: `${pourcent(payees.length, toutes.length)} % des tentatives` },
    { label: 'Encaissé', valeur: formatPrice(encaisse / 100), aide: payees.length > 0 ? `${formatPrice(encaisse / 100 / payees.length)} en moyenne` : '—' },
  ]

  /* L'entonnoir, du plus large au plus étroit. La barre est relative aux
     arrivées : c'est la chute entre deux marches qui informe. */
  const ETAPES = [
    { libelle: 'Arrivés sur le checkout', n: arrivees },
    { libelle: 'Ont rempli et tenté de payer', n: toutes.length },
    { libelle: 'Paiement accepté', n: payees.length },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/admin/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6">
        <ArrowLeft size={15} /> Retour au tableau de bord
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink flex items-center gap-2.5">
            <Receipt size={24} className="text-brand-600" />
            Checkout
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Le paiement par carte sur le site. Les commandes réglées chez le prestataire
            externe n’apparaissent pas ici.
          </p>
        </div>
        <RefreshButton label="Actualiser" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {CHIFFRES.map((c) => (
          <div key={c.label} className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500 leading-tight">{c.label}</p>
            <p className="font-serif text-2xl font-bold text-ink mt-1">{c.valeur}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{c.aide}</p>
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-5 mb-6">
        <h2 className="font-semibold text-ink mb-4">Où ils s’arrêtent</h2>
        <div className="space-y-3">
          {ETAPES.map((e, i) => {
            const largeur = arrivees > 0 ? Math.max(4, Math.round((e.n * 100) / arrivees)) : 0
            const perdus = i > 0 ? ETAPES[i - 1].n - e.n : 0
            return (
              <div key={e.libelle}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-gray-700">{e.libelle}</span>
                  <span className="font-semibold text-ink whitespace-nowrap">
                    {e.n}
                    {i > 0 && arrivees > 0 && (
                      <span className="font-normal text-gray-400"> · {pourcent(e.n, arrivees)} %</span>
                    )}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: `${largeur}%` }} />
                </div>
                {perdus > 0 && (
                  <p className="text-[12px] text-amber-700 mt-1">
                    {perdus} personne{perdus > 1 ? 's' : ''} perdue{perdus > 1 ? 's' : ''} à cette marche
                  </p>
                )}
              </div>
            )
          })}
        </div>
        {refusees.length > 0 && (
          <p className="text-[13px] text-gray-500 mt-4 pt-3 border-t border-gray-100">
            Sur les non abouties : <strong className="text-ink">{refusees.length}</strong> refusée
            {refusees.length > 1 ? 's' : ''} par la banque, <strong className="text-ink">{abandonnees.length}</strong> abandonnée
            {abandonnees.length > 1 ? 's' : ''} en cours de paiement.
          </p>
        )}
      </section>

      <div className="flex gap-2 mb-5 flex-wrap">
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
          Personne n’a encore rempli le formulaire de paiement.
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

                <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
                  <p className="font-semibold text-ink text-[15px]">{c.prenom} {c.nom}</p>
                  <p className="flex items-start gap-1.5 text-[14px] text-gray-600">
                    <MapPin size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
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
                  {c.statut !== 'payee' && (
                    <span className="text-[13px] text-amber-700 ml-auto">
                      À rappeler, le paiement n’a pas abouti
                    </span>
                  )}
                </div>

                {/* Le détail technique, à donner au support CAWL si besoin. */}
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
