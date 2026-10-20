import { createHmac } from 'crypto'

/**
 * CAWL, le module de paiement du Crédit Agricole, bâti sur Worldline.
 *
 * Banc d'essai uniquement pour l'instant : rien de tout ceci n'est branché
 * sur le parcours d'achat, qui passe toujours par le prestataire externe.
 * L'accès se fait par /admin/paiement-cawl/, invisible des clients.
 *
 * ⚠️ DEUX ENVIRONNEMENTS, DEUX JEUX DE CLÉS.
 *   préprod : https://payment.preprod.cawl-solutions.fr  (cartes de test)
 *   réel    : https://payment.cawl-solutions.fr          (vrais débits)
 * `CAWL_API_URL` pointe sur la préprod par défaut. Une clé réelle utilisée
 * sur la préprod échoue à l'authentification ; l'inverse débite vraiment.
 *
 * Authentification « GCS v1HMAC » : signature HMAC-SHA256 d'une chaîne
 * reconstituée à partir de la méthode, du type de contenu, de la date, des
 * en-têtes X-GCS triés, et du chemin complet. Chaque élément compte, y
 * compris les retours à la ligne.
 */

const API_URL    = (process.env.CAWL_API_URL ?? 'https://payment.preprod.cawl-solutions.fr').replace(/\/$/, '')
const MERCHANT   = process.env.CAWL_MERCHANT_ID ?? ''
const API_KEY    = process.env.CAWL_API_KEY ?? ''
const SECRET_KEY = process.env.CAWL_SECRET_KEY ?? ''
const INTEGRATOR = process.env.CAWL_COMPANY_NAME ?? 'BoisTresor'

export function cawlConfigure(): boolean {
  return Boolean(MERCHANT && API_KEY && SECRET_KEY)
}

/** Environnement visé, pour l'afficher sans ambiguïté dans l'administration. */
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

  /* Les en-têtes X-GCS entrent dans la signature, en minuscules et triés.
     Un tri différent et la signature est refusée sans explication. */
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

    /* 409 : une requête idempotente identique est encore en cours chez
       CAWL. On patiente plutôt que de la déclarer en échec. */
    if (reponse.status === 409 && essai < MAX_RETENTATIVES_409) {
      await new Promise((r) => setTimeout(r, 1000))
      continue
    }

    if (!reponse.ok) {
      const message = json?.errors?.[0]?.message ?? json?.errors?.[0]?.code ?? json?.errorId ?? `CAWL ${reponse.status}`
      throw new Error(`${message} (réf. ${json?.errorId ?? reponse.status})`)
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

export interface InfosNavigateur {
  screenWidth: number
  screenHeight: number
  colorDepth: number
  userAgent: string
  language: string
  timezoneOffsetUtcMinutes: number
}

export interface Paiement {
  montantCents: number
  numeroCarte: string
  moisExpiration: string
  anneeExpiration: string
  cvv: string
  titulaire: string
  produitId: number
  returnUrl: string
  navigateur?: InfosNavigateur
  ipClient?: string
  cleIdempotence?: string
  /**
   * `SALE` autorise et encaisse en une fois : c'est le réglage du plugin
   * officiel CAWL 2.5.32, et il n'y a alors rien à capturer ensuite.
   * `FINAL_AUTHORIZATION` autorise seulement, la capture se demande après.
   * Tous les comptes n'acceptent pas les deux, d'où le choix.
   */
  modeAutorisation?: 'SALE' | 'FINAL_AUTHORIZATION'
}

export const MODES_AUTORISATION = ['SALE', 'FINAL_AUTHORIZATION'] as const

/**
 * Identifiant du moyen de paiement CAWL, déduit des premiers chiffres.
 *
 * L'ordre compte : une carte CB co-badgée Visa commence par 4 et doit être
 * traitée en Visa. Les préfixes CB sont limités à 50, 56, 58 et 67, comme
 * dans l'intégration de référence ; en ajouter d'autres fait refuser des
 * cartes parfaitement valides.
 */
export function produitCawl(numeroCarte: string): number | null {
  const bin = numeroCarte.replace(/\D/g, '').slice(0, 8)
  if (/^4/.test(bin)) return 1
  if (/^5[1-5]/.test(bin) || /^2(2[2-9]\d|[3-6]\d{2}|7[01]\d|720)/.test(bin)) return 3
  if (/^(50|56|58|67)/.test(bin)) return 130
  return null
}

/* ── Opérations ────────────────────────────────────────── */

export async function creerPaiement(p: Paiement): Promise<ReponsePaiement> {
  const n = p.navigateur
  return appel<ReponsePaiement>('POST', '/payments', {
    order: {
      amountOfMoney: { currencyCode: 'EUR', amount: p.montantCents },
      customer: {
        device: {
          acceptHeader: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          userAgent: n?.userAgent ?? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
          locale: 'fr_FR',
          ...(p.ipClient ? { ipAddress: p.ipClient } : {}),
          /* `javaScriptEnabled: false` et les dimensions en chaîne de
             caractères : non négociable, l'intégration de référence a été
             validée ainsi et toute variation fait échouer le 3-D Secure. */
          browserData: {
            colorDepth: n?.colorDepth ?? 24,
            javaScriptEnabled: false,
            screenHeight: String(n?.screenHeight ?? 1080),
            screenWidth: String(n?.screenWidth ?? 1920),
          },
        },
      },
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
      threeDSecure: { skipAuthentication: false, redirectionData: { returnUrl: p.returnUrl } },
    },
  }, p.cleIdempotence)
}

export async function lirePaiement(id: string): Promise<{ id: string; statut: string; montantCents: number }> {
  const d = await appel<{ id: string; status: string; paymentOutput?: { amountOfMoney?: { amount: number } } }>(
    'GET', `/payments/${id}`
  )
  return { id: d.id, statut: d.status, montantCents: d.paymentOutput?.amountOfMoney?.amount ?? 0 }
}

/** Statuts qui signent un refus. Il n'existe pas de statut « FAILED » chez CAWL. */
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
    /* ACTION_NOT_ALLOWED : le compte CAWL est en capture automatique, le
       paiement est déjà pris. Ce n'est pas un échec. */
    if (err instanceof Error && err.message.includes('ACTION_NOT_ALLOWED')) return true
    throw err
  }
}
