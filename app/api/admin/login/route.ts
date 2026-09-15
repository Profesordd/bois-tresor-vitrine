import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, createToken, checkPassword } from '@/lib/admin/session'

/** Petit frein contre l'essai de mots de passe en série, par adresse. */
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
  const password = process.env.ADMIN_PASSWORD ?? ''
  const secret = process.env.ADMIN_SESSION_SECRET ?? ''

  if (!password || !secret) {
    return NextResponse.json(
      { error: 'Accès administrateur non configuré sur ce serveur.' },
      { status: 500 }
    )
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'inconnu'
  if (tooManyAttempts(ip)) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessayez dans quelques minutes.' },
      { status: 429 }
    )
  }

  const { password: given } = await req.json().catch(() => ({ password: '' }))
  if (typeof given !== 'string' || !(await checkPassword(given, password))) {
    return NextResponse.json({ error: 'Mot de passe incorrect.' }, { status: 401 })
  }

  const token = await createToken(secret)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, token.value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: token.maxAge,
  })
  return res
}

/** Déconnexion. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
