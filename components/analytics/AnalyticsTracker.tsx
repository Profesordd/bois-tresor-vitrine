'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { getSession, send, type TrackedEvent } from '@/lib/analytics/track'

/** Profondeur de scroll atteinte, en pourcentage de la hauteur utile. */
function scrollPct(): number {
  const doc = document.documentElement
  const scrollable = doc.scrollHeight - window.innerHeight
  if (scrollable <= 0) return 100
  return Math.min(100, Math.max(0, Math.round((window.scrollY / scrollable) * 100)))
}

/** Libellé lisible d'un élément cliqué, pour le tableau de bord. */
function labelOf(el: HTMLElement): string {
  const explicit = el.closest<HTMLElement>('[data-track]')?.dataset.track
  if (explicit) return explicit
  const text = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ')
  if (text) return text.slice(0, 80)
  const aria = el.getAttribute('aria-label')
  return aria ? aria.slice(0, 80) : el.tagName.toLowerCase()
}

/**
 * Mesure du comportement : temps par page, parcours, scroll, clics.
 *
 * Tout est agrégé dans le navigateur et envoyé au départ de chaque page :
 * une requête à l'arrivée, une au départ. Aucun flux continu, pour ne pas
 * peser sur la navigation.
 */
/** L'espace d'administration n'est pas mesuré : les visites du gérant
 *  fausseraient ses propres statistiques de fréquentation. */
function isTracked(path: string): boolean {
  return !path.startsWith('/admin')
}

export default function AnalyticsTracker() {
  const pathname = usePathname()

  const enteredAt = useRef<number>(Date.now())
  const maxScroll = useRef<number>(0)
  const queue = useRef<TrackedEvent[]>([])
  const currentPath = useRef<string>(pathname)
  const exitSent = useRef<boolean>(false)
  /* Dernière page comptée, avec l'horodatage : le mode strict de React
     exécute deux fois les effets en développement, ce qui doublait chaque
     vue. Un retour arrière vers la même page reste compté normalement. */
  const lastView = useRef<{ path: string; at: number } | null>(null)

  /* ── Clics et champs de formulaire : écouteurs posés une seule fois ── */
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        'a, button, [data-track]'
      )
      if (!target) return

      const href = target.getAttribute('href')
      queue.current.push({
        type: 'click',
        path: currentPath.current,
        label: labelOf(target),
        meta: {
          tag: target.tagName.toLowerCase(),
          ...(href ? { href: href.slice(0, 200) } : {}),
        },
      })
      /* Un clic qui quitte la page doit partir tout de suite. */
      if (href && !href.startsWith('#')) flush()
    }

    function onBlurField(e: FocusEvent) {
      const el = e.target as HTMLInputElement | HTMLTextAreaElement | null
      if (!el || !('value' in el)) return
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return
      if (el.type === 'password') return

      queue.current.push({
        type: 'form_field',
        path: currentPath.current,
        label: el.getAttribute('name') || el.getAttribute('id') || el.tagName.toLowerCase(),
        /* On enregistre si le champ a été rempli ou laissé vide — jamais
           son contenu, qui serait une donnée personnelle. */
        meta: { filled: el.value.trim().length > 0 },
      })
    }

    function onScroll() {
      const p = scrollPct()
      if (p > maxScroll.current) maxScroll.current = p
    }

    document.addEventListener('click', onClick, true)
    document.addEventListener('blur', onBlurField, true)
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('blur', onBlurField, true)
      window.removeEventListener('scroll', onScroll)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function flush(extra?: TrackedEvent[]) {
    const events = [...queue.current, ...(extra ?? [])].filter((e) => isTracked(e.path))
    queue.current = []
    if (events.length > 0) send(events)
  }

  function sendExit() {
    if (exitSent.current) return
    exitSent.current = true
    flush([
      {
        type: 'page_exit',
        path: currentPath.current,
        durationMs: Date.now() - enteredAt.current,
        scrollPct: Math.max(maxScroll.current, scrollPct()),
      },
    ])
  }

  /* ── Arrivée sur une page, et départ de la précédente ── */
  useEffect(() => {
    /* Changement de page côté client : on clôt la précédente. */
    if (currentPath.current !== pathname) {
      sendExit()
      currentPath.current = pathname
    }

    enteredAt.current = Date.now()
    maxScroll.current = 0
    exitSent.current = false

    if (!isTracked(pathname)) return

    const { id, context } = getSession()
    if (!id) return

    const now = Date.now()
    const dup = lastView.current && lastView.current.path === pathname && now - lastView.current.at < 1500
    if (dup) return

    lastView.current = { path: pathname, at: now }
    send([{ type: 'pageview', path: pathname }], context)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  /* ── Fermeture de l'onglet ou passage en arrière-plan ── */
  useEffect(() => {
    function onHide() {
      if (document.visibilityState === 'hidden') sendExit()
    }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', sendExit)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', sendExit)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
