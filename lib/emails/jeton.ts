/**
 * Jeton de désinscription.
 *
 * Signature HMAC de l'identifiant du lead. Rien n'est stocké : le lien
 * reste valable indéfiniment, ce qui est exactement ce qu'on veut d'un lien
 * de désinscription, et personne ne peut désinscrire quelqu'un d'autre en
 * devinant un identifiant.
 *
 * Écrit avec l'API Web Crypto, comme la session d'administration, pour
 * fonctionner aussi bien dans les routes serveur que dans le middleware.
 */

function b64url(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? ''
}

export async function signerLead(id: string): Promise<string> {
  const s = secret()
  if (!s) return ''
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(s), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`desinscription:${id}`))
  return b64url(new Uint8Array(sig))
}

/** Comparaison à temps constant : ne révèle pas où deux valeurs diffèrent. */
export async function jetonValide(id: string, jeton: string | null): Promise<boolean> {
  if (!jeton) return false
  const attendu = await signerLead(id)
  if (!attendu || attendu.length !== jeton.length) return false
  let diff = 0
  for (let i = 0; i < attendu.length; i++) diff |= attendu.charCodeAt(i) ^ jeton.charCodeAt(i)
  return diff === 0
}
