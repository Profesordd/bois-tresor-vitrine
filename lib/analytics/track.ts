/**
 * Collecte côté navigateur — sans cookie, sans donnée personnelle.
 *
 * L'identifiant de session vit dans sessionStorage : il disparaît à la
 * fermeture de l'onglet et n'est jamais partagé entre deux sites. C'est ce
 * qui permet de mesurer 100 % des visiteurs sans bandeau de consentement.
 */

/* Slash final indispensable : le site tourne en `trailingSlash: true`, et une
   URL sans slash provoque une redirection 308. Or sendBeacon ne suit pas les
   redirections — sans ce slash, toute la mesure part à la poubelle. */
const ENDPOINT = '/api/analytics/collect/'
const SESSION_KEY = 'bt_sid'

export type EventType = 'pageview' | 'page_exit' | 'click' | 'form_field'

export interface TrackedEvent {
  type: EventType
  path: string
  durationMs?: number
  scrollPct?: number
  label?: string
  meta?: Record<string, unknown>
}

interface SessionContext {
  entryPath: string
  referrer: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  device: 'mobile' | 'tablet' | 'desktop'
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

const CONTEXT_KEY = 'bt_sctx'

function readContext(): SessionContext | null {
  try {
    const raw = window.sessionStorage.getItem(CONTEXT_KEY)
    return raw ? (JSON.parse(raw) as SessionContext) : null
  } catch {
    return null
  }
}

function buildContext(): SessionContext {
  const params = new URLSearchParams(window.location.search)
  const width = window.innerWidth

  return {
    entryPath: window.location.pathname,
    /* Referrer interne ignoré : seule l'origine externe nous intéresse. */
    referrer:
      document.referrer && !document.referrer.includes(window.location.host)
        ? document.referrer.slice(0, 500)
        : null,
    utmSource: params.get('utm_source'),
    utmMedium: params.get('utm_medium'),
    utmCampaign: params.get('utm_campaign'),
    device: width < 640 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop',
  }
}

/**
 * Identifiant de session et contexte d'arrivée.
 *
 * Le contexte est mémorisé puis renvoyé à chaque appel, et non uniquement
 * la première fois : deux requêtes partent parfois presque en même temps, et
 * celle qui arrive la première crée la session. Si elle ne portait pas le
 * contexte, l'origine de la visite était perdue pour de bon.
 */
export function getSession(): { id: string; context: SessionContext | null } {
  if (typeof window === 'undefined') return { id: '', context: null }

  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY)
    if (existing) return { id: existing, context: readContext() }
  } catch {
    /* sessionStorage indisponible (navigation privée stricte) : on mesure
       quand même la page en cours, avec une session éphémère. */
  }

  const id = newId()
  const context = buildContext()
  try {
    window.sessionStorage.setItem(SESSION_KEY, id)
    window.sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(context))
  } catch {
    /* ignoré */
  }

  return { id, context }
}

/**
 * Envoi au serveur.
 *
 * `sendBeacon` est utilisé quand c'est possible : c'est le seul transport
 * qui survit à la fermeture de l'onglet, moment précis où l'on mesure le
 * temps passé sur la dernière page.
 */
export function send(events: TrackedEvent[], sessionContext?: SessionContext | null): void {
  if (typeof window === 'undefined' || events.length === 0) return

  const { id, context } = getSession()
  if (!id) return

  /* Le contexte accompagne chaque envoi : le serveur ne le retient qu'une
     fois, mais ainsi la toute première requête arrivée le porte forcément. */
  const body = JSON.stringify({ sessionId: id, context: sessionContext ?? context ?? undefined, events })

  try {
    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }))
      if (ok) return
    }
  } catch {
    /* on retombe sur fetch */
  }

  void fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    /* la mesure ne doit jamais gêner la navigation */
  })
}
