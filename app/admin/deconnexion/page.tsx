import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { ADMIN_COOKIE } from '@/lib/admin/session'

export const dynamic = 'force-dynamic'

/** Efface le cookie de session et renvoie à l'écran de connexion. */
export default async function DeconnexionPage() {
  const store = await cookies()
  store.set(ADMIN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
  redirect('/admin/login/')
}
