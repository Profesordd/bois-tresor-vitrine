'use client'

import { useEffect, useRef, useState } from 'react'
import { X, ArrowRight } from 'lucide-react'
import type { Product } from '@/types/database'
import { enregistrerLead } from '@/lib/leads'

interface Props {
  /** Produit du clic : sert à rattacher le lead, et à ouvrir la fenêtre. */
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
 * Volontairement minuscule : un titre, deux champs, un bouton. La première
 * version portait un rappel du produit, une case d'accord et deux lignes de
 * réassurance ; le client l'a trouvée trop longue, et il a raison. Quelqu'un
 * qui vient de cliquer sur « Commander » veut payer, pas lire. Toute ligne
 * ajoutée ici se paie en abandons.
 *
 * L'enregistrement ne retient jamais la redirection. Le lead part en
 * `sendBeacon`, qui survit au changement de page, et `onValide()` est
 * appelé dans la foulée sans rien attendre.
 */
export default function CollecteEmail({ product, montant, onFermer, onValide }: Props) {
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
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
    enregistrerLead({ email: adresse, telephone: telephone.trim(), consent: false }, product!, montant)
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
        className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="collecte-titre" className="font-serif text-xl font-bold text-ink leading-tight">
            Où envoyons-nous votre confirmation&nbsp;?
          </h2>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer"
            className="p-1.5 -mr-1.5 -mt-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex-shrink-0"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={valider} className="mt-4 space-y-3">
          <div>
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
              placeholder="Votre adresse e-mail"
              aria-label="Votre adresse e-mail"
              aria-invalid={erreur}
              aria-describedby={erreur ? 'collecte-erreur' : undefined}
              className={`w-full rounded-lg border-2 px-4 py-3.5 text-[17px] text-ink placeholder:text-gray-400 focus:outline-none ${
                erreur ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-600'
              }`}
            />
            {erreur && (
              <p id="collecte-erreur" className="text-[14px] text-red-700 mt-1.5">
                Adresse incomplète. Vérifiez le «&nbsp;@&nbsp;» et le point.
              </p>
            )}
          </div>

          <input
            id="collecte-tel"
            type="tel"
            name="tel"
            inputMode="tel"
            autoComplete="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            placeholder="Votre téléphone (facultatif)"
            aria-label="Votre téléphone, facultatif"
            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3.5 text-[17px] text-ink placeholder:text-gray-400 focus:outline-none focus:border-brand-600"
          />

          <button
            type="submit"
            disabled={envoi}
            data-track="Continuer vers le paiement"
            className="w-full py-4 rounded-lg font-bold text-[18px] flex items-center justify-center gap-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-70 text-white shadow-md transition-colors"
          >
            {envoi ? 'Redirection…' : <>Continuer vers le paiement <ArrowRight size={21} /></>}
          </button>
        </form>
      </div>
    </div>
  )
}
