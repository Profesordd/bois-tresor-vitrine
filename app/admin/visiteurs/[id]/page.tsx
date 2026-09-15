import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Eye, LogOut, MousePointerClick, TextCursorInput } from 'lucide-react'
import { getSessionDetail, formatDuration, type SessionEvent } from '@/lib/analytics/queries'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Parcours visiteur' }

const ICONS = {
  pageview: Eye,
  page_exit: LogOut,
  click: MousePointerClick,
  form_field: TextCursorInput,
} as const

const LABELS = {
  pageview: 'Arrive sur',
  page_exit: 'Quitte',
  click: 'Clique sur',
  form_field: 'Champ',
} as const

function describe(e: SessionEvent): string {
  if (e.type === 'click') return e.label ?? '(élément)'
  if (e.type === 'form_field') {
    const filled = (e.meta as { filled?: boolean }).filled
    return `${e.label} — ${filled ? 'rempli' : 'laissé vide'}`
  }
  return e.path
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function VisitorDetailPage({ params }: Props) {
  const { id } = await params
  const detail = await getSessionDetail(id)
  if (!detail?.session) notFound()

  const { session: s, events } = detail
  const start = new Date(s.started_at).getTime()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/admin/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6">
        <ArrowLeft size={15} /> Retour au tableau de bord
      </Link>

      <h1 className="font-serif text-2xl font-bold text-ink mb-1">Parcours d’un visiteur</h1>
      <p className="text-sm text-gray-500 mb-6">
        {new Date(s.started_at).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          ['Provenance', s.source],
          ['Appareil', s.device ?? 'inconnu'],
          ['Pages vues', String(s.pageviews)],
          ['Temps total', formatDuration(s.duration_ms)],
        ].map(([label, value]) => (
          <div key={label} className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="font-semibold text-ink mt-0.5 break-words">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Frise chronologique ── */}
      <ol className="relative border-l-2 border-gray-100 ml-3 space-y-5">
        {events.map((e) => {
          const Icon = ICONS[e.type]
          const offset = Math.max(0, new Date(e.occurred_at).getTime() - start)
          return (
            <li key={e.id} className="ml-6">
              <span className="absolute -left-[13px] flex items-center justify-center w-6 h-6 rounded-full bg-white border-2 border-brand-200">
                <Icon size={12} className="text-brand-600" />
              </span>

              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-xs text-gray-400 tabular-nums">+{formatDuration(offset)}</span>
                <span className="text-sm font-medium text-gray-700">{LABELS[e.type]}</span>
                <span className="text-sm text-ink break-all">{describe(e)}</span>
              </div>

              {e.type !== 'pageview' && e.path && (
                <p className="text-xs text-gray-400 break-all">{e.path}</p>
              )}

              {e.type === 'page_exit' && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {e.duration_ms !== null && <>Y est resté <strong>{formatDuration(e.duration_ms)}</strong></>}
                  {e.scroll_pct !== null && <> · a lu <strong>{e.scroll_pct} %</strong> de la page</>}
                </p>
              )}
            </li>
          )
        })}
        {events.length === 0 && <li className="ml-6 text-gray-400 text-sm">Aucun événement.</li>}
      </ol>
    </div>
  )
}
