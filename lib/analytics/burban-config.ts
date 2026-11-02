/** Identité du partenaire, sans secret : utilisable côté navigateur. */
export const BURBAN_PIXEL_ID = '1635910154593656'

export function estCheckoutPartenaire(url: string): boolean {
  try {
    const path = new URL(url, 'https://www.bois-tresor.com').pathname
    return path === '/commande/partenaire' || path.startsWith('/commande/partenaire/')
  } catch {
    return false
  }
}
