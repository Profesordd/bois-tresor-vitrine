import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, verifyToken } from '@/lib/admin/session'

/**
 * Le tableau de bord est fermé : toute page sous /admin exige un jeton de
 * session valide, vérifié avant même que la page ne soit rendue. Sans ce
 * filtre, les statistiques de fréquentation du client seraient publiques.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

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
  matcher: ['/admin/:path*'],
}
