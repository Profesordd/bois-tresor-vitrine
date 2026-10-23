'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * Retour de la banque après le 3-D Secure.
 *
 * La banque renvoie désormais la page entière, pas un cadre. Cette page
 * est donc seule à bord : elle lit l'identifiant de commande dans son
 * adresse, demande la confirmation au serveur, puis emmène le client sur
 * le remerciement.
 *
 * L'identifiant vient de `returnUrl`, posé au moment de créer le
 * paiement. Rien ne dépend de la mémoire du navigateur, qui ne survit pas
 * à un aller-retour chez la banque.
 *
 * Un cadre reste possible : certaines banques ne sortent pas de celui
 * qu'elles ont ouvert. Le cas est traité, la page prévient alors son
 * parent comme avant.
 *
 * ⚠️ Un échec ne doit jamais être un cul-de-sac. Le client qui arrive ici
 * a saisi une carte valide et voulait payer : on lui propose de
 * recommencer sur la même fiche, pas une page morte.
 */

type Etat = 'confirmation' | 'echec'

export default function RetourPaiement({ redirectPartenaire }: { redirectPartenaire?: string | null }) {
  const [etat, setEtat] = useState<Etat>('confirmation')
  const [message, setMessage] = useState('')
  const [retour, setRetour] = useState<string | null>(null)
  const fait = useRef(false)

  useEffect(() => {
    if (fait.current) return
    fait.current = true

    const commandeId = new URLSearchParams(window.location.search).get('c')

    /* Certaines banques renvoient à l'intérieur du cadre qu'elles ont
       ouvert. On en sort par le haut : la confirmation reprendra au
       rechargement, en pleine page. Si le navigateur refuse, on continue
       quand même ici plutôt que de laisser le client en plan. */
    if (window.top && window.top !== window.self) {
      try {
        window.top.location.replace(window.location.href)
        return
      } catch { /* navigation du parent refusée : on confirme sur place */ }
    }

    if (!commandeId) {
      setMessage('Nous n’avons pas retrouvé votre commande.')
      setEtat('echec')
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
          if (j.produitSlug) {
            /* On renvoie sur le même canal : un client du partenaire ne
               doit pas retomber sur le checkout du site, qui refuserait son
               produit. */
            const base = j.canal === 'partenaire' ? '/commande/partenaire' : '/commande'
            setRetour(`${base}/${j.produitSlug}/${j.lot ? `?lot=${encodeURIComponent(j.lot)}` : ''}`)
          }
          throw new Error(j.error ?? 'Paiement non confirmé')
        }
        /* Canal partenaire avec une URL de retour configurée : on y envoie
             le client directement, en lui passant sa référence. Sinon, la
             page de remerciement du bon canal. */
          if (j.canal === 'partenaire' && redirectPartenaire) {
            const sep = redirectPartenaire.includes('?') ? '&' : '?'
            window.location.replace(`${redirectPartenaire}${sep}ref=${encodeURIComponent(j.reference)}`)
            return
          }
          const merci = j.canal === 'partenaire' ? '/commande/partenaire/merci' : '/commande/merci'
          window.location.replace(`${merci}/?ref=${encodeURIComponent(j.reference)}`)
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'Paiement non confirmé')
        setEtat('echec')
      }
    })()
  }, [])

  if (etat === 'confirmation') {
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

      {retour && (
        <Link
          href={retour}
          className="inline-flex items-center gap-2 mt-6 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-lg font-bold"
        >
          <RefreshCw size={17} /> Reprendre ma commande
        </Link>
      )}

      <p className="text-[13px] text-gray-500 mt-6">
        Un souci ? Écrivez-nous à{' '}
        <a href="mailto:contact@bois-tresor.com" className="text-brand-700 underline">contact@bois-tresor.com</a>
      </p>
      <p className="text-[11px] text-gray-400 mt-4">{message}</p>
    </div>
  )
}
