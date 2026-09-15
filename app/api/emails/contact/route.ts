import { NextRequest, NextResponse } from 'next/server'
import { getResend, FROM_EMAIL, ADMIN_EMAIL, isEmailConfigured } from '@/lib/emails/resend'
import { contactConfirmationHtml, contactNotificationHtml } from '@/lib/emails/templates'

/**
 * Réception du formulaire de contact.
 *
 * Attention au SDK Resend : en cas d'échec il ne lève pas d'exception, il
 * renvoie `{ data: null, error }`. Sans vérification explicite, la route
 * répondait « envoyé » alors que rien ne partait — le visiteur croyait
 * avoir écrit, et le message n'arrivait jamais.
 */

const ERREUR_VISITEUR =
  'Votre message n’a pas pu être envoyé. Écrivez-nous directement à ' +
  ADMIN_EMAIL +
  ', nous vous répondrons sous 24 h ouvrées.'

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
    }

    if (!isEmailConfigured()) {
      console.error('[email/contact] RESEND_API_KEY absente : aucun envoi possible.')
      return NextResponse.json({ error: ERREUR_VISITEUR }, { status: 503 })
    }

    const resend = getResend()

    /* La notification interne est la seule qui compte vraiment : c'est elle
       qui porte la demande du client jusqu'à la boîte du gérant. */
    const notification = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      replyTo: email,
      subject: `Nouveau message de ${name} — ${subject || 'Contact'}`,
      html: contactNotificationHtml(name, email, subject || 'Sans sujet', message),
    })

    if (notification.error) {
      console.error('[email/contact] notification non envoyée :', notification.error)
      return NextResponse.json({ error: ERREUR_VISITEUR }, { status: 502 })
    }

    /* L'accusé de réception est un confort : s'il échoue, la demande est
       tout de même arrivée, on ne fait pas échouer le formulaire pour ça. */
    const confirmation = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Votre message a bien été reçu — Bois Tresor',
      html: contactConfirmationHtml(name, message),
    })

    if (confirmation.error) {
      console.error('[email/contact] accusé de réception non envoyé :', confirmation.error)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[email/contact]', err)
    return NextResponse.json({ error: ERREUR_VISITEUR }, { status: 500 })
  }
}
