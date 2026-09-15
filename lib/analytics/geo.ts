/**
 * Zone commerciale et détection des robots.
 *
 * Deux usages distincts :
 *   - filtrer le tableau de bord, pour que les chiffres ne reflètent que
 *     des visiteurs susceptibles d'acheter ;
 *   - adapter le message de livraison au pays du visiteur.
 */

/** Pays où le site s'adresse à de vrais clients. */
export const ZONE_COMMERCIALE = ['FR', 'BE', 'CH', 'LU', 'MC'] as const
export type PaysZone = (typeof ZONE_COMMERCIALE)[number]

export const NOM_PAYS: Record<string, string> = {
  FR: 'France',
  BE: 'Belgique',
  CH: 'Suisse',
  LU: 'Luxembourg',
  MC: 'Monaco',
}

export function estDansLaZone(code: string | null | undefined): boolean {
  return !!code && (ZONE_COMMERCIALE as readonly string[]).includes(code.toUpperCase())
}

/**
 * Robots et outils automatisés.
 *
 * Volontairement large : un robot compté comme visiteur fausse le taux de
 * conversion vers le bas et fait croire à un problème qui n'existe pas.
 * Le risque inverse — écarter un vrai visiteur — est quasi nul, aucun
 * navigateur courant ne contenant ces mots dans son identifiant.
 */
const MOTS_ROBOT = [
  'bot', 'crawl', 'spider', 'slurp', 'scrape', 'headless', 'phantom',
  'curl', 'wget', 'python', 'java/', 'okhttp', 'axios', 'go-http',
  'facebookexternalhit', 'preview', 'monitor', 'uptime', 'pingdom',
  'lighthouse', 'pagespeed', 'gtmetrix', 'ahrefs', 'semrush', 'mj12',
  'dotbot', 'petalbot', 'bytespider', 'archive.org', 'feedfetcher',
]

export function estUnRobot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true // aucun identifiant : jamais un navigateur normal
  const ua = userAgent.toLowerCase()
  return MOTS_ROBOT.some((mot) => ua.includes(mot))
}
