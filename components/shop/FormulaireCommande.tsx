'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Shield, Truck, AlertTriangle, Loader2, CreditCard, Star, Check } from 'lucide-react'
import type { Product, Lot } from '@/types/database'
import { formatPrice } from '@/lib/utils'
import { REVIEW_RATING, REVIEW_COUNT } from '@/lib/reviews'
import Image from 'next/image'
import ProductVisual from '@/components/shop/ProductVisual'
import { quantiteMaximum } from '@/lib/lots'
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
  /**
   * Canal de vente. « partenaire » : la commande vient d'un autre site qui
   * redirige ici ; elle est comptée à part, et la mesure Meta de
   * bois-tresor ne doit pas la ramasser, sinon les campagnes seraient
   * optimisées sur des ventes qui ne sont pas les siennes.
   */
  canal?: 'site' | 'partenaire'
  /** Canal partenaire : URL externe où renvoyer le client après l'achat. */
  redirectSucces?: string | null
}

export default function FormulaireCommande({ product, lot, montant, canal = 'site', redirectSucces = null }: Props) {
  const router = useRouter()
  const [etape, setEtape] = useState<Etape>('saisie')
  const [erreur, setErreur] = useState('')

  const [client, setClient] = useState({
    prenom: '', nom: '', email: '', telephone: '',
    adresse: '', complement: '', codePostal: '', ville: '', pays: 'FR',
  })
  /* Quantité : seuls les lots qui l’autorisent affichent le sélecteur,
     et le serveur reborne de toute façon ce qu’il reçoit. Le total reste
     indicatif ici : celui qui est débité vient du catalogue. */
  const maxQuantite = lot ? quantiteMaximum(lot) : (canal === 'partenaire' ? 10 : 1)
  const [quantite, setQuantite] = useState(1)
  const total = Math.round(montant * quantite * 100) / 100

  const [carte, setCarte] = useState({
    /* Mois et annee vides au depart, volontairement. Une date pre-remplie
       a l'air valide : le client ne la corrige pas, la banque refuse, et
       il n'a aucun moyen de comprendre pourquoi. */
    numero: '', mois: '', annee: '', cvv: '', titulaire: '',
  })

  /* Le champ qui bloque l'envoi. Il porte le message, s'entoure de rouge et
     recoit le curseur : le client reste la ou il travaille au lieu d'etre
     renvoye en haut de page. */
  const [champErreur, setChampErreur] = useState<{ id: string; message: string } | null>(null)

  function majClient(patch: Partial<typeof client>) {
    setChampErreur(null)
    setClient((c) => ({ ...c, ...patch }))
  }
  function majCarte(patch: Partial<typeof carte>) {
    setChampErreur(null)
    setCarte((c) => ({ ...c, ...patch }))
  }

  /**
   * Saisie du numero de carte.
   *
   * Le formatage par groupes de quatre replace le curseur a la fin a chaque
   * frappe si on n'y prend pas garde : corriger un chiffre au milieu devient
   * impossible. On compte donc la position en CHIFFRES avant le curseur, et
   * on la restitue apres reformatage.
   */
  function saisirNumero(e: React.ChangeEvent<HTMLInputElement>) {
    const el = e.target
    const avant = el.value.slice(0, el.selectionStart ?? el.value.length).replace(/\D/g, '').length
    const formate = el.value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim()
    majCarte({ numero: formate })
    requestAnimationFrame(() => {
      let pos = 0
      let vus = 0
      while (pos < formate.length && vus < avant) {
        if (/\d/.test(formate[pos])) vus++
        pos++
      }
      try { el.setSelectionRange(pos, pos) } catch { /* champ demonte */ }
    })
  }

  /* `InitiateCheckout` à l'arrivée sur l'écran. Une seule fois : en
     développement React monte, démonte puis remonte, et le garde-fou
     évite d'envoyer deux fois le même événement. */
  /**
   * L'adresse, gardée dès qu'elle est saisie.
   *
   * Sans cela, elle n'existe qu'au moment du clic sur Payer : tous ceux
   * qui remplissent le formulaire puis s'interrompent sont perdus, alors
   * qu'ils sont les plus chauds du site. Mesuré le 22/10/2026 : quinze
   * adresses tapées dans la journée, huit commandes créées.
   *
   * Une seule fois par adresse, sinon chaque passage dans le champ
   * créerait une ligne de plus et le client recevrait la relance en
   * double.
   */
  const emailGarde = useRef('')
  function garderEmail() {
    const adresse = client.email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(adresse) || emailGarde.current === adresse) return
    emailGarde.current = adresse
    void fetch('/api/leads/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adresse,
        telephone: client.telephone.trim() || null,
        produitSlug: product.slug,
        produitNom: product.name,
        lot: lot?.id ?? null,
        montant: total,
        sessionId: getSession().id || null,
      }),
    }).catch(() => { /* une relance perdue ne doit jamais gêner un achat */ })
  }

  /**
   * Le client revient de chez sa banque sans etre passe par la page de
   * retour, presque toujours par le bouton « precedent ».
   *
   * On lui dit ce qui s'est passe : soit son paiement a bien abouti et on
   * l'emmene au remerciement, soit il n'a pas ete debite et il peut
   * recommencer. Le silence est ce qui lui coute le plus cher.
   */
  const [retourBanque, setRetourBanque] = useState<string | null>(null)
  useEffect(() => {
    let id: string | null = null
    try {
      id = sessionStorage.getItem('bt_paiement')
      if (id) sessionStorage.removeItem('bt_paiement')
    } catch { /* navigation privee */ }
    if (!id) return

    void fetch(`/api/commande/etat/?c=${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j) return
        if (j.statut === 'payee') {
          window.location.replace(`/commande/merci/?ref=${encodeURIComponent(j.reference)}`)
          return
        }
        setRetourBanque('Votre paiement n’a pas été finalisé. Vous n’avez pas été débité, '
          + 'et votre commande n’est pas enregistrée. Vous pouvez recommencer ci-dessous.')
      })
      .catch(() => { /* un message manquant ne doit pas bloquer la page */ })
  }, [])

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
    if (canal === 'site') void attendreLePixel(2000).then(() => trackInitiateCheckout(product, montant))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Plus de cadre, donc plus de `postMessage` à écouter : la banque
     renvoie désormais la page entière sur `/commande/retour/`, qui
     confirme la commande elle-même. */

  function premierManquant(): { id: string; message: string } | null {
    const m = (id: string, message: string) => ({ id, message })
    if (client.prenom.trim().length < 2) return m('prenom', 'Indiquez votre prénom.')
    if (client.nom.trim().length < 2) return m('nom', 'Indiquez votre nom.')
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(client.email.trim())) return m('email', 'Cette adresse e-mail ne semble pas valide.')
    if (client.telephone.replace(/\D/g, '').length < 9) return m('telephone', 'Indiquez votre numéro de téléphone.')
    if (client.adresse.trim().length < 5) return m('adresse', 'Indiquez votre adresse de livraison.')
    if (client.codePostal.trim().length < 4) return m('cp', 'Indiquez votre code postal.')
    if (client.ville.trim().length < 2) return m('ville', 'Indiquez votre ville.')

    const brut = carte.numero.replace(/\D/g, '')
    if (brut.length < 13 || !luhn(brut)) return m('carte', 'Ce numéro de carte est incomplet ou comporte une erreur.')

    /* La date d'expiration, vérifiée ici et pas seulement chez la banque.
       Une date passée revient en « INVALID_VALUE », un message que
       personne ne peut comprendre. */
    if (!carte.mois || !carte.annee) return m('mois', 'Choisissez la date d’expiration inscrite sur la carte.')
    const finDeValidite = new Date(Number(carte.annee), Number(carte.mois), 0, 23, 59, 59)
    if (finDeValidite.getTime() < Date.now()) return m('mois', 'Cette date d’expiration est déjà passée.')

    /* Trois chiffres, jamais quatre. Le quatrième n'existe que sur
       American Express, que ce compte marchand n'accepte pas, et la banque
       refuse alors le paiement sans rien expliquer. */
    if (!/^\d{3}$/.test(carte.cvv)) return m('cvv', 'Le cryptogramme fait trois chiffres, au dos de la carte.')
    if (carte.titulaire.trim().length < 2) return m('titulaire', 'Indiquez le nom inscrit sur la carte.')
    return null
  }

  async function envoyer(e: React.FormEvent) {
    e.preventDefault()
    const manque = premierManquant()
    if (manque) {
      setErreur('')
      setChampErreur(manque)
      const el = document.getElementById(manque.id)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      /* Le curseur sans second défilement : `scrollIntoView` a déjà placé
         la page, `focus` la ferait sauter une seconde fois. */
      setTimeout(() => el?.focus({ preventScroll: true }), 350)
      return
    }
    setErreur('')
    setChampErreur(null)
    setEtape('envoi')
    /* `AddPaymentInfo` : coordonnées et carte saisies, le paiement part.
       Le pixel est chargé depuis longtemps à ce stade, l'attente se résout
       immédiatement. */
    if (canal === 'site') void attendreLePixel(1000).then(() => trackAddPaymentInfo(product, total))

    try {
      const r1 = await fetch('/api/commande/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produitSlug: product.slug,
          lot: lot?.id ?? null,
          quantite,
          canal,
          ...client,
          sessionId: getSession().id || null,
        }),
      })
      const j1 = await r1.json()
      if (!r1.ok || !j1.ok) throw new Error(j1.error ?? 'Commande impossible')

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
        /* ⚠️ Page entière, surtout pas un cadre.

           Mesuré sur deux jours de production : dans un cadre, les
           authentifications silencieuses échouaient six fois sur six, alors
           que celles où la banque interroge le client passaient cinq fois
           sur six. En 3-D Secure 2 la banque pose un cadre invisible pour
           prendre l'empreinte du navigateur ; imbriqué dans le nôtre et en
           domaines croisés, Safari lui bloque le stockage, l'empreinte
           n'arrive jamais, et la banque déclare l'expiration.

           En pleine page, la banque travaille dans un contexte normal.
           L'identifiant de commande voyage dans `returnUrl`, donc rien n'a
           besoin de survivre en mémoire pendant l'aller-retour. */
        setEtape('3ds')
        /* Trace du passage chez la banque. Le client qui revient par le
           bouton « precedent » retomberait sinon sur un formulaire vide,
           sans un mot, et repartirait en croyant avoir paye. */
        try { sessionStorage.setItem('bt_paiement', j1.commandeId) } catch { /* navigation privee */ }
        window.location.href = j2.redirection
        return
      }

      setEtape('confirmation')
      await confirmer(j1.commandeId)
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
      if (canal === 'partenaire' && redirectSucces) {
        const sep = redirectSucces.includes('?') ? '&' : '?'
        window.location.replace(`${redirectSucces}${sep}ref=${encodeURIComponent(j.reference)}`)
        return
      }
      const merci = canal === 'partenaire' ? '/commande/partenaire/merci' : '/commande/merci'
      router.replace(`${merci}/?ref=${encodeURIComponent(j.reference)}`)
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
  /* Le champ en faute passe en rouge, les autres ne bougent pas. */
  const classeChamp = (id: string) =>
    champErreur?.id === id
      ? champ.replace('border-gray-300', 'border-red-500') + ' ring-2 ring-red-200'
      : champ

  /* ── Le temps que la banque prenne la main ── */
  if (etape === '3ds') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl p-10 text-center shadow-sm border border-gray-100">
        <Loader2 size={36} className="animate-spin text-brand-600 mx-auto mb-4" />
        <p className="text-[17px] font-medium text-ink">Nous vous mettons en relation avec votre banque…</p>
        <p className="text-[15px] text-gray-600 mt-2">
          Elle va vous demander de confirmer le paiement. Gardez votre téléphone à portée de main.
        </p>
        <p className="flex items-center justify-center gap-1.5 text-[13px] text-gray-500 mt-4">
          <Shield size={14} className="text-brand-600" /> Ne fermez pas cette page.
        </p>
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
          {/* Le message suit le client au lieu de l'attendre en haut de
              page : sur téléphone, il est toujours sous les yeux. */}
          {champErreur && (
            <div className="fixed inset-x-3 bottom-3 z-40 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[420px]">
              <p className="flex items-start gap-2.5 rounded-lg bg-red-600 px-4 py-3 text-[15px] font-medium text-white shadow-lg">
                <AlertTriangle size={19} className="flex-shrink-0 mt-0.5" />
                {champErreur.message}
              </p>
            </div>
          )}

          {retourBanque && (
            <p className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-[15px] text-amber-900">
              <AlertTriangle size={19} className="flex-shrink-0 mt-0.5" />
              {retourBanque}
            </p>
          )}

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
                <input id="prenom" autoComplete="given-name" className={classeChamp('prenom')}
                  value={client.prenom} onChange={(e) => majClient({ prenom: e.target.value })} />
              </div>
              <div>
                <label htmlFor="nom" className={etiquette}>Nom *</label>
                <input id="nom" autoComplete="family-name" className={classeChamp('nom')}
                  value={client.nom} onChange={(e) => majClient({ nom: e.target.value })} />
              </div>
            </div>
            <div className="mb-3">
              <label htmlFor="email" className={etiquette}>E-mail *</label>
              <input id="email" type="email" inputMode="email" autoComplete="email" onBlur={garderEmail} className={classeChamp('email')}
                value={client.email} onChange={(e) => majClient({ email: e.target.value })} />
              <p className="text-[13px] text-gray-500 mt-1.5">Pour votre confirmation et le suivi de livraison.</p>
            </div>
            <div>
              <label htmlFor="telephone" className={etiquette}>Téléphone *</label>
              <input id="telephone" type="tel" inputMode="tel" autoComplete="tel" className={classeChamp('telephone')}
                placeholder="06 12 34 56 78"
                value={client.telephone} onChange={(e) => majClient({ telephone: e.target.value })} />
              <p className="text-[13px] text-gray-500 mt-1.5">Le transporteur vous appelle avant de passer.</p>
            </div>
          </section>

          <section className={bloc}>
            <h2 className={titre}>Adresse de livraison</h2>
            <div className="mb-3">
              <label htmlFor="adresse" className={etiquette}>Adresse *</label>
              <input id="adresse" autoComplete="street-address" className={classeChamp('adresse')}
                placeholder="12 route des Chênes"
                value={client.adresse} onChange={(e) => majClient({ adresse: e.target.value })} />
            </div>
            <div className="mb-3">
              <label htmlFor="complement" className={etiquette}>
                Complément <span className="font-normal text-gray-400">(facultatif)</span>
              </label>
              <input id="complement" className={classeChamp('complement')} placeholder="Lieu-dit, bâtiment, code du portail"
                value={client.complement} onChange={(e) => majClient({ complement: e.target.value })} />
            </div>
            <div className="grid grid-cols-5 gap-3 mb-3">
              <div className="col-span-2">
                <label htmlFor="cp" className={etiquette}>Code postal *</label>
                <input id="cp" inputMode="numeric" autoComplete="postal-code" className={classeChamp('cp')}
                  placeholder="39000"
                  value={client.codePostal} onChange={(e) => majClient({ codePostal: e.target.value })} />
              </div>
              <div className="col-span-3">
                <label htmlFor="ville" className={etiquette}>Ville *</label>
                <input id="ville" autoComplete="address-level2" className={classeChamp('ville')}
                  value={client.ville} onChange={(e) => majClient({ ville: e.target.value })} />
              </div>
            </div>
            <div>
              <label htmlFor="pays" className={etiquette}>Pays *</label>
              <select id="pays" className={`${classeChamp('pays')} bg-white`}
                value={client.pays} onChange={(e) => majClient({ pays: e.target.value })}>
                {PAYS.map((p) => <option key={p.code} value={p.code}>{p.nom}</option>)}
              </select>
            </div>
          </section>

          <section className={`${bloc} ring-2 ring-brand-100`}>
            <h2 className={`${titre} flex items-center gap-2`}>
              <CreditCard size={18} className="text-brand-600" /> Votre carte bancaire
            </h2>
            {/* Au-dessus des champs, pas sous le bouton. C'est ici que le
                client hésite, donc ici qu'il faut répondre à sa question. */}
            <p className="flex items-start gap-2 text-[13px] text-gray-600 -mt-1 mb-3">
              <Lock size={14} className="text-brand-600 flex-shrink-0 mt-0.5" />
              Paiement encaissé par le Crédit Agricole. Votre numéro de carte n’est pas conservé par notre site.
            </p>
            <div className="mb-3">
              <label htmlFor="carte" className={etiquette}>Numéro de carte *</label>
              <input id="carte" inputMode="numeric" autoComplete="cc-number" className={`${classeChamp('carte')} font-mono tracking-wide`}
                placeholder="0000 0000 0000 0000"
                value={carte.numero}
                onChange={saisirNumero} />
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label htmlFor="mois" className={etiquette}>Mois *</label>
                <select id="mois" autoComplete="cc-exp-month" className={`${classeChamp('mois')} bg-white`}
                  value={carte.mois} onChange={(e) => majCarte({ mois: e.target.value })}>
                  <option value="">--</option>
                  {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="annee" className={etiquette}>Année *</label>
                <select id="annee" autoComplete="cc-exp-year" className={`${classeChamp('annee')} bg-white`}
                  value={carte.annee} onChange={(e) => majCarte({ annee: e.target.value })}>
                  <option value="">----</option>
                  {Array.from({ length: 12 }, (_, i) => String(new Date().getFullYear() + i)).map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="cvv" className={etiquette}>Crypto. *</label>
                <input id="cvv" inputMode="numeric" autoComplete="cc-csc" className={`${classeChamp('cvv')} font-mono`}
                  placeholder="123"
                  value={carte.cvv}
                  onChange={(e) => majCarte({ cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })} />
              </div>
            </div>
            <div>
              <label htmlFor="titulaire" className={etiquette}>Nom inscrit sur la carte *</label>
              <input id="titulaire" autoComplete="cc-name" className={classeChamp('titulaire')} placeholder="JEAN DUPONT"
                value={carte.titulaire} onChange={(e) => majCarte({ titulaire: e.target.value })} />
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
            Payer {formatPrice(total)}
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

            {maxQuantite > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 mt-3 pt-3">
                <span className="text-[14px] font-bold text-ink">Quantité</span>
                <div className="inline-flex items-center rounded-lg border border-gray-300 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantite((q) => Math.max(1, q - 1))}
                    disabled={quantite <= 1}
                    aria-label="Retirer une palette"
                    className="px-3 py-1 text-xl leading-none text-gray-700 hover:bg-gray-50 disabled:text-gray-300 disabled:hover:bg-white"
                  >
                    &minus;
                  </button>
                  <span className="px-3 text-[15px] font-bold text-ink tabular-nums">{quantite}</span>
                  <button
                    type="button"
                    onClick={() => setQuantite((q) => Math.min(maxQuantite, q + 1))}
                    disabled={quantite >= maxQuantite}
                    aria-label="Ajouter une palette"
                    className="px-3 py-1 text-xl leading-none text-gray-700 hover:bg-gray-50 disabled:text-gray-300 disabled:hover:bg-white"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-baseline border-t border-gray-100 mt-3 pt-3">
              <span className="text-[15px] font-bold text-ink">Total</span>
              <span className="text-xl font-bold text-ink">{formatPrice(total)}</span>
            </div>
            {quantite > 1 && (
              <p className="text-[13px] text-gray-500 text-right">
                {quantite} × {formatPrice(montant)}
              </p>
            )}
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
