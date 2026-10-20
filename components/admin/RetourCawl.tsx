'use client'

import { useEffect } from 'react'

/**
 * Prévient la page d'essai que le 3-D Secure est terminé.
 *
 * La banque ne redirige que l'iframe, jamais la page parente : sans ce
 * message, le banc d'essai attendrait indéfiniment. Si la banque est
 * sortie de l'iframe (certaines le font), on ramène simplement à la page
 * d'essai, qui reprend la main.
 */
export default function RetourCawl() {
  useEffect(() => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'CAWL_RETOUR' }, window.location.origin)
      return
    }
    window.location.replace('/admin/paiement-cawl/')
  }, [])

  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center text-gray-600">
      <p>Authentification terminée, un instant…</p>
    </div>
  )
}
