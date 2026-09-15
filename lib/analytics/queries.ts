import { createAdminClient } from '@/lib/supabase/server'

/** Agrégats calculés par la base — voir supabase-analytics-views.sql. */

export interface Overview {
  periode_jours: number
  resume: {
    visites: number
    duree_moyenne_s: number
    pages_par_visite: number
    visites_une_page: number
    etape_collection: number
    etape_produit: number
    etape_achat: number
  } | null
  pages: { path: string; vues: number; duree_moyenne_s: number; scroll_moyen: number; sorties: number }[]
  clics: { label: string; path: string; total: number }[]
  champs: { label: string; ouvertures: number; abandons: number }[]
  sources: { source: string; visites: number }[]
  appareils: { appareil: string; visites: number }[]
}

export interface SessionRow {
  id: string
  started_at: string
  entry_path: string
  exit_path: string | null
  source: string
  device: string | null
  pageviews: number
  duration_ms: number
  saw_collection: boolean
  saw_product: boolean
  clicked_buy: boolean
}

export interface SessionEvent {
  id: number
  type: 'pageview' | 'page_exit' | 'click' | 'form_field'
  path: string
  occurred_at: string
  duration_ms: number | null
  scroll_pct: number | null
  label: string | null
  meta: Record<string, unknown>
}

export interface DeviceFunnel {
  device: string
  visites: number
  saw_collection: number
  saw_product: number
  clicked_buy: number
  duree_moyenne_s: number
  pages_par_visite: number
}

export interface ProductPerformance {
  slug: string
  name: string
  vues: number
  achats: number
  taux: number
  valeur_totale: number
  scroll_moyen: number
}

export async function getFunnelByDevice(days: number): Promise<DeviceFunnel[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('analytics_funnel_by_device', { p_days: days })
  if (error || !data) return []
  return data as DeviceFunnel[]
}

export async function getProductPerformance(days: number): Promise<ProductPerformance[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('analytics_product_performance', { p_days: days })
  if (error || !data) return []
  return data as ProductPerformance[]
}

export async function getOverview(days: number): Promise<Overview | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('analytics_overview', { p_days: days })
  if (error) return null
  return data as Overview
}

export async function getRecentSessions(days: number, limit = 100): Promise<SessionRow[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('analytics_recent_sessions', {
    p_days: days,
    p_limit: limit,
  })
  if (error || !data) return []
  return data as SessionRow[]
}

export async function getSessionDetail(
  id: string
): Promise<{ session: SessionRow | null; events: SessionEvent[] } | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('analytics_session_detail', { p_session: id })
  if (error || !data) return null
  return data as { session: SessionRow | null; events: SessionEvent[] }
}

/** « 2 min 30 » plutôt que « 150000 ms ». */
export function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s} s`
  const m = Math.floor(s / 60)
  const rest = s % 60
  return rest === 0 ? `${m} min` : `${m} min ${String(rest).padStart(2, '0')}`
}
