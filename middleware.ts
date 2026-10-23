import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, verifyToken } from '@/lib/admin/session'

export const PAYS_COOKIE = 'bt_pays'

/**
 * Fixation de la variante de prix des granulés Limouzi.
 *
 * Deux fiches du même produit coexistent : A au prix bas, B au prix haut.
 * Un visiteur venu de la campagne B ne doit jamais, en revenant sur le
 * site, tomber sur le prix bas de la fiche A : pour lui, un prix soudain
 * plus bas sur le même produit est un signal d'arnaque, pas une aubaine.
 *
 * On marque donc dans un cookie la première variante vue, et on y ramène
 * le visiteur partout ensuite : menu, accueil, lien direct. L'IP ne sert
 * à rien ici — partagée, changeante, surtout sur mobile — là où le cookie
 * suit le bon navigateur de façon fiable.
 */
const GR_A = 'granules-de-bois-limouzi-palette-de-134-sacs-de-15-kg'
const GR_B = 'granules-de-bois-limouzi-sacs-de-15-kg'
const GR_COOKIE = 'bt_gr'

/** La variante visée par un chemin de fiche ou de commande, si c'en est une. */
function varianteDuChemin(pathname: string): 'A' | 'B' | null {
  if (pathname.includes(`/${GR_B}`)) return 'B'
  if (pathname.includes(`/${GR_A}`)) return 'A'
  return null
}

/**
 * Applique la fixation. Rend une réponse de redirection si le visiteur
 * doit être ramené sur sa variante, sinon `null` et pose le cookie au
 * passage sur la réponse fournie.
 */
function fixerVariante(req: NextRequest, res: NextResponse): NextResponse | null {
  const vue = varianteDuChemin(req.nextUrl.pathname)
  if (!vue) return null

  const pinned = req.cookies.get(GR_COOKIE)?.value
  const poser = (r: NextResponse, v: string) =>
    r.cookies.set(GR_COOKIE, v, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, httpOnly: true })

  if (pinned === 'A' && vue === 'B') {
    const url = req.nextUrl.clone()
    url.pathname = url.pathname.replace(`/${GR_B}`, `/${GR_A}`)
    url.search = ''
    const red = NextResponse.redirect(url)
    poser(red, 'A')
    return red
  }
  if (pinned === 'B' && vue === 'A') {
    const url = req.nextUrl.clone()
    url.pathname = url.pathname.replace(`/${GR_A}`, `/${GR_B}`)
    url.search = ''
    const red = NextResponse.redirect(url)
    poser(red, 'B')
    return red
  }

  /* Première rencontre : on fixe la variante vue. */
  if (pinned !== vue) poser(res, vue)
  return null
}

/**
 * Dépose le pays du visiteur dans un cookie lisible par le navigateur.
 *
 * Le pays vient de l'en-tête que Vercel déduit de l'IP. Passer par un
 * cookie plutôt que par le rendu serveur permet de garder les pages
 * statiques : sans cela, chaque page du catalogue devrait être regénérée
 * à chaque visite, et le site perdrait sa rapidité pour une seule phrase.
 */
function marquerLePays(req: NextRequest, res: NextResponse): NextResponse {
  const pays = (req.headers.get('x-vercel-ip-country') ?? '').toUpperCase().slice(0, 2)
  if (pays && req.cookies.get(PAYS_COOKIE)?.value !== pays) {
    res.cookies.set(PAYS_COOKIE, pays, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 12,
      /* Lisible par le navigateur : c'est une information d'affichage,
         pas un secret — et aucune donnée personnelle. */
      httpOnly: false,
    })
  }
  return res
}

/**
 * Deux rôles : protéger le tableau de bord, et renseigner le pays.
 *
 * Le tableau de bord est fermé : toute page sous /admin exige un jeton de
 * session valide, vérifié avant même que la page ne soit rendue. Sans ce
 * filtre, les statistiques de fréquentation du client seraient publiques.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (!pathname.startsWith('/admin')) {
    const res = marquerLePays(req, NextResponse.next())
    return fixerVariante(req, res) ?? res
  }

  if (pathname.startsWith('/admin/login')) return NextResponse.next()

  const ok = await verifyToken(
    req.cookies.get(ADMIN_COOKIE)?.value,
    process.env.ADMIN_SESSION_SECRET ?? ''
  )
  if (ok) return NextResponse.next()

  const login = req.nextUrl.clone()
  login.pathname = '/admin/login/'
  login.search = ''
  return NextResponse.redirect(login)
}

export const config = {
  /* Tout le site sauf les fichiers statiques et les routes d'API. */
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|png|svg|webp|avif|ico|txt|xml)$).*)'],
}
