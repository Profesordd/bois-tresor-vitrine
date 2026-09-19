import Link from 'next/link'
import { Users, Clock, FileText, LogOut, TrendingDown, MousePointerClick, AlertTriangle, Inbox, Package, Globe, Download, FileDown, PackageX } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { NOM_PAYS } from '@/lib/analytics/geo'
import {
  getOverview,
  getRecentSessions,
  getFunnelByDevice,
  getProductPerformance,
  formatDuration,
  aujourdhui,
  decalerJours,
  formatDate,
  dateValide,
} from '@/lib/analytics/queries'
import { createAdminClient } from '@/lib/supabase/server'
import RefreshButton from '@/components/admin/RefreshButton'
import PeriodePicker from '@/components/admin/PeriodePicker'
import StockToggle from '@/components/admin/StockToggle'
import { PRODUCTS } from '@/lib/products'
import { estDernierExemplaire } from '@/lib/stock'

/** Nombre de demandes de contact encore sans réponse. */
async function countPendingMessages(): Promise<number> {
  const supabase = createAdminClient()
  const { count, error } = await supabase
    .from('contact_messages')
    .select('id', { count: 'exact', head: true })
    .eq('handled', false)
  return error ? 0 : (count ?? 0)
}

/** Produits épuisés, lus sans cache : l'admin doit voir l'état exact. */
async function getRupturesAdmin(): Promise<Map<string, string>> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('stock_epuise').select('slug, source')
  if (error) return new Map()
  return new Map((data ?? []).map((r) => [r.slug as string, r.source as string]))
}

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Tableau de bord' }

const JEUX_EXPORT = [
  { cle: 'visites',   label: 'Visites' },
  { cle: 'parcours',  label: 'Parcours détaillé' },
  { cle: 'produits',  label: 'Produits' },
  { cle: 'appareils', label: 'Appareils' },
  { cle: 'pages',     label: 'Pages' },
  { cle: 'contacts',  label: 'Demandes de contact' },
]

function Card({ icon: Icon, label, value, hint }: {
  icon: typeof Users; label: string; value: string; hint?: string
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
        <Icon size={16} className="text-brand-600" />
        {label}
      </div>
      <p className="font-serif text-3xl font-bold text-ink">{value}</p>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

/** Barre de proportion, pour lire un classement d'un coup d'œil. */
function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
    </div>
  )
}

interface Props {
  searchParams: Promise<{ du?: string; au?: string }>
}

export default async function AdminDashboard({ searchParams }: Props) {
  const params = await searchParams

  /* Les journées s'entendent en heure française : « le 15 septembre » va de
     minuit à minuit à Paris, et non en temps universel. */
  const today = aujourdhui()
  const du = dateValide(params.du) ? params.du : decalerJours(today, -6)
  const au = dateValide(params.au) ? params.au : today

  const raccourcis = [
    { label: "Aujourd'hui", du: today, au: today },
    { label: 'Hier', du: decalerJours(today, -1), au: decalerJours(today, -1) },
    { label: '7 jours', du: decalerJours(today, -6), au: today },
    { label: '30 jours', du: decalerJours(today, -29), au: today },
    { label: '90 jours', du: decalerJours(today, -89), au: today },
  ]

  const [overview, sessions, pendingMessages, byDevice, products, ruptures] = await Promise.all([
    getOverview(du, au),
    getRecentSessions(du, au, 200),
    countPendingMessages(),
    getFunnelByDevice(du, au),
    getProductPerformance(du, au),
    getRupturesAdmin(),
  ])

  /* Stock : en tête, ce qui demande l'œil — produits à l'unité et
     ruptures en cours ; le reste du catalogue replié. */
  const stockSurveille = PRODUCTS.filter((p) => estDernierExemplaire(p) || ruptures.has(p.slug))
  const stockAutres    = PRODUCTS.filter((p) => !stockSurveille.includes(p))
  const r = overview?.resume

  if (!overview || !r) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h1 className="font-serif text-2xl font-bold text-ink mb-3">Tableau de bord</h1>
        <p className="flex items-center gap-2 text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <AlertTriangle size={18} />
          Les statistiques ne sont pas accessibles. Vérifiez la connexion à la base de données.
        </p>
      </div>
    )
  }

  const visites = r.visites
  const pct = (n: number) => (visites > 0 ? Math.round((n / visites) * 100) : 0)
  const tauxUnePage = pct(r.visites_une_page)
  const maxVues = Math.max(1, ...overview.pages.map((p) => p.vues))
  const maxClics = Math.max(1, ...overview.clics.map((c) => c.total))

  /* L'entonnoir s'arrête au départ vers le paiement : la suite se passe sur
     le checkout externe, hors de portée de ce site. */
  const funnel = [
    { label: 'Visites', value: visites },
    { label: 'A vu une collection', value: r.etape_collection },
    { label: 'A ouvert une fiche produit', value: r.etape_produit },
    { label: 'A mis au panier (départ vers le paiement)', value: r.etape_achat },
  ]

  /* Écart de conversion entre appareils : au-delà d'un facteur 2, c'est un
     défaut d'affichage, pas une préférence des visiteurs. */
  const taux = (d: { clicked_buy: number; visites: number }) =>
    d.visites > 0 ? (d.clicked_buy / d.visites) * 100 : 0
  const comparables = byDevice.filter((d) => d.visites >= 20 && d.device !== 'inconnu')
  const meilleur = comparables.length > 1 ? Math.max(...comparables.map(taux)) : 0
  const pire = comparables.length > 1 ? Math.min(...comparables.map(taux)) : 0
  const ecartSuspect = comparables.length > 1 && meilleur > 0 && pire < meilleur / 2

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">Tableau de bord</h1>
          <p className="text-gray-500 text-sm mt-1">
            {du === au
              ? `Journée du ${formatDate(du)}`
              : `Du ${formatDate(du)} au ${formatDate(au)}`}
            <span className="text-gray-400"> · heure française</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RefreshButton />
          <Link
            href="/admin/deconnexion/"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
          >
            <LogOut size={15} /> Quitter
          </Link>
        </div>
      </div>

      <PeriodePicker du={du} au={au} max={today} raccourcis={raccourcis} />

      {/* ── Récupérer les données ── */}
      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="flex items-center gap-2 font-semibold text-ink mb-1">
          <Download size={17} className="text-brand-600" />
          Récupérer les données de cette période
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Ces fichiers ne contiennent que la France, la Belgique, la Suisse, le Luxembourg et
          Monaco — les robots et le trafic hors zone en sont absents.
        </p>

        {/* Document unique, mis en avant : c'est l'usage principal. */}
        <a
          href={`/api/admin/export/?jeu=rapport&du=${du}&au=${au}`}
          className="flex items-center justify-between gap-4 rounded-lg border-2 border-brand-300 bg-brand-50 p-4 hover:border-brand-500 transition-colors mb-4"
        >
          <span className="flex items-center gap-3">
            <FileDown size={22} className="text-brand-600 flex-shrink-0" />
            <span>
              <span className="block font-semibold text-ink">Rapport complet — un seul fichier</span>
              <span className="block text-sm text-gray-600">
                Visites, parcours, produits, appareils et pages réunis, avec le contexte du site.
                Conçu pour être donné tel quel à une IA d’analyse.
              </span>
            </span>
          </span>
          <span className="text-brand-700 font-semibold text-sm whitespace-nowrap">Télécharger →</span>
        </a>

        <p className="text-xs text-gray-400 mb-2">Ou par jeu de données, au format Excel :</p>
        <div className="flex flex-wrap gap-2">
          {JEUX_EXPORT.map((j) => (
            <a
              key={j.cle}
              href={`/api/admin/export/?jeu=${j.cle}&du=${du}&au=${au}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-brand-400 hover:text-brand-700 transition-colors"
            >
              <Download size={14} />
              {j.label}
            </a>
          ))}
        </div>
      </section>

      {/* ── Évolution jour par jour ── */}
      {overview.jours.length > 1 && (
        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-4">Jour par jour</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Journée</th>
                  <th className="px-4 py-3 font-medium text-right">Visites</th>
                  <th className="px-4 py-3 font-medium text-right">Mises au panier</th>
                  <th className="px-4 py-3 font-medium text-right">Taux</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {overview.jours.map((j) => {
                  const jour = String(j.jour).slice(0, 10)
                  const t = j.visites > 0 ? Math.round((j.achats * 1000) / j.visites) / 10 : 0
                  return (
                    <tr key={jour} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-800">{formatDate(jour)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-ink">{j.visites}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{j.achats}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{t} %</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/?du=${jour}&au=${jour}`} className="text-brand-700 hover:underline whitespace-nowrap">
                          Voir ce jour →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Demandes de contact : mis en tête, c'est ce qui appelle une
             action immédiate, au contraire des statistiques. ── */}
      <Link
        href="/admin/messages/"
        className={`flex items-center justify-between gap-4 rounded-lg border p-5 transition-colors ${
          pendingMessages > 0
            ? 'border-brand-300 bg-brand-50 hover:border-brand-500'
            : 'border-gray-200 bg-white hover:border-brand-400'
        }`}
      >
        <span className="flex items-center gap-3">
          <Inbox size={22} className="text-brand-600 flex-shrink-0" />
          <span>
            <span className="block font-semibold text-ink">
              {pendingMessages > 0
                ? `${pendingMessages} demande${pendingMessages > 1 ? 's' : ''} de contact à traiter`
                : 'Demandes de contact'}
            </span>
            <span className="block text-sm text-gray-500">
              {pendingMessages > 0
                ? 'Un client attend une réponse de votre part.'
                : 'Aucune demande en attente.'}
            </span>
          </span>
        </span>
        <span className="text-brand-700 font-semibold text-sm whitespace-nowrap">Ouvrir →</span>
      </Link>

      {/* ── Stock ── */}
      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-1">
          <PackageX size={18} className="text-brand-600" />
          <h2 className="font-semibold text-ink">Stock</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Un produit marqué en rupture disparaît de la vente immédiatement, sans mise en ligne.
          Les produits vendus à l’unité passent en rupture tout seuls dès qu’une commande payée les contient.
        </p>

        {stockSurveille.length > 0 && (
          <ul className="divide-y divide-gray-100 mb-3">
            {stockSurveille.map((p) => {
              const epuise = ruptures.has(p.slug)
              return (
                <li key={p.slug} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">
                      {epuise
                        ? `Rupture de stock${ruptures.get(p.slug) === 'shopify' ? ' — vendu (commande Shopify)' : ' — marqué à la main'}`
                        : estDernierExemplaire(p) ? 'Dernier exemplaire en stock, 1 max par commande' : 'En vente'}
                    </p>
                  </div>
                  <StockToggle slug={p.slug} epuise={epuise} />
                </li>
              )
            })}
          </ul>
        )}

        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-brand-700 hover:text-brand-800 select-none">
            Tous les autres produits ({stockAutres.length})
          </summary>
          <ul className="divide-y divide-gray-100 mt-2">
            {stockAutres.map((p) => (
              <li key={p.slug} className="flex items-center justify-between gap-4 py-2.5">
                <p className="text-sm text-gray-700 truncate min-w-0">{p.name}</p>
                <StockToggle slug={p.slug} epuise={false} />
              </li>
            ))}
          </ul>
        </details>
      </section>

      {/* ── Vue d'ensemble ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card icon={Users} label="Visites" value={String(visites)} />
        <Card icon={Clock} label="Durée moyenne" value={formatDuration(r.duree_moyenne_s * 1000)} />
        <Card icon={FileText} label="Pages par visite" value={String(r.pages_par_visite)} />
        <Card
          icon={TrendingDown}
          label="Visites d'une seule page"
          value={`${tauxUnePage} %`}
          hint={`${r.visites_une_page} visite${r.visites_une_page > 1 ? 's' : ''} sans clic`}
        />
      </div>

      {/* ── Périmètre de mesure ── */}
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500 -mt-4">
        <Globe size={15} className="text-gray-400" />
        Chiffres limités à la France, la Belgique, la Suisse, le Luxembourg et Monaco.
        {r.hors_zone > 0 && (
          <span className="text-gray-600">
            <strong>{r.hors_zone}</strong> visite{r.hors_zone > 1 ? 's' : ''} hors zone écartée
            {r.hors_zone > 1 ? 's' : ''}, robots exclus à la source.
          </span>
        )}
        {overview.pays.length > 0 && (
          <span className="text-gray-400">
            ({overview.pays.map((p) => `${NOM_PAYS[p.code] ?? p.code} ${p.visites}`).join(' · ')})
          </span>
        )}
      </p>

      {/* ── Entonnoir ── */}
      <section>
        <h2 className="font-serif text-xl font-bold text-ink mb-1">Entonnoir</h2>
        <p className="text-sm text-gray-500 mb-4">
          S’arrête au départ vers le paiement : la suite se déroule sur le checkout externe.
        </p>
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {funnel.map((step, i) => {
            const previous = i === 0 ? step.value : funnel[i - 1].value
            const drop = previous > 0 ? Math.round(((previous - step.value) / previous) * 100) : 0
            return (
              <div key={step.label} className="p-4">
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <span className="text-sm font-medium text-gray-700">{step.label}</span>
                  <span className="text-sm text-gray-500">
                    <strong className="text-ink text-base">{step.value}</strong>
                    {visites > 0 && <span className="ml-2">{pct(step.value)} %</span>}
                  </span>
                </div>
                <Bar value={step.value} max={visites} />
                {i > 0 && drop > 0 && (
                  <p className="text-xs text-red-600 mt-1.5">− {drop} % par rapport à l’étape précédente</p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Entonnoir par appareil ── */}
      <section>
        <h2 className="font-serif text-xl font-bold text-ink mb-1">Entonnoir par appareil</h2>
        <p className="text-sm text-gray-500 mb-4">
          Un appareil qui convertit deux fois moins que l’autre signale un défaut d’affichage, pas
          une préférence des visiteurs.
        </p>

        {ecartSuspect && (
          <p className="flex items-start gap-2.5 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5 text-amber-600" />
            <span>
              Écart important entre appareils : {pire.toFixed(1)} % contre {meilleur.toFixed(1)} %.
              Testez le parcours d’achat sur l’appareil le moins performant, un élément y est
              probablement inutilisable.
            </span>
          </p>
        )}

        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Appareil</th>
                <th className="px-4 py-3 font-medium text-right">Visites</th>
                <th className="px-4 py-3 font-medium text-right">Collection</th>
                <th className="px-4 py-3 font-medium text-right">Fiche produit</th>
                <th className="px-4 py-3 font-medium text-right">Mise au panier</th>
                <th className="px-4 py-3 font-medium text-right">Taux</th>
                <th className="px-4 py-3 font-medium text-right">Temps moyen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {byDevice.map((d) => {
                const t = taux(d)
                const faible = comparables.length > 1 && d.visites >= 20 && t < meilleur / 2
                return (
                  <tr key={d.device}>
                    <td className="px-4 py-3 font-medium text-ink capitalize">{d.device}</td>
                    <td className="px-4 py-3 text-right">{d.visites}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{d.saw_collection}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{d.saw_product}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{d.clicked_buy}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${faible ? 'text-red-600' : 'text-ink'}`}>
                      {t.toFixed(1)} %
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap">
                      {formatDuration(d.duree_moyenne_s * 1000)}
                    </td>
                  </tr>
                )
              })}
              {byDevice.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Aucune donnée sur la période.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {comparables.length <= 1 && byDevice.length > 0 && (
          <p className="text-xs text-gray-400 mt-2">
            La comparaison ne s’affiche qu’à partir de 20 visites par appareil : en dessous, l’écart
            ne veut rien dire.
          </p>
        )}
      </section>

      {/* ── Conversion par produit ── */}
      <section>
        <h2 className="font-serif text-xl font-bold text-ink mb-1 flex items-center gap-2">
          <Package size={18} className="text-brand-600" /> Quels produits donnent envie
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Le classement à regarder pour choisir quels produits pousser en publicité.
        </p>
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Produit</th>
                <th className="px-4 py-3 font-medium text-right">Fiches vues</th>
                <th className="px-4 py-3 font-medium text-right">Mises au panier</th>
                <th className="px-4 py-3 font-medium text-right">Depuis la fiche</th>
                <th className="px-4 py-3 font-medium text-right">Depuis une carte</th>
                <th className="px-4 py-3 font-medium text-right">Taux fiche</th>
                <th className="px-4 py-3 font-medium text-right">Valeur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.slug}>
                  <td className="px-4 py-3 max-w-[260px]">
                    <span className="text-gray-800 line-clamp-2">{p.name}</span>
                  </td>
                  <td className="px-4 py-3 text-right">{p.vues}</td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">{p.achats}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{p.achats_fiche}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{p.achats_carte}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${p.taux >= 5 ? 'text-brand-700' : 'text-gray-600'}`}>
                    {p.vues > 0 ? `${p.taux} %` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap">
                    {p.valeur_totale > 0 ? formatPrice(Number(p.valeur_totale)) : '—'}
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Aucune fiche produit consultée sur la période.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Le taux ne compare que ce qui est comparable : parmi les visiteurs ayant ouvert la fiche,
          la part qui a ensuite mis au panier. Les achats faits directement depuis une carte de
          collection, sans ouvrir la fiche, sont comptés dans leur propre colonne — ils ne peuvent
          pas entrer dans ce taux.
        </p>
      </section>

      {/* ── Pages ── */}
      <section>
        <h2 className="font-serif text-xl font-bold text-ink mb-4">Pages</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[620px]">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Page</th>
                <th className="px-4 py-3 font-medium text-right">Vues</th>
                <th className="px-4 py-3 font-medium text-right">Temps moyen</th>
                <th className="px-4 py-3 font-medium text-right">Scroll moyen</th>
                <th className="px-4 py-3 font-medium text-right">Taux de sortie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {overview.pages.map((p) => {
                const exitRate = p.vues > 0 ? Math.round((p.sorties / p.vues) * 100) : 0
                return (
                  <tr key={p.path}>
                    <td className="px-4 py-3">
                      <span className="text-gray-800">{p.path}</span>
                      <Bar value={p.vues} max={maxVues} />
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-ink">{p.vues}</td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatDuration(p.duree_moyenne_s * 1000)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{p.scroll_moyen} %</td>
                    <td className={`px-4 py-3 text-right font-medium ${exitRate >= 70 ? 'text-red-600' : 'text-gray-600'}`}>
                      {exitRate} %
                    </td>
                  </tr>
                )
              })}
              {overview.pages.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Aucune donnée sur la période.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Un scroll moyen faible sur une page longue signale un contenu que personne ne voit.
          Un taux de sortie élevé désigne une page d’où les visiteurs s’en vont.
        </p>
      </section>

      {/* ── Clics et formulaires ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-4 flex items-center gap-2">
            <MousePointerClick size={18} className="text-brand-600" /> Ce sur quoi ils cliquent
          </h2>
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {overview.clics.map((c, i) => (
              <div key={`${c.label}-${c.path}-${i}`} className="px-4 py-3">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-gray-800 truncate">{c.label}</span>
                  <span className="font-semibold text-ink flex-shrink-0">{c.total}</span>
                </div>
                <p className="text-xs text-gray-400 truncate">{c.path}</p>
                <Bar value={c.total} max={maxClics} />
              </div>
            ))}
            {overview.clics.length === 0 && (
              <p className="px-4 py-8 text-center text-gray-400 text-sm">Aucun clic enregistré.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-4">Champs de formulaire abandonnés</h2>
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {overview.champs.map((f) => {
              const rate = f.ouvertures > 0 ? Math.round((f.abandons / f.ouvertures) * 100) : 0
              return (
                <div key={f.label} className="px-4 py-3 flex justify-between gap-3 text-sm">
                  <span className="text-gray-800">{f.label}</span>
                  <span className={rate >= 50 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                    {f.abandons} / {f.ouvertures} laissé{f.abandons > 1 ? 's' : ''} vide ({rate} %)
                  </span>
                </div>
              )
            })}
            {overview.champs.length === 0 && (
              <p className="px-4 py-8 text-center text-gray-400 text-sm">Aucun formulaire ouvert.</p>
            )}
          </div>

          <h2 className="font-serif text-xl font-bold text-ink mt-8 mb-4">Provenance</h2>
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {overview.sources.map((s) => (
              <div key={s.source} className="px-4 py-3 flex justify-between text-sm">
                <span className="text-gray-800">{s.source}</span>
                <span className="font-semibold text-ink">{s.visites}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Visites récentes ── */}
      <section>
        <h2 className="font-serif text-xl font-bold text-ink mb-4">Visites récentes</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Provenance</th>
                <th className="px-4 py-3 font-medium">Pays</th>
                <th className="px-4 py-3 font-medium">Arrivée</th>
                <th className="px-4 py-3 font-medium">Sortie</th>
                <th className="px-4 py-3 font-medium text-right">Pages</th>
                <th className="px-4 py-3 font-medium text-right">Durée</th>
                <th className="px-4 py-3 font-medium">Parcours</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {new Date(s.started_at).toLocaleString('fr-FR', {
                      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.source}</td>
                  <td className="px-4 py-3 text-gray-600">{s.country ? (NOM_PAYS[s.country] ?? s.country) : "—"}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[170px] truncate">{s.entry_path}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[170px] truncate">{s.exit_path ?? '—'}</td>
                  <td className="px-4 py-3 text-right">{s.pageviews}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">{formatDuration(s.duration_ms)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex gap-1">
                      {[s.saw_collection, s.saw_product, s.clicked_buy].map((done, i) => (
                        <span
                          key={i}
                          title={['Collection', 'Fiche produit', 'Commander'][i]}
                          className={`w-2.5 h-2.5 rounded-full ${done ? 'bg-brand-500' : 'bg-gray-200'}`}
                        />
                      ))}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/visiteurs/${s.id}/`} className="text-brand-700 hover:underline whitespace-nowrap">
                      Détail →
                    </Link>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Aucune visite sur la période.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
