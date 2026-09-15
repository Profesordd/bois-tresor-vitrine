import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, verifyToken } from '@/lib/admin/session'

export const PAYS_COOKIE = 'bt_pays'

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
    return marquerLePays(req, NextResponse.next())
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
