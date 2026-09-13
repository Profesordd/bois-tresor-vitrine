import { NextRequest, NextResponse } from 'next/server'
import { getResend, FROM_EMAIL, ADMIN_EMAIL } from '@/lib/emails/resend'
import { contactConfirmationHtml, contactNotificationHtml } from '@/lib/emails/templates'

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
    }

    // Envoi en parallèle : confirmation client + notif interne
    await Promise.all([
      getResend().emails.send({
        from:    FROM_EMAIL,
        to:      email,
        subject: 'Votre message a bien été reçu — Bois Tresor',
        html:    contactConfirmationHtml(name, message),
      }),
      getResend().emails.send({
        from:    FROM_EMAIL,
        to:      ADMIN_EMAIL,
        replyTo: email,
        subject: `📬 Nouveau message de ${name} — ${subject ?? 'Contact'}`,
        html:    contactNotificationHtml(name, email, subject ?? 'Sans sujet', message),
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[email/contact]', err)
    return NextResponse.json({ error: 'Erreur envoi email' }, { status: 500 })
  }
}
