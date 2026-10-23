import { NextRequest, NextResponse } from 'next/server'
import { PARTENAIRE_COOKIE, createToken, checkPassword } from '@/lib/admin/session'

/**
 * Connexion à l'espace partenaire, indépendante de l'admin de bois-tresor.
 *
 * Mot de passe et secret dédiés : le partenaire ne voit que ses ventes, et
 * ne peut rien faire dans l'administration de bois-tresor. Un seul frein
 * contre l'essai de mots de passe en série, par adresse.
 */

const attempts = new Map<string, { count: number; until: number }>()
const MAX_ATTEMPTS = 8
const WINDOW_MS = 10 * 60 * 1000

function tooManyAttempts(key: string): boolean {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || entry.until < now) {
    attempts.set(key, { count: 1, until: now + WINDOW_MS })
    return false
  }
  entry.count += 1
  return entry.count > MAX_ATTEMPTS
}

export async function POST(req: NextRequest) {
  const password = process.env.PARTENAIRE_PASSWORD ?? ''
  const secret = process.env.PARTENAIRE_SESSION_SECRET ?? ''
  if (!password || !secret) {
    return NextResponse.json({ error: 'Espace partenaire non configuré.' }, { status: 500 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'inconnu'
  if (tooManyAttempts(ip)) {
    return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans quelques minutes.' }, { status: 429 })
  }

  const { password: given } = await req.json().catch(() => ({ password: '' }))
  if (typeof given !== 'string' || !(await checkPassword(given, password))) {
    return NextResponse.json({ error: 'Mot de passe incorrect.' }, { status: 401 })
  }

  const token = await createToken(secret)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(PARTENAIRE_COOKIE, token.value, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
    path: '/', maxAge: token.maxAge,
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(PARTENAIRE_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
