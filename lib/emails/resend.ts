import { Resend } from 'resend'

export const FROM_EMAIL  = process.env.EMAIL_FROM ?? 'Bois Tresor <contact@bois-tresor.com>'
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'contact@bois-tresor.com'
export const SITE_URL    = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bois-tresor-vitrine.vercel.app'

/** Vrai seulement si une clé d'API est réellement fournie. */
export function isEmailConfigured(): boolean {
  const key = process.env.RESEND_API_KEY
  return typeof key === 'string' && key.startsWith('re_')
}

// Instanciation lazy — évite le crash au build si RESEND_API_KEY absent
let _resend: Resend | null = null
export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
  }
  return _resend
}
