'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Shield, Truck, AlertTriangle, Loader2, CreditCard, Star, Mail, Check } from 'lucide-react'
import type { Product, Lot } from '@/types/database'
import { formatPrice } from '@/lib/utils'
import { SIRET, SHIPPING_ZONE, CONTACT_EMAIL } from '@/lib/site'
import { REVIEW_RATING, REVIEW_COUNT, TESTIMONIALS } from '@/lib/reviews'
import ProductVisual from '@/components/shop/ProductVisual'
import { getSession } from '@/lib/analytics/track'

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

  const champ = 'w-full rounded-lg border border-gray-300 px-3.5 py-3 text-[16px] text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
  const etiquette = 'block text-[14px] font-medium text-gray-700 mb-1.5'
  const bloc = 'bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-gray-100'

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
    { icon: Truck, titre: 'Livraison offerte', detail: 'Sans minimum' },
    { icon: Lock, titre: 'Paiement sécurisé', detail: '3-D Secure' },
    { icon: Shield, titre: 'Entreprise française', detail: `SIRET ${SIRET.slice(0, 11)}` },
  ]

  return (
    <>
      {/* ── Barre de progression ── */}
      <div className="flex items-center justify-center gap-2 mb-7">
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

      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink mb-1.5">Finaliser ma commande</h1>
      <p className="text-sm text-gray-500 mb-7">
        Commande sécurisée. Livraison offerte, {SHIPPING_ZONE}.
      </p>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        {/* ── Le formulaire ── */}
        <form onSubmit={envoyer} className="lg:col-span-2 space-y-5 order-last lg:order-first">
          {erreur && (
            <p className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[15px] text-red-800">
              <AlertTriangle size={19} className="flex-shrink-0 mt-0.5" />
              {erreur}
            </p>
          )}

          <section className={bloc}>
            <h2 className="font-semibold text-ink mb-4">Vos coordonnées</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
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
            <div className="mb-4">
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
            <h2 className="font-semibold text-ink mb-4">Adresse de livraison</h2>
            <div className="mb-4">
              <label htmlFor="adresse" className={etiquette}>Adresse *</label>
              <input id="adresse" autoComplete="street-address" className={champ}
                placeholder="12 route des Chênes"
                value={client.adresse} onChange={(e) => setClient({ ...client, adresse: e.target.value })} />
            </div>
            <div className="mb-4">
              <label htmlFor="complement" className={etiquette}>
                Complément <span className="font-normal text-gray-400">(facultatif)</span>
              </label>
              <input id="complement" className={champ} placeholder="Lieu-dit, bâtiment, code du portail"
                value={client.complement} onChange={(e) => setClient({ ...client, complement: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label htmlFor="cp" className={etiquette}>Code postal *</label>
                <input id="cp" inputMode="numeric" autoComplete="postal-code" className={champ}
                  placeholder="39000"
                  value={client.codePostal} onChange={(e) => setClient({ ...client, codePostal: e.target.value })} />
              </div>
              <div className="col-span-2">
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
            <h2 className="font-semibold text-ink mb-4 flex items-center gap-2">
              <CreditCard size={19} className="text-brand-600" /> Votre carte bancaire
            </h2>
            <div className="mb-4">
              <label htmlFor="carte" className={etiquette}>Numéro de carte *</label>
              <input id="carte" inputMode="numeric" autoComplete="cc-number" className={`${champ} font-mono tracking-wide`}
                placeholder="0000 0000 0000 0000"
                value={carte.numero}
                onChange={(e) => setCarte({ ...carte, numero: e.target.value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim() })} />
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
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

          {/* ── Garanties, chiffres réels du site ── */}
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
            <div className="grid grid-cols-3 gap-3 text-center text-xs text-brand-800">
              {GARANTIES.map(({ icon: Icon, titre, detail }) => (
                <div key={titre} className="flex flex-col items-center gap-1">
                  <Icon size={18} className="text-brand-600" />
                  <span className="font-semibold leading-tight">{titre}</span>
                  <span className="text-brand-700">{detail}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-brand-600 hover:bg-brand-700 text-white py-4 rounded-lg font-bold text-[17px] flex items-center justify-center gap-2.5 transition-colors shadow-sm"
          >
            <Lock size={19} />
            Payer {formatPrice(montant)}
          </button>

          <div className="flex items-center justify-center gap-2.5 flex-wrap pt-0.5">
            <span className="text-xs text-gray-400">Paiement sécurisé :</span>
            {['Visa', 'Mastercard', 'CB', '3-D Secure'].map((l) => (
              <span key={l} className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded border border-gray-200 tracking-wide">
                {l}
              </span>
            ))}
          </div>
        </form>

        {/* ── Récapitulatif. En tête sur téléphone : on doit voir ce qu'on
               achète avant de remplir dix champs. ── */}
        <aside className="space-y-4 order-first lg:order-last">
          <div className={`${bloc} lg:sticky lg:top-24`}>
            <h2 className="font-serif text-lg font-semibold text-ink mb-4">Récapitulatif</h2>

            <div className="flex gap-3 mb-4">
              <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                <ProductVisual image={product.image} name={product.name} fit="contain" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink leading-snug">{product.name}</p>
                {lot && <p className="text-xs text-gray-500 mt-0.5">{lot.poids}</p>}
              </div>
              <span className="text-sm font-semibold flex-shrink-0">{formatPrice(montant)}</span>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Sous-total</span>
                <span>{formatPrice(montant)}</span>
              </div>
              <div className="flex justify-between">
                <span>Livraison</span>
                <span className="text-brand-700 font-semibold">Offerte</span>
              </div>
              <div className="flex justify-between font-bold text-base text-ink pt-2 border-t border-gray-100">
                <span>Total TTC</span>
                <span>{formatPrice(montant)}</span>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {[
                { icon: Truck, texte: `Livraison offerte, ${SHIPPING_ZONE}` },
                { icon: Shield, texte: 'Entreprise familiale française, SIRET vérifiable' },
                { icon: Mail, texte: 'Nous répondons nous-mêmes à vos messages' },
              ].map(({ icon: Icon, texte }) => (
                <p key={texte} className="flex items-start gap-2 text-xs text-gray-500">
                  <Icon size={13} className="text-brand-600 flex-shrink-0 mt-0.5" />
                  {texte}
                </p>
              ))}
            </div>

            {/* Note du site, pas d'une plateforme tierce. */}
            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-2">
              <span className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={12} className="fill-brand-500 text-brand-500" />
                ))}
              </span>
              <span className="text-xs text-gray-500 font-medium">
                {REVIEW_RATING}/5 · {REVIEW_COUNT} avis
              </span>
            </div>
          </div>

          {/* Avis réels du site, jamais inventés. */}
          <div className={`${bloc} space-y-4 hidden lg:block`}>
            <h3 className="text-sm font-semibold text-ink">Ce que disent nos clients</h3>
            {TESTIMONIALS.slice(0, 2).map((a) => (
              <div key={a.name} className="border-t border-gray-100 pt-3 first:border-t-0 first:pt-0">
                <span className="flex gap-0.5 mb-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={10} className="fill-brand-500 text-brand-500" />
                  ))}
                </span>
                <p className="text-xs text-gray-600 leading-relaxed italic">« {a.text} »</p>
                <p className="text-xs font-semibold text-gray-700 mt-1">— {a.name}</p>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-gray-400 leading-relaxed px-1">
            Bois Tresor, entreprise familiale française. SIRET {SIRET}. Une question :{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline">{CONTACT_EMAIL}</a>.
          </p>
        </aside>
      </div>
    </>
  )
}
