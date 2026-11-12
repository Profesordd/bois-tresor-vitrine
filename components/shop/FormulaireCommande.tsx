'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Loader2 } from 'lucide-react'
import CheckoutDesign from '@/components/shop/CheckoutDesign'
import type { Product, Lot } from '@/types/database'
import { SHIPPING_LABEL } from '@/lib/site'
import { quantiteMaximum } from '@/lib/lots'
import { getSession } from '@/lib/analytics/track'
import { trackInitiateCheckout, trackAddPaymentInfo, attendreLePixel } from '@/lib/analytics/meta'
import { chargerPixelBurban, attendreBurban, trackBurban, produitBurban } from '@/lib/analytics/burban'

// Présentation partagée ; la logique de commande, de paiement et de suivi reste propre au canal.
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
  const maxQuantite = lot ? quantiteMaximum(lot) : (product.quantiteMax ?? (canal === 'partenaire' ? 10 : 1))
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
    /* Jamais sur le canal partenaire : ce checkout n'est pas le nôtre, son
       client ne doit pas entrer dans la séquence de relance de bois-tresor. */
    if (canal !== 'site') return
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
        setRetourBanque('Le paiement de votre commande n’est pas confirmé. Vérifiez son état dans votre application bancaire avant de recommencer. En cas de doute, contactez votre vendeur avec votre référence.')
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
    if (canal === 'site') {
      void attendreLePixel(2000).then(() => trackInitiateCheckout(product, montant))
    } else {
      /* Canal partenaire : son pixel à lui, chargé ici et nulle part
         ailleurs. Rien ne part vers le pixel de bois-tresor. */
      chargerPixelBurban()
      void attendreBurban(2000).then(() => trackBurban('InitiateCheckout', produitBurban(product.slug, product.name, total)))
    }
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
    if (canal === 'site') {
      void attendreLePixel(1000).then(() => trackAddPaymentInfo(product, total))
    } else {
      void attendreBurban(1000).then(() => trackBurban('AddPaymentInfo', produitBurban(product.slug, product.name, total)))
    }

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
          /* Empreinte du navigateur. Java et JavaScript sont distincts ;
             le serveur indique aussi que JavaScript est actif sur ce formulaire.
             Le décalage conserve le signe natif, comme le plugin CAWL. */
          navigateur: {
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            colorDepth: window.screen.colorDepth,
            javaEnabled: typeof navigator.javaEnabled === 'function' ? navigator.javaEnabled() : false,
            userAgent: navigator.userAgent,
            timezoneOffsetUtcMinutes: new Date().getTimezoneOffset(),
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
      if (j.canal !== canal) throw new Error('Le canal de cette commande ne correspond pas à ce checkout.')
      if (canal === 'partenaire') {
        /* Purchase vers le seul pixel Burban (cas sans 3-D Secure). */
        await attendreBurban(1500)
        trackBurban(
          'Purchase',
          { ...produitBurban(product.slug, product.name, j.montantEur ?? total), order_id: j.reference },
          commandeId,
        )
        const cible = redirectSucces
          ? `${redirectSucces}${redirectSucces.includes('?') ? '&' : '?'}ref=${encodeURIComponent(j.reference)}`
          : `/commande/partenaire/merci/?ref=${encodeURIComponent(j.reference)}`
        window.setTimeout(() => window.location.replace(cible), 600)
        return
      }
      /* Ici, uniquement le canal du site : le partenaire est déjà reparti. */
      router.replace(`/commande/merci/?ref=${encodeURIComponent(j.reference)}`)
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Paiement non confirmé')
      setEtape('erreur')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

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

  return <CheckoutDesign
    nom={product.name} image={product.image}
    detail={lot?.poids} montant={montant} total={total} livraison={SHIPPING_LABEL}
    partenaire={canal === 'partenaire'} logoHref={canal === 'partenaire' ? '#' : '/'} pays={PAYS}
    quantite={quantite} maxQuantite={maxQuantite} setQuantite={setQuantite}
    client={client} carte={carte} majClient={majClient} majCarte={majCarte}
    saisirNumero={saisirNumero} envoyer={envoyer} erreur={erreur} champErreur={champErreur}
    retourBanque={retourBanque} onEmailBlur={garderEmail}
  />
}
