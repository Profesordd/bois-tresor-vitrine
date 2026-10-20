'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Lock, ShieldCheck, ArrowRight } from 'lucide-react'
import type { Product } from '@/types/database'
import { formatPrice } from '@/lib/utils'
import { enregistrerLead } from '@/lib/leads'

interface Props {
  /** Produit et montant du clic, affichés pour que le visiteur se repère. */
  product: Product | null
  montant: number
  onFermer: () => void
  /** Appelé une fois l'adresse enregistrée : la redirection part de là. */
  onValide: () => void
}

/* Même tolérance que côté serveur : on écarte la saisie manifestement
   absente, on ne prétend pas valider une boîte aux lettres. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i

/**
 * Demande de l'adresse e-mail, entre le clic et le paiement.
 *
 * Le paiement se fait sur un domaine tiers : passé la redirection, un
 * visiteur qui abandonne est définitivement perdu. C'est le dernier moment
 * où on peut le joindre.
 *
 * Présentée comme une étape de commande, jamais comme une inscription.
 * Pour ce public, qu'on ne demande pas son adresse avant de payer est plus
 * suspect que l'inverse : partout ailleurs, on la lui demande.
 *
 * L'enregistrement ne retient jamais la redirection. Le lead part en
 * `sendBeacon`, qui survit au changement de page, et `onValide()` est
 * appelé dans la foulée sans rien attendre.
 */
export default function CollecteEmail({ product, montant, onFermer, onValide }: Props) {
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const [consent, setConsent] = useState(false)
  const [erreur, setErreur] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const champEmail = useRef<HTMLInputElement>(null)

  const ouvert = product !== null

  useEffect(() => {
    if (!ouvert) return
    setErreur(false)
    setEnvoi(false)
    const precedent = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onFermer() }
    document.addEventListener('keydown', onKey)
    /* Le curseur dans le champ : un geste de moins, et sur téléphone le
       clavier s'ouvre tout seul. */
    const t = window.setTimeout(() => champEmail.current?.focus(), 80)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = precedent
    }
  }, [ouvert, onFermer])

  if (!ouvert) return null

  function valider(e: React.FormEvent) {
    e.preventDefault()
    const adresse = email.trim()
    if (!EMAIL_RE.test(adresse)) {
      setErreur(true)
      champEmail.current?.focus()
      return
    }
    setEnvoi(true)
    enregistrerLead({ email: adresse, telephone: telephone.trim(), consent }, product!, montant)
    onValide()
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6"
      onClick={onFermer}
      role="dialog"
      aria-modal="true"
      aria-labelledby="collecte-titre"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-md max-h-[94vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6 pb-0">
          <div className="min-w-0">
            <h2 id="collecte-titre" className="font-serif text-xl sm:text-2xl font-bold text-ink leading-tight">
              Où envoyons-nous votre confirmation&nbsp;?
            </h2>
            <p className="text-[15px] text-gray-600 mt-2 leading-snug">
              Votre numéro de commande et le suivi de la livraison vous seront envoyés
              à cette adresse.
            </p>
          </div>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="p-1.5 -mr-1.5 -mt-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex-shrink-0"
          >
            <X size={22} />
          </button>
        </div>

        {/* Ce qu'il s'apprête à payer, rappelé ici : la fenêtre s'ouvre
            par-dessus la fiche, et sur téléphone elle la masque entièrement. */}
        <div className="mx-5 sm:mx-6 mt-4 rounded-lg bg-brand-50 px-4 py-3">
          <p className="text-[14px] text-gray-700 leading-snug">{product!.name}</p>
          <p className="text-xl font-bold text-ink mt-0.5">{formatPrice(montant)}</p>
        </div>

        <form onSubmit={valider} className="p-5 sm:p-6 space-y-4">
          <div>
            <label htmlFor="collecte-email" className="block text-[15px] font-semibold text-ink mb-1.5">
              Votre adresse e-mail
            </label>
            <input
              ref={champEmail}
              id="collecte-email"
              type="email"
              name="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErreur(false) }}
              placeholder="prenom.nom@exemple.fr"
              aria-invalid={erreur}
              aria-describedby={erreur ? 'collecte-erreur' : undefined}
              className={`w-full rounded-lg border-2 px-4 py-3.5 text-[17px] text-ink placeholder:text-gray-400 focus:outline-none ${
                erreur ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-600'
              }`}
            />
            {erreur && (
              <p id="collecte-erreur" className="text-[14px] text-red-700 mt-1.5">
                Cette adresse semble incomplète. Vérifiez qu’il y a bien un «&nbsp;@&nbsp;» et un point.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="collecte-tel" className="block text-[15px] font-semibold text-ink mb-1.5">
              Votre téléphone <span className="font-normal text-gray-500">(facultatif)</span>
            </label>
            <input
              id="collecte-tel"
              type="tel"
              name="tel"
              inputMode="tel"
              autoComplete="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="06 12 34 56 78"
              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3.5 text-[17px] text-ink placeholder:text-gray-400 focus:outline-none focus:border-brand-600"
            />
            <p className="text-[13px] text-gray-500 mt-1.5">
              Pour vous joindre si un problème survient sur votre livraison.
            </p>
          </div>

          {/* Décochée, et formulée sans détour : prospecter par e-mail
              quelqu'un qui n'a jamais acheté suppose son accord préalable. */}
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 w-5 h-5 flex-shrink-0 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-[14px] text-gray-600 leading-snug">
              Je veux aussi recevoir vos offres et vos conseils de chauffage. Désinscription
              en un clic.
            </span>
          </label>

          <button
            type="submit"
            disabled={envoi}
            data-track="Continuer vers le paiement"
            className="w-full py-4 rounded-lg font-bold text-[18px] flex items-center justify-center gap-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-70 text-white shadow-md transition-colors"
          >
            {envoi ? 'Redirection vers le paiement…' : <>Continuer vers le paiement <ArrowRight size={21} /></>}
          </button>

          <div className="space-y-1.5 pt-0.5">
            <p className="flex items-center gap-2 text-[13px] text-gray-500">
              <Lock size={14} className="text-brand-600 flex-shrink-0" />
              Paiement sécurisé. Vos données bancaires ne transitent jamais par nos serveurs.
            </p>
            <p className="flex items-center gap-2 text-[13px] text-gray-500">
              <ShieldCheck size={14} className="text-brand-600 flex-shrink-0" />
              Votre adresse ne sera ni vendue ni communiquée à un tiers.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
