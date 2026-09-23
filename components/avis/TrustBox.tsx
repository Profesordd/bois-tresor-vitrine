'use client'

import { useEffect, useRef } from 'react'
import {
  TRUSTBOX, TRUSTPILOT_BUSINESS_UNIT_ID, TRUSTPILOT_LOCALE, TRUSTPILOT_URL,
  trustpilotActif,
} from '@/lib/trustpilot'

declare global {
  interface Window {
    Trustpilot?: { loadFromElement: (el: HTMLElement, forceReload?: boolean) => void }
  }
}

const SCRIPT_SRC = 'https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js'

/** Le script officiel, chargé une seule fois pour toute la visite. */
function chargerScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.Trustpilot) return Promise.resolve()

  const existant = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
  if (existant) {
    return new Promise((res) => existant.addEventListener('load', () => res(), { once: true }))
  }
  return new Promise((res) => {
    const s = document.createElement('script')
    s.src = SCRIPT_SRC
    s.async = true
    s.addEventListener('load', () => res(), { once: true })
    /* Bloqueur de publicité ou réseau coupé : on ne fait rien de plus, le
       repli maison reste affiché. */
    s.addEventListener('error', () => res(), { once: true })
    document.head.appendChild(s)
  })
}

interface Props {
  gabarit: keyof typeof TRUSTBOX
  className?: string
  /** Affiché tant que Trustpilot n'est pas configuré, ou si le script ne charge pas. */
  repli?: React.ReactNode
}

/**
 * Un widget Trustpilot officiel.
 *
 * Le widget est rendu par leur script dans un `iframe` : on lui donne le
 * conteneur et on le laisse faire. Next.js remplaçant le DOM à chaque
 * navigation, il faut redemander le rendu à chaque montage — sans quoi le
 * widget disparaît dès la deuxième page visitée.
 *
 * Si l'identifiant n'est pas configuré, ou si le script est bloqué, on
 * affiche `repli` : la note maison. Le site ne se retrouve jamais sans
 * preuve sociale.
 */
export default function TrustBox({ gabarit, className = '', repli = null }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const { templateId, hauteur } = TRUSTBOX[gabarit]
  const configure = trustpilotActif() && templateId.length > 0

  useEffect(() => {
    if (!configure || !ref.current) return
    let vivant = true
    chargerScript().then(() => {
      if (vivant && ref.current && window.Trustpilot) {
        window.Trustpilot.loadFromElement(ref.current, true)
      }
    })
    return () => { vivant = false }
  }, [configure, templateId])

  if (!configure) return <>{repli}</>

  return (
    <div className={className}>
      <div
        ref={ref}
        className="trustpilot-widget"
        data-locale={TRUSTPILOT_LOCALE}
        data-template-id={templateId}
        data-businessunit-id={TRUSTPILOT_BUSINESS_UNIT_ID}
        data-style-height={hauteur}
        data-style-width="100%"
        data-theme="light"
      >
        {/* Lien de repli exigé par Trustpilot, et visible si le script ne charge pas. */}
        <a href={TRUSTPILOT_URL} target="_blank" rel="noopener noreferrer">Trustpilot</a>
      </div>
    </div>
  )
}
