'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react'
import { chargerPixelBurban, attendreBurban, trackBurban, produitBurban } from '@/lib/analytics/burban'

/**
 * Retour de la banque pour le canal partenaire.
 *
 * Page distincte de celle du site, et sous un chemin exclu du pixel de
 * bois-tresor. Elle confirme la commande, déclenche le Purchase du pixel
 * Burban — et de lui seul — puis renvoie le client vers le site du
 * partenaire. Rien ne touche le pixel ni l'admin de bois-tresor.
 *
 * Le pixel Burban est chargé ici aussi : c'est un chargement de page neuf
 * après le 3-D Secure, l'init de la page de checkout n'a pas survécu.
 */

export default function RetourPartenaire({ redirectUrl }: { redirectUrl?: string | null }) {
  const [echec, setEchec] = useState<{ message: string; retour: string | null } | null>(null)
  const fait = useRef(false)

  useEffect(() => {
    if (fait.current) return
    fait.current = true

    chargerPixelBurban()

    const commandeId = new URLSearchParams(window.location.search).get('c')

    /* Si la banque renvoie dans son propre cadre, on en sort par le haut. */
    if (window.top && window.top !== window.self) {
      try {
        window.top.location.replace(window.location.href)
        return
      } catch { /* navigation du parent refusée : on confirme sur place */ }
    }

    if (!commandeId) {
      setEchec({ message: 'Commande introuvable.', retour: null })
      return
    }

    void (async () => {
      try {
        const r = await fetch('/api/commande/confirmer/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ commandeId }),
        })
        const j = await r.json()
        if (!r.ok || !j.ok) {
          const retour = j.produitSlug ? `/commande/partenaire/${j.produitSlug}/` : null
          throw Object.assign(new Error(j.error ?? 'Paiement non confirmé'), { retour })
        }

        /* Purchase vers le seul pixel Burban, avec l'identifiant de commande
           comme eventId. On laisse à l'envoi le temps de partir avant de
           quitter la page. */
        await attendreBurban(2000)
        trackBurban(
          'Purchase',
          { ...produitBurban(j.produitSlug, j.produitNom, j.montantEur), order_id: j.reference },
          commandeId,
        )

        const cible = redirectUrl
          ? `${redirectUrl}${redirectUrl.includes('?') ? '&' : '?'}ref=${encodeURIComponent(j.reference)}`
          : `/commande/partenaire/merci/?ref=${encodeURIComponent(j.reference)}`

        window.setTimeout(() => window.location.replace(cible), 600)
      } catch (err) {
        const e = err as Error & { retour?: string | null }
        setEchec({ message: e.message, retour: e.retour ?? null })
      }
    })()
  }, [redirectUrl])

  if (!echec) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Loader2 size={34} className="animate-spin text-brand-600 mx-auto mb-4" />
        <p className="text-[17px] font-medium text-ink">Nous validons votre paiement…</p>
        <p className="text-[15px] text-gray-500 mt-1.5">Ne fermez pas cette page.</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <AlertTriangle size={34} className="text-amber-600 mx-auto mb-4" />
      <h1 className="font-serif text-2xl font-bold text-ink">Le paiement n’a pas abouti</h1>
      <p className="text-[15px] text-gray-600 mt-3">
        Votre banque n’a pas confirmé l’opération. <strong className="text-ink">Vous n’avez pas été débité.</strong>
      </p>
      <p className="text-[14px] text-gray-500 mt-2">
        Cela arrive quand la validation prend trop de temps. Vous pouvez recommencer, votre carte
        n’est pas en cause.
      </p>
      {echec.retour && (
        <a
          href={echec.retour}
          className="inline-flex items-center gap-2 mt-6 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-lg font-bold"
        >
          <RefreshCw size={17} /> Reprendre ma commande
        </a>
      )}
      <p className="text-[11px] text-gray-400 mt-4">{echec.message}</p>
    </div>
  )
}
