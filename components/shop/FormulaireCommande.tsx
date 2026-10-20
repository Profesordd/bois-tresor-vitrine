'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, ShieldCheck, Truck, AlertTriangle, Loader2, CreditCard } from 'lucide-react'
import type { Product, Lot } from '@/types/database'
import { formatPrice } from '@/lib/utils'
import { SIRET, SHIPPING_ZONE } from '@/lib/site'
import ProductVisual from '@/components/shop/ProductVisual'
import { getSession } from '@/lib/analytics/track'

/**
 * Checkout maison, paiement par carte sur le site.
 *
 * Une seule colonne, du haut vers le bas, même sur ordinateur : ce public
 * lit en descendant et se perd dans deux colonnes. Champs à 17 px, hauts
 * de 48 px, dictés par l'âge moyen des clients.
 *
 * Le moins de champs possible, dans l'ordre où on les demande à un
 * guichet : qui vous êtes, où on livre, comment vous payez. La carte vient
 * en dernier, jamais avant que la commande soit décrite.
 *
 * ⚠️ Le montant affiché ici est indicatif. Celui qui est débité est
 * recalculé par le serveur depuis le catalogue, puis relu en base avant
 * l'appel au prestataire. Rien de ce qui est saisi ici ne change le prix.
 */

type Etape = 'saisie' | 'envoi' | '3ds' | 'confirmation' | 'erreur'

const PAYS = [
  { code: 'FR', nom: 'France' },
  { code: 'BE', nom: 'Belgique' },
  { code: 'CH', nom: 'Suisse' },
  { code: 'LU', nom: 'Luxembourg' },
]

function luhn(n: string): boolean {
  let somme = 0
  let doubler = false
  for (let i = n.length - 1; i >= 0; i--) {
    let chiffre = parseInt(n[i], 10)
    if (doubler) { chiffre *= 2; if (chiffre > 9) chiffre -= 9 }
    somme += chiffre
    doubler = !doubler
  }
  return somme % 10 === 0
}

interface Props {
  product: Product
  lot: Lot | null
  montant: number
}

export default function FormulaireCommande({ product, lot, montant }: Props) {
  const router = useRouter()
  const [etape, setEtape] = useState<Etape>('saisie')
  const [erreur, setErreur] = useState('')
  const [iframeUrl, setIframeUrl] = useState<string | null>(null)
  const commandeRef = useRef<string | null>(null)

  const [client, setClient] = useState({
    prenom: '', nom: '', email: '', telephone: '',
    adresse: '', complement: '', codePostal: '', ville: '', pays: 'FR',
  })
  const [carte, setCarte] = useState({
    numero: '', mois: '01', annee: String(new Date().getFullYear() + 2), cvv: '', titulaire: '',
  })

  /* La banque ne redirige que l'iframe, jamais la page parente. Sans ce
     message, l'écran attendrait indéfiniment la fin du 3-D Secure. */
  useEffect(() => {
    function surMessage(e: MessageEvent) {
      if (e.data?.type !== 'CAWL_RETOUR' || !commandeRef.current) return
      setIframeUrl(null)
      setEtape('confirmation')
      void confirmer(commandeRef.current)
    }
    window.addEventListener('message', surMessage)
    return () => window.removeEventListener('message', surMessage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function premierManquant(): string | null {
    if (client.prenom.trim().length < 2) return 'votre prénom'
    if (client.nom.trim().length < 2) return 'votre nom'
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(client.email.trim())) return 'votre adresse e-mail'
    if (client.telephone.replace(/\D/g, '').length < 9) return 'votre numéro de téléphone'
    if (client.adresse.trim().length < 5) return 'votre adresse de livraison'
    if (client.codePostal.trim().length < 4) return 'votre code postal'
    if (client.ville.trim().length < 2) return 'votre ville'
    const brut = carte.numero.replace(/\D/g, '')
    if (brut.length < 13 || !luhn(brut)) return 'le numéro de carte'
    if (!/^\d{3,4}$/.test(carte.cvv)) return 'le cryptogramme au dos de la carte'
    if (carte.titulaire.trim().length < 2) return 'le nom inscrit sur la carte'
    return null
  }

  async function envoyer(e: React.FormEvent) {
    e.preventDefault()
    const manque = premierManquant()
    if (manque) {
      setErreur(`Il manque ${manque}.`)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setErreur('')
    setEtape('envoi')

    try {
      /* 1. La commande et son adresse de livraison. */
      const r1 = await fetch('/api/commande/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produitSlug: product.slug,
          lot: lot?.id ?? null,
          ...client,
          sessionId: getSession().id || null,
        }),
      })
      const j1 = await r1.json()
      if (!r1.ok || !j1.ok) throw new Error(j1.error ?? 'Commande impossible')
      commandeRef.current = j1.commandeId

      /* 2. Le paiement. Le montant vient de la base, pas d'ici. */
      const r2 = await fetch('/api/commande/payer/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commandeId: j1.commandeId,
          numeroCarte: carte.numero,
          moisExpiration: carte.mois,
          anneeExpiration: carte.annee,
          cvv: carte.cvv,
          titulaire: carte.titulaire,
          navigateur: {
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            colorDepth: window.screen.colorDepth,
            userAgent: navigator.userAgent,
            language: navigator.language,
            timezoneOffsetUtcMinutes: new Date().getTimezoneOffset() * -1,
          },
        }),
      })
      const j2 = await r2.json()
      if (!r2.ok || !j2.ok) throw new Error(j2.error ?? 'Paiement refusé')

      if (j2.redirection) {
        setIframeUrl(j2.redirection)
        setEtape('3ds')
      } else {
        setEtape('confirmation')
        await confirmer(j1.commandeId)
      }
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Une erreur est survenue')
      setEtape('erreur')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  async function confirmer(commandeId: string) {
    try {
      const r = await fetch('/api/commande/confirmer/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commandeId }),
      })
      const j = await r.json()
      if (!r.ok || !j.ok) throw new Error(j.error ?? 'Paiement non confirmé')
      router.replace(`/commande/merci/?ref=${encodeURIComponent(j.reference)}`)
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Paiement non confirmé')
      setEtape('erreur')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const occupe = etape === 'envoi' || etape === 'confirmation'
  const champ = 'w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-[17px] text-ink placeholder:text-gray-400 focus:outline-none focus:border-brand-600'
  const etiquette = 'block text-[15px] font-semibold text-ink mb-1.5'

  if (etape === '3ds' && iframeUrl) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <p className="px-5 py-4 border-b border-gray-100 text-[16px] text-gray-700">
          Votre banque vous demande de confirmer le paiement. Gardez votre téléphone à portée de main.
        </p>
        <iframe title="Confirmation bancaire" src={iframeUrl} className="w-full h-[600px] border-0" />
      </div>
    )
  }

  if (occupe) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
        <Loader2 size={34} className="animate-spin text-brand-600 mx-auto mb-4" />
        <p className="text-[17px] text-gray-700">
          {etape === 'envoi' ? 'Nous enregistrons votre commande…' : 'Nous validons votre paiement…'}
        </p>
        <p className="text-[15px] text-gray-500 mt-1">Ne fermez pas cette page.</p>
      </div>
    )
  }

  return (
    <form onSubmit={envoyer} className="space-y-5">
      {erreur && (
        <p className="flex items-start gap-2.5 rounded-lg border-2 border-red-300 bg-red-50 p-4 text-[16px] text-red-800">
          <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
          {erreur}
        </p>
      )}

      {/* ── Ce qui est commandé, rappelé avant tout le reste ── */}
      <section className="rounded-xl border border-gray-200 bg-white p-4 flex gap-4 items-center">
        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
          <ProductVisual image={product.image} name={product.name} fit="contain" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink leading-snug">{product.name}</p>
          {lot && <p className="text-[15px] text-gray-600">{lot.poids}</p>}
          <p className="text-2xl font-bold text-ink mt-1">{formatPrice(montant)}</p>
        </div>
      </section>

      <p className="flex items-center gap-2 text-[15px] font-semibold text-brand-700">
        <Truck size={18} /> Livraison offerte, {SHIPPING_ZONE}
      </p>

      <section className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <h2 className="font-serif text-xl font-bold text-ink">Vos coordonnées</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="prenom" className={etiquette}>Prénom</label>
            <input id="prenom" autoComplete="given-name" className={champ}
              value={client.prenom} onChange={(e) => setClient({ ...client, prenom: e.target.value })} />
          </div>
          <div>
            <label htmlFor="nom" className={etiquette}>Nom</label>
            <input id="nom" autoComplete="family-name" className={champ}
              value={client.nom} onChange={(e) => setClient({ ...client, nom: e.target.value })} />
          </div>
        </div>
        <div>
          <label htmlFor="email" className={etiquette}>Adresse e-mail</label>
          <input id="email" type="email" inputMode="email" autoComplete="email" className={champ}
            value={client.email} onChange={(e) => setClient({ ...client, email: e.target.value })} />
          <p className="text-[14px] text-gray-500 mt-1.5">Pour votre confirmation et le suivi de livraison.</p>
        </div>
        <div>
          <label htmlFor="telephone" className={etiquette}>Téléphone</label>
          <input id="telephone" type="tel" inputMode="tel" autoComplete="tel" className={champ}
            placeholder="06 12 34 56 78"
            value={client.telephone} onChange={(e) => setClient({ ...client, telephone: e.target.value })} />
          <p className="text-[14px] text-gray-500 mt-1.5">Le transporteur vous appelle avant de passer.</p>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <h2 className="font-serif text-xl font-bold text-ink">Adresse de livraison</h2>
        <div>
          <label htmlFor="adresse" className={etiquette}>Adresse</label>
          <input id="adresse" autoComplete="street-address" className={champ}
            placeholder="12 route des Chênes"
            value={client.adresse} onChange={(e) => setClient({ ...client, adresse: e.target.value })} />
        </div>
        <div>
          <label htmlFor="complement" className={etiquette}>
            Complément <span className="font-normal text-gray-500">(facultatif)</span>
          </label>
          <input id="complement" className={champ} placeholder="Lieu-dit, bâtiment, code du portail"
            value={client.complement} onChange={(e) => setClient({ ...client, complement: e.target.value })} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="cp" className={etiquette}>Code postal</label>
            <input id="cp" inputMode="numeric" autoComplete="postal-code" className={champ}
              value={client.codePostal} onChange={(e) => setClient({ ...client, codePostal: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label htmlFor="ville" className={etiquette}>Ville</label>
            <input id="ville" autoComplete="address-level2" className={champ}
              value={client.ville} onChange={(e) => setClient({ ...client, ville: e.target.value })} />
          </div>
        </div>
        <div>
          <label htmlFor="pays" className={etiquette}>Pays</label>
          <select id="pays" className={champ}
            value={client.pays} onChange={(e) => setClient({ ...client, pays: e.target.value })}>
            {PAYS.map((p) => <option key={p.code} value={p.code}>{p.nom}</option>)}
          </select>
        </div>
      </section>

      <section className="rounded-xl border-2 border-brand-200 bg-white p-5 space-y-4">
        <h2 className="font-serif text-xl font-bold text-ink flex items-center gap-2">
          <CreditCard size={21} className="text-brand-600" /> Votre carte bancaire
        </h2>
        <div>
          <label htmlFor="carte" className={etiquette}>Numéro de carte</label>
          <input id="carte" inputMode="numeric" autoComplete="cc-number" className={`${champ} font-mono`}
            placeholder="0000 0000 0000 0000"
            value={carte.numero}
            onChange={(e) => setCarte({ ...carte, numero: e.target.value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim() })} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="mois" className={etiquette}>Mois</label>
            <select id="mois" autoComplete="cc-exp-month" className={champ}
              value={carte.mois} onChange={(e) => setCarte({ ...carte, mois: e.target.value })}>
              {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="annee" className={etiquette}>Année</label>
            <select id="annee" autoComplete="cc-exp-year" className={champ}
              value={carte.annee} onChange={(e) => setCarte({ ...carte, annee: e.target.value })}>
              {Array.from({ length: 12 }, (_, i) => String(new Date().getFullYear() + i)).map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cvv" className={etiquette}>Crypto.</label>
            <input id="cvv" inputMode="numeric" autoComplete="cc-csc" className={`${champ} font-mono`}
              value={carte.cvv}
              onChange={(e) => setCarte({ ...carte, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
          </div>
        </div>
        <div>
          <label htmlFor="titulaire" className={etiquette}>Nom inscrit sur la carte</label>
          <input id="titulaire" autoComplete="cc-name" className={champ} placeholder="JEAN DUPONT"
            value={carte.titulaire} onChange={(e) => setCarte({ ...carte, titulaire: e.target.value })} />
        </div>
      </section>

      <button
        type="submit"
        className="w-full py-5 rounded-lg font-bold text-xl flex items-center justify-center gap-3 bg-brand-600 hover:bg-brand-700 text-white shadow-md transition-colors"
      >
        <Lock size={22} /> Payer {formatPrice(montant)}
      </button>

      <div className="space-y-2 pb-4">
        <p className="flex items-start gap-2 text-[14px] text-gray-600">
          <ShieldCheck size={16} className="text-brand-600 flex-shrink-0 mt-0.5" />
          Paiement sécurisé avec confirmation 3-D Secure. Vos coordonnées bancaires ne sont
          jamais enregistrées sur nos serveurs.
        </p>
        <p className="text-[14px] text-gray-600">
          Bois Tresor, entreprise familiale française. SIRET {SIRET}.
        </p>
      </div>
    </form>
  )
}
