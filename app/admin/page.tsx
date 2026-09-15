import Link from 'next/link'
import { Users, Clock, FileText, LogOut, TrendingDown, MousePointerClick, AlertTriangle } from 'lucide-react'
import { getOverview, getRecentSessions, formatDuration } from '@/lib/analytics/queries'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Tableau de bord' }

const PERIODS = [1, 7, 30, 90]

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
  searchParams: Promise<{ jours?: string }>
}

export default async function AdminDashboard({ searchParams }: Props) {
  const { jours } = await searchParams
  const days = PERIODS.includes(Number(jours)) ? Number(jours) : 7

  const [overview, sessions] = await Promise.all([getOverview(days), getRecentSessions(days, 100)])
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
    { label: 'A cliqué sur Commander', value: r.etape_achat },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">Tableau de bord</h1>
          <p className="text-gray-500 text-sm mt-1">Comportement des visiteurs sur le site</p>
        </div>
        <div className="flex items-center gap-2">
          {PERIODS.map((d) => (
            <Link
              key={d}
              href={`/admin/?jours=${d}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                d === days
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'border-gray-200 text-gray-600 hover:border-brand-400'
              }`}
            >
              {d === 1 ? '24 h' : `${d} j`}
            </Link>
          ))}
          <Link
            href="/admin/deconnexion/"
            className="ml-2 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
          >
            <LogOut size={15} /> Quitter
          </Link>
        </div>
      </div>

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
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Aucune visite sur la période.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
