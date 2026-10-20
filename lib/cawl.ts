import { createHmac } from 'crypto'

/**
 * CAWL, le module de paiement du Crédit Agricole, bâti sur Worldline.
 *
 * Cette version est calquée sur le plugin officiel WooCommerce 2.5.32,
 * fichier par fichier, et non plus sur le portage Next.js d'un autre site.
 * La version précédente est conservée dans `lib/cawl-archive/`.
 *
 * ⚠️ POURQUOI CETTE RÉÉCRITURE. Le premier paiement réel a échoué sur
 * « Authentication failed », c'est-à-dire un refus à l'authentification
 * 3-D Secure et non un refus de la carte. La demande que nous envoyions
 * était presque nue : ni nom du porteur, ni e-mail, ni téléphone, ni
 * adresse de facturation. Le plugin officiel transmet tout cela, et les
 * banques s'en servent pour décider. Une demande sans ces éléments est
 * refusée par la plupart des banques françaises.
 *
 * Correspondance avec le plugin, pour qui voudra vérifier :
 *   WcOrderBasedOrderFactory::create          → objet `order`
 *   wc-order-to-wlop-order.php (Customer)     → `order.customer`
 *   wc-order-to-wlop-order.php (Shipping)     → `order.shipping`
 *   CardThreeDSecureFactory::create           → `threeDSecure`
 *
 * ⚠️ DEUX PLATEFORMES, DEUX JEUX DE CLÉS.
 *   préprod : https://payment.preprod.cawl-solutions.fr  (cartes de test)
 *   réel    : https://payment.cawl-solutions.fr          (vrais débits)
 * Une clé de production employée sur la préprod est refusée ; l'inverse
 * débite vraiment.
 *
 * Authentification « GCS v1HMAC » : signature HMAC-SHA256 d'une chaîne
 * faite de la méthode, du type de contenu, de la date, des en-têtes X-GCS
 * en minuscules et triés, puis du chemin complet, chacun suivi d'un retour
 * à la ligne.
 */

const API_URL    = (process.env.CAWL_API_URL ?? 'https://payment.preprod.cawl-solutions.fr').replace(/\/$/, '')
const MERCHANT   = process.env.CAWL_MERCHANT_ID ?? ''
const API_KEY    = process.env.CAWL_API_KEY ?? ''
const SECRET_KEY = process.env.CAWL_SECRET_KEY ?? ''
const INTEGRATOR = process.env.CAWL_COMPANY_NAME ?? 'BoisTresor'

const LOCALE = 'fr_FR'
/* Repris tel quel du plugin : c'est l'en-tête qu'un navigateur annonce, et
   la banque le compare à ce qu'elle voit. */
const ACCEPT_PAR_DEFAUT = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'

export function cawlConfigure(): boolean {
  return Boolean(MERCHANT && API_KEY && SECRET_KEY)
}

export function cawlEnvironnement(): { url: string; reel: boolean } {
  return { url: API_URL, reel: !API_URL.includes('preprod') }
}

function metaInfo(): string {
  return Buffer.from(JSON.stringify({
    platformIdentifier: `Node.js/${process.version}`,
    sdkIdentifier:      'NodeServerSDK/v1.0.0',
    sdkCreator:         'OnlinePayments',
    integrator:         INTEGRATOR,
  })).toString('base64')
}

function signature(method: string, entetes: Record<string, string>, chemin: string): string {
  let aSigner = method.toUpperCase() + '\n'
  aSigner += (entetes['Content-Type'] ?? '') + '\n'
  aSigner += (entetes['Date'] ?? '') + '\n'

  const gcs = Object.entries(entetes)
    .filter(([k]) => /^X-GCS/i.test(k))
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  for (const [k, v] of gcs) {
    aSigner += k.toLowerCase() + ':' + v.replace(/\r?\n\s*/g, ' ').trim() + '\n'
  }

  aSigner += chemin + '\n'
  return `GCS v1HMAC:${API_KEY}:${createHmac('sha256', SECRET_KEY).update(aSigner).digest('base64')}`
}

const MAX_RETENTATIVES_409 = 3

async function appel<T>(method: string, chemin: string, corps?: unknown, cleIdempotence?: string): Promise<T> {
  const cheminComplet = `/v2/${MERCHANT}${chemin}`
  const entetes: Record<string, string> = {
    Date: new Date().toUTCString(),
    'X-GCS-ServerMetaInfo': metaInfo(),
  }
  if (corps) entetes['Content-Type'] = 'application/json'
  if (cleIdempotence) entetes['X-GCS-Idempotence-Key'] = cleIdempotence.slice(0, 40)
  entetes.Authorization = signature(method, entetes, cheminComplet)

  for (let essai = 0; ; essai++) {
    const reponse = await fetch(API_URL + cheminComplet, {
      method,
      headers: entetes,
      body: corps ? JSON.stringify(corps) : undefined,
    })
    const json = await reponse.json().catch(() => ({}))

    if (reponse.status === 409 && essai < MAX_RETENTATIVES_409) {
      await new Promise((r) => setTimeout(r, 1000))
      continue
    }

    if (!reponse.ok) {
      const e = json?.errors?.[0]
      const message = e?.message ?? e?.code ?? json?.errorId ?? `CAWL ${reponse.status}`
      /* Le code et l'identifiant sont ce que le support CAWL demande pour
         retrouver la transaction. On les garde dans le message. */
      throw new Error(`${message}${e?.code ? ` [${e.code}]` : ''} (réf. ${json?.errorId ?? reponse.status})`)
    }
    return json as T
  }
}

/* ── Types ─────────────────────────────────────────────── */

export interface ReponsePaiement {
  payment: {
    id: string
    status: string
    paymentOutput?: { amountOfMoney?: { amount: number; currencyCode: string } }
  }
  merchantAction?: {
    actionType: string | null
    redirectData?: { redirectURL: string }
  } | null
}

/**
 * Empreinte du navigateur, telle que le plugin la recueille.
 *
 * ⚠️ `screenHeight`, `screenWidth` et `timezoneOffsetUtcMinutes` partent en
 * CHAÎNES de caractères : c'est ce que fait le plugin (`(string)` dans
 * `wc-order-to-wlop-order.php`), et l'API les refuse en nombres.
 */
export interface InfosNavigateur {
  screenWidth: number
  screenHeight: number
  colorDepth: number
  javaEnabled: boolean
  userAgent: string
  acceptHeader?: string
  timezoneOffsetUtcMinutes: number
}

/** Les coordonnées du client. C'est ce qui manquait et faisait échouer le 3-D Secure. */
export interface ClientPaiement {
  prenom: string
  nom: string
  email: string
  telephone: string
  adresse: string
  complement?: string | null
  codePostal: string
  ville: string
  pays: string
}

export interface Paiement {
  montantCents: number
  /** Référence de commande, transmise à CAWL et visible dans leur back-office. */
  reference?: string
  numeroCarte: string
  moisExpiration: string
  anneeExpiration: string
  cvv: string
  titulaire: string
  produitId: number
  returnUrl: string
  /**
   * Coordonnées du client. Absentes, on n'envoie que l'appareil, comme la
   * version d'avant : c'est le cas du banc d'essai, qui n'a pas de
   * commande derrière lui. Pour un vrai paiement elles sont obligatoires,
   * c'est leur absence qui faisait refuser l'authentification.
   */
  client?: ClientPaiement
  navigateur?: InfosNavigateur
  ipClient?: string
  cleIdempotence?: string
  /**
   * `SALE` autorise et encaisse en une fois : c'est le réglage par défaut
   * du plugin officiel, et il n'y a alors rien à capturer ensuite.
   * `FINAL_AUTHORIZATION` autorise seulement.
   */
  modeAutorisation?: 'SALE' | 'FINAL_AUTHORIZATION'
}

export const MODES_AUTORISATION = ['SALE', 'FINAL_AUTHORIZATION'] as const

/**
 * Identifiant du moyen de paiement, déduit des premiers chiffres.
 *
 * L'ordre compte : une carte CB co-badgée Visa commence par 4 et doit
 * partir en Visa. Les préfixes CB se limitent à 50, 56, 58 et 67 ; en
 * ajouter fait refuser des cartes valides.
 */
export function produitCawl(numeroCarte: string): number | null {
  const bin = numeroCarte.replace(/\D/g, '').slice(0, 8)
  if (/^4/.test(bin)) return 1
  if (/^5[1-5]/.test(bin) || /^2(2[2-9]\d|[3-6]\d{2}|7[01]\d|720)/.test(bin)) return 3
  if (/^(50|56|58|67)/.test(bin)) return 130
  return null
}

function sansVide<T extends Record<string, unknown>>(o: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ) as Partial<T>
}

/* ── Opérations ────────────────────────────────────────── */

export async function creerPaiement(p: Paiement): Promise<ReponsePaiement> {
  const n = p.navigateur
  const c = p.client

  /* `order.customer`, calqué sur le transformateur du plugin. Chaque champ
     y est posé seulement s'il est renseigné, d'où le filtrage. */
  const adresseFacturation = c
    ? sansVide({
        countryCode: c.pays,
        city: c.ville,
        zip: c.codePostal,
        street: c.adresse,
        additionalInfo: c.complement ?? undefined,
      })
    : null

  const customer = {
    locale: LOCALE,
    ...(c
      ? {
          personalInformation: { name: { firstName: c.prenom, surname: c.nom } },
          contactDetails: sansVide({ emailAddress: c.email, phoneNumber: c.telephone }),
          billingAddress: adresseFacturation,
        }
      : {}),
    device: sansVide({
      locale: LOCALE,
      acceptHeader: n?.acceptHeader ?? ACCEPT_PAR_DEFAUT,
      ipAddress: p.ipClient,
      userAgent: n?.userAgent,
      timezoneOffsetUtcMinutes: n ? String(n.timezoneOffsetUtcMinutes) : undefined,
      browserData: n
        ? {
            screenHeight: String(n.screenHeight),
            screenWidth: String(n.screenWidth),
            colorDepth: n.colorDepth,
            javaEnabled: n.javaEnabled,
          }
        : undefined,
    }),
  }

  return appel<ReponsePaiement>('POST', '/payments', {
    order: {
      amountOfMoney: { currencyCode: 'EUR', amount: p.montantCents },
      ...(p.reference ? { references: { merchantReference: p.reference } } : {}),
      customer,
      /* La livraison, que le plugin envoie aussi. Même adresse chez nous :
         le checkout n'en demande qu'une. */
      ...(c && adresseFacturation
        ? {
            shipping: {
              emailAddress: c.email,
              address: { ...adresseFacturation, name: { firstName: c.prenom, surname: c.nom } },
            },
          }
        : {}),
    },
    cardPaymentMethodSpecificInput: {
      card: {
        cardNumber: p.numeroCarte.replace(/\s/g, ''),
        expiryDate: `${p.moisExpiration}${p.anneeExpiration.slice(-2)}`,
        cvv: p.cvv,
        cardholderName: p.titulaire,
      },
      paymentProductId: p.produitId,
      authorizationMode: p.modeAutorisation ?? 'SALE',
      transactionChannel: 'ECOMMERCE',
      returnUrl: p.returnUrl,
      /* Dans son cas par défaut, le plugin ne pose QUE l'adresse de retour :
         ni `skipAuthentication`, ni `challengeIndicator`. Laisser la banque
         décider donne plus d'authentifications réussies que d'imposer un
         comportement. Voir CardThreeDSecureFactory::create. */
      threeDSecure: { redirectionData: { returnUrl: p.returnUrl } },
    },
  }, p.cleIdempotence)
}

export async function lirePaiement(id: string): Promise<{ id: string; statut: string; montantCents: number }> {
  const d = await appel<{ id: string; status: string; paymentOutput?: { amountOfMoney?: { amount: number } } }>(
    'GET', `/payments/${id}`
  )
  return { id: d.id, statut: d.status, montantCents: d.paymentOutput?.amountOfMoney?.amount ?? 0 }
}

/** Statuts de refus. Il n'existe pas de statut « FAILED » chez CAWL. */
export const STATUTS_REFUS = ['REJECTED', 'REJECTED_CAPTURE', 'CANCELLED', 'CREATED', 'REDIRECTED']

/** En mode SALE, le paiement est déjà encaissé : plus rien à capturer. */
export const STATUTS_DEJA_ENCAISSES = ['CAPTURED', 'CAPTURE_REQUESTED', 'PAID']

export async function capturerPaiement(id: string, montantCents: number): Promise<boolean> {
  try {
    const r = await appel<{ status?: string; captureOutput?: { acquiredAmount?: { amount: number } } }>(
      'POST', `/payments/${id}/capture`, { amount: montantCents, isFinal: true }
    )
    return (r.captureOutput?.acquiredAmount?.amount ?? 0) === montantCents
      || r.status === 'CAPTURE_REQUESTED'
      || r.status === 'CAPTURED'
  } catch (err) {
    /* ACTION_NOT_ALLOWED : compte en capture automatique, déjà encaissé. */
    if (err instanceof Error && err.message.includes('ACTION_NOT_ALLOWED')) return true
    throw err
  }
}
