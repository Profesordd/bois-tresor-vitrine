/**
 * Session d'administration.
 *
 * Jeton signé (HMAC-SHA256) déposé dans un cookie httpOnly : il n'est pas
 * lisible par JavaScript, et sa signature empêche de le fabriquer ou d'en
 * repousser la date d'expiration. Aucune session n'est stockée en base.
 *
 * Écrit avec l'API Web Crypto pour fonctionner aussi bien dans le
 * middleware (runtime Edge) que dans les routes serveur.
 */

export const ADMIN_COOKIE = 'bt_admin'

/** Durée de validité d'une connexion. */
const MAX_AGE_SECONDS = 60 * 60 * 12

function b64url(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return b64url(new Uint8Array(sig))
}

/** Comparaison à temps constant : ne révèle pas où deux valeurs diffèrent. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function createToken(secret: string): Promise<{ value: string; maxAge: number }> {
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000
  const payload = String(expiresAt)
  return { value: `${payload}.${await sign(payload, secret)}`, maxAge: MAX_AGE_SECONDS }
}

export async function verifyToken(token: string | undefined, secret: string): Promise<boolean> {
  if (!token || !secret) return false
  const dot = token.lastIndexOf('.')
  if (dot <= 0) return false

  const payload = token.slice(0, dot)
  const signature = token.slice(dot + 1)

  const expiresAt = Number(payload)
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false

  return safeEqual(signature, await sign(payload, secret))
}

/** Vérifie le mot de passe saisi, sans fuite de temps. */
export async function checkPassword(given: string, expected: string): Promise<boolean> {
  if (!expected) return false
  /* On compare les empreintes plutôt que les mots de passe : la comparaison
     porte alors toujours sur la même longueur. */
  const [a, b] = await Promise.all([digest(given), digest(expected)])
  return safeEqual(a, b)
}

async function digest(value: string): Promise<string> {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return b64url(new Uint8Array(h))
}
