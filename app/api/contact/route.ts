import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Enregistrement d'une demande de contact.
 *
 * Aucun email n'est envoyé : la demande est rangée en base et lue depuis
 * l'espace d'administration, où le gérant répond ensuite depuis sa propre
 * boîte. Une écriture en base réussit ou échoue franchement — contrairement
 * à un envoi d'email, qui pouvait échouer sans que personne ne le sache.
 */

const LIMITS = { name: 120, email: 200, subject: 160, message: 5000 }

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

/** Contrôle volontairement permissif : refuser l'adresse d'un vrai client
 *  serait plus coûteux que d'accepter une adresse mal formée. */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))

    const name = clean(body.name, LIMITS.name)
    const email = clean(body.email, LIMITS.email)
    const subject = clean(body.subject, LIMITS.subject)
    const message = clean(body.message, LIMITS.message)

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Merci de renseigner votre nom, votre e-mail et votre message.' },
        { status: 400 }
      )
    }
    if (!looksLikeEmail(email)) {
      return NextResponse.json(
        { error: 'Cette adresse e-mail semble incorrecte. Vérifiez-la, nous en avons besoin pour vous répondre.' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    /* Adresse bloquée : rien n'est enregistré, et l'expéditeur voit la même
       confirmation que d'habitude. Lui annoncer le blocage l'inviterait
       simplement à recommencer depuis une autre adresse. */
    const { data: bloque } = await supabase
      .from('contact_blocklist')
      .select('email')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (bloque) return NextResponse.json({ ok: true })

    const { error } = await supabase.from('contact_messages').insert({
      name,
      email,
      subject: subject || null,
      message,
    })

    if (error) {
      console.error('[contact] enregistrement impossible :', error)
      return NextResponse.json(
        {
          error:
            'Votre message n’a pas pu être enregistré. Écrivez-nous directement à contact@bois-tresor.com, nous vous répondrons sous 24 h ouvrées.',
        },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contact]', err)
    return NextResponse.json(
      {
        error:
          'Une erreur est survenue. Écrivez-nous directement à contact@bois-tresor.com, nous vous répondrons sous 24 h ouvrées.',
      },
      { status: 500 }
    )
  }
}
