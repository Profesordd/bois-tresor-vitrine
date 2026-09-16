import { createHash } from 'node:crypto'
import { META_PIXEL_ID } from '@/lib/analytics/meta'

/**
 * API Conversions de Meta — envoi serveur à serveur.
 *
 * Le pixel navigateur suffit de moins en moins : bloqueurs de publicité,
 * prévention du pistage sur iOS, refus de cookies. Une part des visiteurs
 * n'est donc jamais comptée. L'envoi depuis le serveur passe outre, puisque
 * la requête part de Vercel et non du navigateur.
 *
 * Les deux sources envoient le MÊME événement, avec le même identifiant :
 * Meta les rapproche et n'en compte qu'un. Sans cet identifiant partagé,
 * chaque achat serait compté deux fois et le coût par conversion divisé
 * par deux — une optimisation publicitaire faussée dans le mauvais sens.
 */

/* Version de l'API Graph. Meta retire les anciennes au bout d'environ deux
   ans : celle-ci est la plus récente vérifiée fonctionnelle, et se change
   par variable d'environnement le jour où elle expirera. */
const VERSION = process.env.META_GRAPH_VERSION ?? 'v23.0'

export function capiConfigure(): boolean {
  return typeof process.env.META_CONVERSIONS_TOKEN === 'string'
    && process.env.META_CONVERSIONS_TOKEN.length > 20
}

/** Meta exige les données personnelles en empreinte SHA-256, jamais en clair. */
function empreinte(valeur: string | null | undefined): string | undefined {
  if (!valeur) return undefined
  const normalise = valeur.trim().toLowerCase()
  if (!normalise) return undefined
  return createHash('sha256').update(normalise).digest('hex')
}

export interface DonneesUtilisateur {
  /** Adresse IP publique, transmise en clair : Meta l'attend ainsi. */
  ip?: string | null
  userAgent?: string | null
  /** Cookie _fbp déposé par le pixel. */
  fbp?: string | null
  /** Cookie _fbc, dérivé du paramètre fbclid d'un clic publicitaire. */
  fbc?: string | null
  email?: string | null
}

export interface EvenementCapi {
  nom: 'PageView' | 'ViewContent' | 'AddToCart'
  /** Identifiant partagé avec le pixel navigateur — clé de la déduplication. */
  eventId: string
  url: string
  /** Horodatage en secondes, tel qu'attendu par Meta. */
  horodatage?: number
  utilisateur: DonneesUtilisateur
  donnees?: Record<string, unknown>
}

interface Reponse {
  ok: boolean
  status: number
  corps: unknown
}

export async function envoyerCapi(evenements: EvenementCapi[]): Promise<Reponse> {
  const token = process.env.META_CONVERSIONS_TOKEN
  if (!token || evenements.length === 0) {
    return { ok: false, status: 0, corps: 'API Conversions non configurée' }
  }

  const data = evenements.map((e) => ({
    event_name: e.nom,
    event_time: e.horodatage ?? Math.floor(Date.now() / 1000),
    event_id: e.eventId,
    event_source_url: e.url,
    action_source: 'website',
    user_data: {
      client_ip_address: e.utilisateur.ip ?? undefined,
      client_user_agent: e.utilisateur.userAgent ?? undefined,
      fbp: e.utilisateur.fbp ?? undefined,
      fbc: e.utilisateur.fbc ?? undefined,
      em: empreinte(e.utilisateur.email),
    },
    custom_data: e.donnees,
  }))

  const corps: Record<string, unknown> = { data }

  /* Code de test : les événements apparaissent dans « Test Events » sans
     polluer les statistiques réelles. À retirer une fois la vérification
     faite, sinon les événements resteront en mode test. */
  if (process.env.META_TEST_EVENT_CODE) {
    corps.test_event_code = process.env.META_TEST_EVENT_CODE
  }

  const url = `https://graph.facebook.com/${VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corps),
    })
    const json = await res.json().catch(() => null)
    return { ok: res.ok, status: res.status, corps: json }
  } catch (err) {
    return { ok: false, status: 0, corps: String(err) }
  }
}
