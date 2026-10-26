import { Receipt, Check, Clock, X, Phone, Mail, MapPin } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import RefreshButton from '@/components/admin/RefreshButton'

/**
 * Tableau de bord du canal partenaire.
 *
 * Ne montre QUE les commandes marquées « partenaire ». Les ventes de
 * bois-tresar n'y apparaissent jamais : cet espace a son propre mot de
 * passe, et le filtre `canal` garantit l'étanchéité même si quelqu'un
 * forgeait une requête.
 *
 * Les coordonnées du client sont affichées : c'est le partenaire qui
 * expédie, il lui faut l'adresse, l'e-mail et le téléphone.
 */

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Espace partenaire', robots: { index: false, follow: false } }

type Periode = 'jour' | 'hier' | '7j' | '30j' | 'tout'
const PERIODES: { cle: Periode; label: string }[] = [
  { cle: 'jour', label: "Aujourd'hui" },
  { cle: 'hier', label: 'Hier' },
  { cle: '7j', label: '7 jours' },
  { cle: '30j', label: '30 jours' },
  { cle: 'tout', label: 'Tout' },
]

interface Bornes { debut: string | null; fin: string | null }

function minuitParis(ilYA: number): Date {
  const now = new Date()
  const paris = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
  const ecart = now.getTime() - paris.getTime()
  paris.setHours(0, 0, 0, 0)
  return new Date(paris.getTime() + ecart - ilYA * 86_400_000)
}
function minuitParisDe(dateStr: string): Date {
  const midi = new Date(`${dateStr}T12:00:00Z`)
  const paris = new Date(midi.toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
  const ecart = midi.getTime() - paris.getTime()
  paris.setHours(0, 0, 0, 0)
  return new Date(paris.getTime() + ecart)
}
function bornesPeriode(p: Periode, date: string | null): Bornes {
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const d = minuitParisDe(date)
    return { debut: d.toISOString(), fin: new Date(d.getTime() + 86_400_000).toISOString() }
  }
  if (p === 'tout') return { debut: null, fin: null }
  if (p === 'jour') return { debut: minuitParis(0).toISOString(), fin: null }
  if (p === 'hier') return { debut: minuitParis(1).toISOString(), fin: minuitParis(0).toISOString() }
  return { debut: minuitParis(p === '7j' ? 7 : 30).toISOString(), fin: null }
}

interface Commande {
  id: string; reference: string; created_at: string
  statut: 'en_attente' | 'payee' | 'refusee'
  produit_nom: string; montant_cents: number
  prenom: string; nom: string; email: string; telephone: string
  adresse: string; complement: string | null; code_postal: string; ville: string; pays: string
  payee_a: string | null
}

const ETATS = {
  payee: { libelle: 'Payée', classe: 'bg-brand-100 text-brand-800', icone: Check },
  en_attente: { libelle: 'Abandonnée', classe: 'bg-amber-100 text-amber-800', icone: Clock },
  refusee: { libelle: 'Refusée', classe: 'bg-red-100 text-red-800', icone: X },
} as const

function quand(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    timeZone: 'Europe/Paris', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

/* Pour l'ami, quand il est à zéro. Rien de méchant, juste pour le sourire. */
const PHRASES_ZERO = [
  '0 comme les pirates 🏴‍☠️',
  'Zéro pour l’instant. Le calme avant la thune.',
  'Rien encore. Même les sacs de granulés s’ennuient.',
  '0 vente. La journée est jeune, patron.',
  'Pour l’instant c’est désert. Ça va bientôt sonner à la caisse.',
]

interface Props { searchParams: Promise<{ periode?: string; date?: string }> }

export default async function PartenairePage({ searchParams }: Props) {
  const { periode, date } = await searchParams
  const actif: Periode = PERIODES.some((p) => p.cle === periode) ? (periode as Periode) : 'jour'
  const dateActive = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null
  const b = bornesPeriode(actif, dateActive)

  const supabase = createAdminClient()
  let q = supabase.from('commandes').select('*').eq('canal', 'partenaire')
    .order('created_at', { ascending: false }).limit(300)
  if (b.debut) q = q.gte('created_at', b.debut)
  if (b.fin) q = q.lt('created_at', b.fin)
  const { data } = await q
  const commandes = (data ?? []) as Commande[]

  const payees = commandes.filter((c) => c.statut === 'payee')
  const encaisse = payees.reduce((s, c) => s + c.montant_cents, 0)
  const pourcent = (n: number, t: number) => (t > 0 ? Math.round((n * 1000) / t) / 10 : 0)

  const CHIFFRES = [
    { label: 'Tentatives', valeur: String(commandes.length), aide: 'sur la période' },
    { label: 'Payées', valeur: String(payees.length), aide: `${pourcent(payees.length, commandes.length)} % des tentatives` },
    { label: 'Encaissé', valeur: formatPrice(encaisse / 100), aide: payees.length > 0 ? `${formatPrice(encaisse / 100 / payees.length)} en moyenne` : '—' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink flex items-center gap-2.5">
          <Receipt size={24} className="text-brand-600" /> Mes ventes
        </h1>
        <div className="flex items-center gap-3">
          <RefreshButton label="Actualiser" />
          <a href="/partenaire/deconnexion/" className="text-sm text-gray-500 hover:text-gray-800">Se déconnecter</a>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {PERIODES.map((p) => (
          <a
            key={p.cle}
            href={`/partenaire/?periode=${p.cle}`}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-colors ${
              actif === p.cle && !dateActive ? 'bg-ink border-ink text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
            }`}
          >
            {p.label}
          </a>
        ))}
        <form method="get" action="/partenaire/" className="flex items-center gap-1.5 ml-1">
          <input
            type="date"
            name="date"
            defaultValue={dateActive ?? ''}
            className={`rounded-lg border px-2.5 py-1.5 text-[13px] ${dateActive ? 'border-ink text-ink font-medium' : 'border-gray-200 text-gray-600'}`}
          />
          {dateActive && (
            <a href={`/partenaire/?periode=${actif}`} className="text-[13px] text-gray-400 hover:text-gray-700">effacer</a>
          )}
        </form>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {CHIFFRES.map((c) => (
          <div key={c.label} className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500 leading-tight">{c.label}</p>
            <p className="font-serif text-2xl font-bold text-ink mt-1">{c.valeur}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{c.aide}</p>
          </div>
        ))}
      </div>

      {/* Petit mot pour l'ami, quand le compteur est à zéro. */}
      {payees.length === 0 && (
        <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 mb-6 text-center text-[15px] font-medium text-gray-600">
          {PHRASES_ZERO[Math.floor(Math.random() * PHRASES_ZERO.length)]}
        </p>
      )}

      {commandes.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
          Aucune commande sur cette période.
        </p>
      ) : (
        <div className="space-y-3">
          {commandes.map((c) => {
            const etat = ETATS[c.statut]
            const Icone = etat.icone
            return (
              <article key={c.id} className={`rounded-lg border p-4 sm:p-5 ${c.statut === 'payee' ? 'border-brand-200 bg-white' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <div className="min-w-0">
                    <p className="font-mono font-bold text-ink">{c.reference}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {quand(c.created_at)}{c.payee_a && ` · payée à ${quand(c.payee_a)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <span className="text-xl font-bold text-ink">{formatPrice(c.montant_cents / 100)}</span>
                    <span className={`inline-flex items-center gap-1 rounded-md text-xs font-semibold px-2 py-1 ${etat.classe}`}>
                      <Icone size={13} /> {etat.libelle}
                    </span>
                  </div>
                </div>

                <p className="text-[15px] text-gray-700 mt-2.5">{c.produit_nom}</p>

                {c.statut === 'payee' && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
                    <p className="font-semibold text-ink text-[15px]">{c.prenom} {c.nom}</p>
                    <p className="flex items-start gap-1.5 text-[14px] text-gray-600">
                      <MapPin size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      {c.adresse}{c.complement && `, ${c.complement}`}{`, ${c.code_postal} ${c.ville} (${c.pays})`}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 hover:border-brand-500 text-gray-700 text-sm px-3 py-1.5">
                        <Mail size={14} /> {c.email}
                      </a>
                      <a href={`tel:${c.telephone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 hover:border-brand-500 text-gray-700 text-sm px-3 py-1.5">
                        <Phone size={14} /> {c.telephone}
                      </a>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
