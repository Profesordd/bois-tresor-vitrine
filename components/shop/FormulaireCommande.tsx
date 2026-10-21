'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Shield, Truck, AlertTriangle, Loader2, CreditCard, Star, Check } from 'lucide-react'
import type { Product, Lot } from '@/types/database'
import { formatPrice } from '@/lib/utils'
import { REVIEW_RATING, REVIEW_COUNT } from '@/lib/reviews'
import Image from 'next/image'
import ProductVisual from '@/components/shop/ProductVisual'
import { getSession } from '@/lib/analytics/track'
import { trackInitiateCheckout, trackAddPaymentInfo, attendreLePixel } from '@/lib/analytics/meta'

/**
 * Checkout maison, paiement par carte sur le site.
 *
 * Mise en page reprise du checkout d'un autre site du client : barre de
 * progression, formulaire à gauche, récapitulatif collant à droite, blocs
 * blancs sur fond gris. Sur téléphone, tout retombe en une colonne et le
 * récapitulatif passe en tête : on doit voir ce qu'on achète avant de
 * remplir dix champs.
 *
 * Trois éléments de ce modèle n'ont PAS été repris, ils sont interdits
 * ici : le compte à rebours, les avis inventés, et le badge d'une
 * plateforme d'avis tierce. Les chiffres affichés sont ceux du site, et
 * les témoignages viennent de `lib/reviews.ts`.
 *
 * ⚠️ Le montant affiché est indicatif. Celui qui est débité est recalculé
 * par le serveur depuis le catalogue, puis relu en base avant l'appel au
 * prestataire. Rien de ce qui est saisi ici ne change le prix.
 */

type Etape = 'saisie' | 'envoi' | '3ds' | 'confirmation' | 'erreur'

const PAYS = [
  { code: 'FR', nom: '🇫🇷 France' },
  { code: 'BE', nom: '🇧🇪 Belgique' },
  { code: 'CH', nom: '🇨🇭 Suisse' },
  { code: 'LU', nom: '🇱🇺 Luxembourg' },
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

  /* `InitiateCheckout` à l'arrivée sur l'écran. Une seule fois : en
     développement React monte, démonte puis remonte, et le garde-fou
     évite d'envoyer deux fois le même événement. */
  const checkoutMesure = useRef(false)
  useEffect(() => {
    if (checkoutMesure.current) return
    checkoutMesure.current = true
    /* ⚠️ Attendre le pixel AVANT d'envoyer. L'événement part à l'instant où
       la page se monte, et le script du pixel n'est pas encore chargé :
       sans cette attente, le navigateur n'envoie rien et seul le serveur
       compte. C'est ce qui faisait apparaître les AddToCart dans Meta sans
       aucun InitiateCheckout. L'attente précède l'envoi et ne le répète
       pas : réessayer créerait plusieurs événements serveur. */
    void attendreLePixel(2000).then(() => trackInitiateCheckout(product, montant))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    /* `AddPaymentInfo` : coordonnées et carte saisies, le paiement part.
       Le pixel est chargé depuis longtemps à ce stade, l'attente se résout
       immédiatement. */
    void attendreLePixel(1000).then(() => trackAddPaymentInfo(product, montant))

    try {
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
          /* Empreinte du navigateur, telle que le plugin officiel la
             recueille. `javaEnabled` et non `javaScriptEnabled` : ce sont
             deux champs distincts côté Worldline, et c'est le premier que
             le plugin transmet. */
          navigateur: {
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            colorDepth: window.screen.colorDepth,
            javaEnabled: typeof navigator.javaEnabled === 'function' ? navigator.javaEnabled() : false,
            userAgent: navigator.userAgent,
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

  const champ = 'w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-[16px] text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
  /* Noir et gras, jamais gris : la moyenne d'âge de cette clientèle est de
     soixante ans, un libellé gris clair y devient illisible. */
  const etiquette = 'block text-[15px] font-bold text-ink mb-1'
  const titre = 'text-[15px] font-bold text-ink mb-3'
  const bloc = 'bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100'

  /* ── Pendant le 3-D Secure, la banque occupe tout l'écran ── */
  if (etape === '3ds' && iframeUrl) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <p className="px-5 py-4 border-b border-gray-100 text-[16px] text-gray-700 flex items-start gap-2.5">
            <Shield size={19} className="text-brand-600 flex-shrink-0 mt-0.5" />
            Votre banque vous demande de confirmer le paiement. Gardez votre téléphone à portée de main.
          </p>
          <iframe title="Confirmation bancaire" src={iframeUrl} className="w-full h-[620px] border-0" />
        </div>
      </div>
    )
  }

  if (etape === 'envoi' || etape === 'confirmation') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
        <Loader2 size={36} className="animate-spin text-brand-600 mx-auto mb-4" />
        <p className="text-[17px] font-medium text-ink">
          {etape === 'envoi' ? 'Nous enregistrons votre commande…' : 'Nous validons votre paiement…'}
        </p>
        <p className="text-[15px] text-gray-500 mt-1.5">Ne fermez pas cette page.</p>
      </div>
    )
  }

  const GARANTIES = [
    { icon: Truck, libelle: 'Livraison offerte' },
    { icon: Lock, libelle: 'Paiement sécurisé' },
    { icon: Shield, libelle: 'Entreprise française' },
  ]

  return (
    <>
      {/* ── Barre de progression ── */}
      <div className="flex items-center justify-center gap-2 mb-5">
        <div className="flex items-center gap-1.5">
          <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center font-bold">
            <Check size={13} strokeWidth={3} />
          </span>
          <span className="text-sm font-medium text-brand-700 hidden sm:inline">Produit</span>
        </div>
        <span className="h-px w-8 bg-brand-600" />
        <div className="flex items-center gap-1.5">
          <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center font-bold">2</span>
          <span className="text-sm font-bold text-ink hidden sm:inline">Commande</span>
        </div>
        <span className="h-px w-8 bg-gray-200" />
        <div className="flex items-center gap-1.5">
          <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-400 text-xs flex items-center justify-center font-bold">3</span>
          <span className="text-sm text-gray-400 hidden sm:inline">Confirmation</span>
        </div>
      </div>

      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink mb-1">Finaliser ma commande</h1>
      <p className="text-sm text-gray-500 mb-5">Commande sécurisée. Livraison offerte.</p>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        {/* ── Le formulaire ── */}
        <form onSubmit={envoyer} className="lg:col-span-2 space-y-4 order-last lg:order-first">
          {erreur && (
            <p className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[15px] text-red-800">
              <AlertTriangle size={19} className="flex-shrink-0 mt-0.5" />
              {erreur}
            </p>
          )}

          <section className={bloc}>
            <h2 className={titre}>Vos coordonnées</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label htmlFor="prenom" className={etiquette}>Prénom *</label>
                <input id="prenom" autoComplete="given-name" className={champ}
                  value={client.prenom} onChange={(e) => setClient({ ...client, prenom: e.target.value })} />
              </div>
              <div>
                <label htmlFor="nom" className={etiquette}>Nom *</label>
                <input id="nom" autoComplete="family-name" className={champ}
                  value={client.nom} onChange={(e) => setClient({ ...client, nom: e.target.value })} />
              </div>
            </div>
            <div className="mb-3">
              <label htmlFor="email" className={etiquette}>E-mail *</label>
              <input id="email" type="email" inputMode="email" autoComplete="email" className={champ}
                value={client.email} onChange={(e) => setClient({ ...client, email: e.target.value })} />
              <p className="text-[13px] text-gray-500 mt-1.5">Pour votre confirmation et le suivi de livraison.</p>
            </div>
            <div>
              <label htmlFor="telephone" className={etiquette}>Téléphone *</label>
              <input id="telephone" type="tel" inputMode="tel" autoComplete="tel" className={champ}
                placeholder="06 12 34 56 78"
                value={client.telephone} onChange={(e) => setClient({ ...client, telephone: e.target.value })} />
              <p className="text-[13px] text-gray-500 mt-1.5">Le transporteur vous appelle avant de passer.</p>
            </div>
          </section>

          <section className={bloc}>
            <h2 className={titre}>Adresse de livraison</h2>
            <div className="mb-3">
              <label htmlFor="adresse" className={etiquette}>Adresse *</label>
              <input id="adresse" autoComplete="street-address" className={champ}
                placeholder="12 route des Chênes"
                value={client.adresse} onChange={(e) => setClient({ ...client, adresse: e.target.value })} />
            </div>
            <div className="mb-3">
              <label htmlFor="complement" className={etiquette}>
                Complément <span className="font-normal text-gray-400">(facultatif)</span>
              </label>
              <input id="complement" className={champ} placeholder="Lieu-dit, bâtiment, code du portail"
                value={client.complement} onChange={(e) => setClient({ ...client, complement: e.target.value })} />
            </div>
            <div className="grid grid-cols-5 gap-3 mb-3">
              <div className="col-span-2">
                <label htmlFor="cp" className={etiquette}>Code postal *</label>
                <input id="cp" inputMode="numeric" autoComplete="postal-code" className={champ}
                  placeholder="39000"
                  value={client.codePostal} onChange={(e) => setClient({ ...client, codePostal: e.target.value })} />
              </div>
              <div className="col-span-3">
                <label htmlFor="ville" className={etiquette}>Ville *</label>
                <input id="ville" autoComplete="address-level2" className={champ}
                  value={client.ville} onChange={(e) => setClient({ ...client, ville: e.target.value })} />
              </div>
            </div>
            <div>
              <label htmlFor="pays" className={etiquette}>Pays *</label>
              <select id="pays" className={`${champ} bg-white`}
                value={client.pays} onChange={(e) => setClient({ ...client, pays: e.target.value })}>
                {PAYS.map((p) => <option key={p.code} value={p.code}>{p.nom}</option>)}
              </select>
            </div>
          </section>

          <section className={`${bloc} ring-2 ring-brand-100`}>
            <h2 className={`${titre} flex items-center gap-2`}>
              <CreditCard size={18} className="text-brand-600" /> Votre carte bancaire
            </h2>
            <div className="mb-3">
              <label htmlFor="carte" className={etiquette}>Numéro de carte *</label>
              <input id="carte" inputMode="numeric" autoComplete="cc-number" className={`${champ} font-mono tracking-wide`}
                placeholder="0000 0000 0000 0000"
                value={carte.numero}
                onChange={(e) => setCarte({ ...carte, numero: e.target.value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim() })} />
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label htmlFor="mois" className={etiquette}>Mois *</label>
                <select id="mois" autoComplete="cc-exp-month" className={`${champ} bg-white`}
                  value={carte.mois} onChange={(e) => setCarte({ ...carte, mois: e.target.value })}>
                  {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="annee" className={etiquette}>Année *</label>
                <select id="annee" autoComplete="cc-exp-year" className={`${champ} bg-white`}
                  value={carte.annee} onChange={(e) => setCarte({ ...carte, annee: e.target.value })}>
                  {Array.from({ length: 12 }, (_, i) => String(new Date().getFullYear() + i)).map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="cvv" className={etiquette}>Crypto. *</label>
                <input id="cvv" inputMode="numeric" autoComplete="cc-csc" className={`${champ} font-mono`}
                  placeholder="123"
                  value={carte.cvv}
                  onChange={(e) => setCarte({ ...carte, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
              </div>
            </div>
            <div>
              <label htmlFor="titulaire" className={etiquette}>Nom inscrit sur la carte *</label>
              <input id="titulaire" autoComplete="cc-name" className={champ} placeholder="JEAN DUPONT"
                value={carte.titulaire} onChange={(e) => setCarte({ ...carte, titulaire: e.target.value })} />
            </div>
          </section>

          {/* ── Garanties. Une ligne qui se replie, plutôt que trois
                 colonnes à 110 px sur téléphone où tout se chevauchait. ── */}
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3">
            {GARANTIES.map(({ icon: Icon, libelle }) => (
              <li key={libelle} className="flex items-center gap-1.5 text-[13px] font-semibold text-brand-800">
                <Icon size={15} className="text-brand-600 flex-shrink-0" />
                {libelle}
              </li>
            ))}
          </ul>

          <button
            type="submit"
            className="w-full bg-brand-600 hover:bg-brand-700 text-white py-4 rounded-lg font-bold text-[17px] flex items-center justify-center gap-2.5 transition-colors shadow-sm"
          >
            <Lock size={19} />
            Payer {formatPrice(montant)}
          </button>

          {/* Les vrais logos plutôt que des étiquettes grises : ce public
              reconnaît Visa, Mastercard et CB d'un coup d'œil, là où du
              texte ne rassure personne. */}
          <Image
            src="/paiement-securise.png"
            alt="Paiement 100 % sécurisé, Visa, Mastercard et CB"
            width={900}
            height={435}
            className="w-full max-w-[150px] h-auto mx-auto"
          />
        </form>

        {/* ── Récapitulatif, réduit au strict nécessaire. Le client est
               ici pour payer, pas pour lire : le produit, le total, et la
               note du site sur une ligne. Rien d'autre. ── */}
        <aside className="order-first lg:order-last">
          <div className={`${bloc} lg:sticky lg:top-24`}>
            <div className="flex gap-3 items-center">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                <ProductVisual image={product.image} name={product.name} fit="contain" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-ink leading-snug">{product.name}</p>
                {lot && <p className="text-[13px] text-gray-500">{lot.poids}</p>}
              </div>
            </div>

            <div className="flex justify-between items-baseline border-t border-gray-100 mt-3 pt-3">
              <span className="text-[15px] font-bold text-ink">Total</span>
              <span className="text-xl font-bold text-ink">{formatPrice(montant)}</span>
            </div>
            <p className="text-[13px] text-brand-700 font-semibold text-right">Livraison offerte</p>

            <p className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100 text-[13px] text-gray-500">
              <span className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={11} className="fill-brand-500 text-brand-500" />
                ))}
              </span>
              {REVIEW_RATING}/5 · {REVIEW_COUNT} avis
            </p>
          </div>
        </aside>
      </div>
    </>
  )
}
