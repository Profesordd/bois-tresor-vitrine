import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { PARTENAIRE_COOKIE } from '@/lib/admin/session'

export const dynamic = 'force-dynamic'

/** Efface la session partenaire et renvoie à l'écran de connexion. */
export default async function DeconnexionPartenairePage() {
  const store = await cookies()
  store.set(PARTENAIRE_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
  redirect('/partenaire/login/')
}
