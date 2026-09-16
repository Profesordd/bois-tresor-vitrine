'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { trackPageView, attendreLePixel } from '@/lib/analytics/meta'

/**
 * Déclenche PageView à chaque page, pixel et serveur ensemble.
 *
 * Le script du pixel ne le fait plus lui-même : il lui manquerait
 * l'identifiant partagé sans lequel Meta compterait la visite deux fois,
 * une fois par le navigateur et une fois par le serveur.
 *
 * L'attente du pixel précède l'envoi, et ne le répète pas : chaque appel
 * tire un nouvel identifiant et part aussi vers le serveur. Réessayer
 * enverrait donc plusieurs événements serveur au lieu d'un seul.
 *
 * L'espace d'administration est exclu : les visites du gérant n'ont rien à
 * faire dans les audiences publicitaires de son propre site.
 */
export default function MetaPageView() {
  const pathname = usePathname()
  const dernier = useRef<{ path: string; at: number } | null>(null)

  useEffect(() => {
    if (pathname.startsWith('/admin')) return

    /* Le mode strict de React exécute deux fois les effets en
       développement : sans ce garde-fou, chaque vue partirait en double. */
    const now = Date.now()
    if (dernier.current && dernier.current.path === pathname && now - dernier.current.at < 1500) return
    dernier.current = { path: pathname, at: now }

    /* Le pixel est chargé en « afterInteractive ». On lui laisse le temps
       d'arriver, puis on envoie une fois — qu'il soit là ou non, car
       l'envoi serveur ne dépend pas de lui. C'est même le cas où il compte
       le plus : un visiteur qui bloque les traceurs.

       Volontairement sans annulation au démontage : combinée au garde-fou
       ci-dessus, elle faisait disparaître l'événement. Le mode strict de
       React monte, démonte puis remonte ; l'envoi du premier montage était
       annulé, et le second bloqué comme doublon. La page a bien été vue,
       l'événement doit partir même si le visiteur enchaîne aussitôt. */
    void attendreLePixel(2000).then(() => trackPageView())
  }, [pathname])

  return null
}
