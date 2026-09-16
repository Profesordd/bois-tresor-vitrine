import { createAdminClient } from '@/lib/supabase/server'

/** Fuseau de référence : les journées s'entendent en heure française. */
export const FUSEAU = 'Europe/Paris'

/** Date du jour à Paris, au format AAAA-MM-JJ. */
export function aujourdhui(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: FUSEAU })
}

/** Décale une date de N jours, sans passer par l'heure locale du serveur. */
export function decalerJours(date: string, jours: number): string {
  const [a, m, j] = date.split('-').map(Number)
  const d = new Date(Date.UTC(a, m - 1, j))
  d.setUTCDate(d.getUTCDate() + jours)
  return d.toISOString().slice(0, 10)
}

/** « 15 septembre 2026 » */
export function formatDate(date: string): string {
  const [a, m, j] = date.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, j)).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })
}

const RE_DATE = /^\d{4}-\d{2}-\d{2}$/
export function dateValide(v: unknown): v is string {
  return typeof v === 'string' && RE_DATE.test(v) && !Number.isNaN(Date.parse(v))
}

/** Agrégats calculés par la base — voir supabase-analytics-views.sql. */

export interface Overview {
  du: string
  au: string
  /** Une ligne par journée française, pour suivre l'évolution. */
  jours: { jour: string; visites: number; achats: number }[]
  resume: {
    visites: number
    duree_moyenne_s: number
    pages_par_visite: number
    visites_une_page: number
    etape_collection: number
    etape_produit: number
    etape_achat: number
    /** Visites écartées : hors zone commerciale ou pays inconnu. */
    hors_zone: number
  } | null
  pages: { path: string; vues: number; duree_moyenne_s: number; scroll_moyen: number; sorties: number }[]
  clics: { label: string; path: string; total: number }[]
  champs: { label: string; ouvertures: number; abandons: number }[]
  sources: { source: string; visites: number }[]
  appareils: { appareil: string; visites: number }[]
  pays: { code: string; visites: number }[]
}

export interface SessionRow {
  id: string
  started_at: string
  entry_path: string
  exit_path: string | null
  source: string
  device: string | null
  country: string | null
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
  /** Visiteurs ayant ouvert la fiche. */
  vues: number
  /** Visiteurs ayant mis au panier, toutes origines confondues. */
  achats: number
  /** ... après avoir ouvert la fiche. */
  achats_fiche: number
  /** ... directement depuis une carte de collection. */
  achats_carte: number
  /** achats_fiche rapporté aux vues : les deux seuls chiffres comparables. */
  taux: number
  valeur_totale: number
  scroll_moyen: number
}

export async function getFunnelByDevice(du: string, au: string): Promise<DeviceFunnel[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('analytics_funnel_by_device_dates', { p_from: du, p_to: au })
  if (error || !data) return []
  return data as DeviceFunnel[]
}

export async function getProductPerformance(du: string, au: string): Promise<ProductPerformance[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('analytics_product_performance_dates', { p_from: du, p_to: au })
  if (error || !data) return []
  return data as ProductPerformance[]
}

export async function getOverview(du: string, au: string): Promise<Overview | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('analytics_overview_dates', { p_from: du, p_to: au })
  if (error) return null
  return data as Overview
}

export async function getRecentSessions(du: string, au: string, limit = 200): Promise<SessionRow[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('analytics_recent_sessions_dates', {
    p_from: du,
    p_to: au,
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
