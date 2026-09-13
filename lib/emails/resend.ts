import { Resend } from 'resend'

export const FROM_EMAIL  = process.env.EMAIL_FROM ?? 'Bois Émeraude <contact@bois-emeraude.com>'
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'contact@bois-emeraude.com'
export const SITE_URL    = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bois-emeraude-vitrine.vercel.app'

// Instanciation lazy — évite le crash au build si RESEND_API_KEY absent
let _resend: Resend | null = null
export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
  }
  return _resend
}
