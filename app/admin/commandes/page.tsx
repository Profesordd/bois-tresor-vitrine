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

type Periode = 'jour' | '7j' | '30j' | 'tout'

const PERIODES: { cle: Periode; label: string }[] = [
  { cle: 'jour', label: "Aujourd'hui" },
  { cle: '7j', label: '7 jours' },
  { cle: '30j', label: '30 jours' },
  { cle: 'tout', label: 'Tout' },
]

/**
 * Debut de la periode, en ISO, ou null pour « tout ».
 *
 * « Aujourd'hui » se compte a l'heure de Paris et non a celle du serveur,
 * qui tourne en UTC : sans cela, entre minuit et deux heures du matin, la
 * journee affichee serait celle de la veille.
 */
function debutPeriode(p: Periode): string | null {
  const maintenant = new Date()
  if (p === 'tout') return null
  if (p !== 'jour') {
    const jours = p === '7j' ? 7 : 30
    return new Date(maintenant.getTime() - jours * 86400000).toISOString()
  }
  const aParis = new Date(maintenant.toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
  const ecart = maintenant.getTime() - aParis.getTime()
  aParis.setHours(0, 0, 0, 0)
  return new Date(aParis.getTime() + ecart).toISOString()
}

/* Les champs du formulaire, dans l'ordre exact ou ils se presentent a
   l'ecran. L'ordre fait tout : c'est lui qui montre a quelle ligne le
   remplissage s'arrete. */
const BLOCS = ['Coordonnées', 'Livraison', 'Carte bancaire'] as const

const CHAMPS: { id: string; label: string; bloc: (typeof BLOCS)[number] }[] = [
  { id: 'prenom', label: 'Prénom', bloc: 'Coordonnées' },
  { id: 'nom', label: 'Nom', bloc: 'Coordonnées' },
  { id: 'email', label: 'E-mail', bloc: 'Coordonnées' },
  { id: 'telephone', label: 'Téléphone', bloc: 'Coordonnées' },
  { id: 'adresse', label: 'Adresse', bloc: 'Livraison' },
  { id: 'complement', label: 'Complément', bloc: 'Livraison' },
  { id: 'cp', label: 'Code postal', bloc: 'Livraison' },
  { id: 'ville', label: 'Ville', bloc: 'Livraison' },
  { id: 'pays', label: 'Pays', bloc: 'Livraison' },
  { id: 'carte', label: 'Numéro de carte', bloc: 'Carte bancaire' },
  { id: 'mois', label: 'Mois', bloc: 'Carte bancaire' },
  { id: 'annee', label: 'Année', bloc: 'Carte bancaire' },
  { id: 'cvv', label: 'Cryptogramme', bloc: 'Carte bancaire' },
  { id: 'titulaire', label: 'Nom sur la carte', bloc: 'Carte bancaire' },
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

async function getCommandes(filtre: Filtre, depuis: string | null): Promise<Commande[]> {
  const supabase = createAdminClient()
  /* Uniquement les ventes de bois-tresor. Les commandes du canal
     partenaire ont leur propre tableau de bord, dans /partenaire/, et ne
     doivent jamais apparaître ici. */
  let q = supabase.from('commandes').select('*').eq('canal', 'site')
    .order('created_at', { ascending: false }).limit(300)
  if (depuis) q = q.gte('created_at', depuis)
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
async function arriveesCheckout(depuis: string | null): Promise<number> {
  const supabase = createAdminClient()
  let q = supabase
    .from('analytics_events')
    .select('session_id')
    .eq('type', 'pageview')
    .like('path', '/commande/%')
    .not('path', 'like', '/commande/partenaire%')
    .limit(5000)
  if (depuis) q = q.gte('occurred_at', depuis)
  const { data, error } = await q
  if (error || !data) return 0
  return new Set(data.map((e) => e.session_id as string)).size
}

/**
 * Combien de visiteurs distincts ont rempli chaque champ du formulaire.
 *
 * La mesure d'audience note, quand un champ perd le curseur, s'il a ete
 * rempli ou laisse vide. Jamais son contenu. En recoupant par visite, on
 * voit la ligne exacte ou le remplissage s'interrompt : c'est la seule
 * facon de savoir si les gens butent sur la carte bancaire.
 */
async function champsRemplis(depuis: string | null): Promise<Map<string, number>> {
  const supabase = createAdminClient()
  let q = supabase
    .from('analytics_events')
    .select('session_id, label, meta')
    .eq('type', 'form_field')
    .like('path', '/commande/%')
    .not('path', 'like', '/commande/partenaire%')
    .limit(5000)
  if (depuis) q = q.gte('occurred_at', depuis)
  const { data, error } = await q
  if (error || !data) return new Map()

  const sessions = new Map<string, Set<string>>()
  for (const e of data) {
    const meta = e.meta as { filled?: boolean } | null
    if (!meta?.filled) continue
    const champ = e.label as string
    if (!sessions.has(champ)) sessions.set(champ, new Set())
    sessions.get(champ)!.add(e.session_id as string)
  }
  const total = new Map<string, number>()
  sessions.forEach((vus, champ) => total.set(champ, vus.size))
  return total
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
  searchParams: Promise<{ filtre?: string; periode?: string }>
}

export default async function AdminCheckoutPage({ searchParams }: Props) {
  const { filtre, periode } = await searchParams
  const actif: Filtre = ONGLETS.some((o) => o.cle === filtre) ? (filtre as Filtre) : 'toutes'
  const periodeActive: Periode = PERIODES.some((p) => p.cle === periode) ? (periode as Periode) : 'tout'
  const depuis = debutPeriode(periodeActive)

  const [commandes, arrivees, toutes, remplis] = await Promise.all([
    getCommandes(actif, depuis),
    arriveesCheckout(depuis),
    getCommandes('toutes', depuis),
    champsRemplis(depuis),
  ])

  const payees = toutes.filter((c) => c.statut === 'payee')
  const refusees = toutes.filter((c) => c.statut === 'refusee')
  const abandonnees = toutes.filter((c) => c.statut === 'en_attente')
  const encaisse = payees.reduce((s, c) => s + c.montant_cents, 0)
  const pourcent = (n: number, total: number) => (total > 0 ? Math.round((n * 1000) / total) / 10 : 0)

  /* Une adresse vaut une personne : deux tentatives du même client ne
     font pas deux contacts à rappeler. */
  const emails = new Set(toutes.map((c) => c.email.trim().toLowerCase())).size

  const champs = CHAMPS.map((c) => ({ ...c, n: remplis.get(c.id) ?? 0 }))
  const maxChamp = Math.max(1, ...champs.map((c) => c.n))
  const ontCommence = Math.max(0, ...champs.filter((c) => c.bloc !== 'Carte bancaire').map((c) => c.n))
  const ontTouchCarte = Math.max(0, ...champs.filter((c) => c.bloc === 'Carte bancaire').map((c) => c.n))

  const CHIFFRES = [
    { label: 'Arrivés sur le checkout', valeur: String(arrivees), aide: 'visites distinctes' },
    { label: 'Ont tenté de payer', valeur: String(toutes.length), aide: `${pourcent(toutes.length, arrivees)} % des arrivées` },
    { label: 'Payées', valeur: String(payees.length), aide: `${pourcent(payees.length, toutes.length)} % des tentatives` },
    { label: 'Encaissé', valeur: formatPrice(encaisse / 100), aide: payees.length > 0 ? `${formatPrice(encaisse / 100 / payees.length)} en moyenne` : '—' },
    { label: 'E-mails récupérés', valeur: String(emails), aide: 'ceux qui ont cliqué sur Payer' },
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

      {/* La période commande tout ce qui suit : chiffres, entonnoir,
          remplissage et liste. */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {PERIODES.map((p) => (
          <Link
            key={p.cle}
            href={`/admin/commandes/?periode=${p.cle}&filtre=${actif}`}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-colors ${
              periodeActive === p.cle
                ? 'bg-ink border-ink text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
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

      <section className="rounded-lg border border-gray-200 bg-white p-5 mb-6">
        <h2 className="font-semibold text-ink">Jusqu’où ils remplissent</h2>
        <p className="text-[13px] text-gray-500 mt-1 mb-4">
          Visiteurs distincts ayant rempli chaque champ, dans l’ordre de la page. Le
          contenu des champs n’est jamais enregistré, seulement le fait qu’ils aient
          été remplis.
        </p>

        {ontCommence === 0 ? (
          <p className="text-sm text-gray-500">Personne n’a touché au formulaire sur cette période.</p>
        ) : (
          <>
            <div className="space-y-4">
              {BLOCS.map((bloc) => (
                <div key={bloc}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">{bloc}</p>
                  <div className="space-y-1.5">
                    {champs.filter((c) => c.bloc === bloc).map((c) => (
                      <div key={c.id} className="flex items-center gap-3">
                        <span className="text-[13px] text-gray-700 w-28 sm:w-36 flex-shrink-0">{c.label}</span>
                        <div className="h-2 bg-gray-100 rounded-full flex-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${bloc === 'Carte bancaire' ? 'bg-amber-500' : 'bg-brand-500'}`}
                            style={{ width: `${Math.round((c.n * 100) / maxChamp)}%` }}
                          />
                        </div>
                        <span className="text-[13px] font-semibold text-ink w-7 text-right">{c.n}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[13px] text-gray-600 mt-4 pt-3 border-t border-gray-100">
              <strong className="text-ink">{ontCommence}</strong> ont commencé à remplir leurs
              informations, <strong className="text-ink">{ontTouchCarte}</strong> sont allés jusqu’à la
              carte bancaire.
              {ontCommence - ontTouchCarte > 0 && (
                <>
                  {' '}Soit <strong className="text-amber-700">{ontCommence - ontTouchCarte}</strong> personne
                  {ontCommence - ontTouchCarte > 1 ? 's' : ''} qui s’arrête
                  {ontCommence - ontTouchCarte > 1 ? 'nt' : ''} avant de sortir leur carte.
                </>
              )}
            </p>
          </>
        )}
      </section>

      <div className="flex gap-2 mb-5 flex-wrap">
        {ONGLETS.map((o) => (
          <Link
            key={o.cle}
            href={`/admin/commandes/?filtre=${o.cle}&periode=${periodeActive}`}
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
