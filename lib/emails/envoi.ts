/**
 * Envoi d'un e-mail par Resend.
 *
 * Appel direct à l'API HTTP, sans le SDK, et volontairement.
 *
 * ⚠️ Le SDK Resend ne lève pas d'exception quand l'envoi échoue : il range
 * l'erreur dans `{ error }`. Le formulaire de contact du site a longtemps
 * répondu « message envoyé » alors que rien ne partait, parce que personne
 * ne lisait ce champ. Ici, le statut HTTP ne peut pas être ignoré, et toute
 * erreur est renvoyée à l'appelant qui l'enregistre en base.
 */

const API = 'https://api.resend.com/emails'

export interface Envoi {
  a: string
  sujet: string
  html: string
  texte: string
  /** Lien de désinscription, placé aussi dans les en-têtes du message. */
  desinscription?: string
}

export type Resultat = { ok: true; id: string } | { ok: false; erreur: string }

export function emailConfigure(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
}

/**
 * Présence des variables nécessaires, sans jamais révéler leur valeur.
 *
 * Affiché dans l'administration : une variable ajoutée sur Vercel n'entre
 * en vigueur qu'au déploiement suivant, et rien ne le signale. Ce voyant
 * évite de chercher longtemps pourquoi aucun message ne part.
 */
export function diagnosticConfig(): { cle: string; present: boolean; role: string }[] {
  return [
    { cle: 'RESEND_API_KEY', present: Boolean(process.env.RESEND_API_KEY), role: 'envoi des messages' },
    { cle: 'EMAIL_FROM', present: Boolean(process.env.EMAIL_FROM), role: 'adresse d’expéditeur' },
    { cle: 'CRON_SECRET', present: Boolean(process.env.CRON_SECRET), role: 'déclenchement automatique toutes les heures' },
  ]
}

export async function envoyer(e: Envoi): Promise<Resultat> {
  const cle = process.env.RESEND_API_KEY
  const expediteur = process.env.EMAIL_FROM
  if (!cle || !expediteur) return { ok: false, erreur: 'RESEND_API_KEY ou EMAIL_FROM absent' }

  /* `List-Unsubscribe` : c'est lui qui affiche le bouton « Se désabonner »
     dans Gmail et Outlook. Sans cet en-tête, le lecteur pressé clique sur
     « Spam » à la place, et c'est le domaine d'envoi qui en paie le prix. */
  const headers: Record<string, string> = {}
  if (e.desinscription) {
    headers['List-Unsubscribe'] = `<${e.desinscription}>`
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'
  }

  try {
    const reponse = await fetch(API, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: expediteur,
        to: [e.a],
        subject: e.sujet,
        html: e.html,
        text: e.texte,
        ...(Object.keys(headers).length > 0 && { headers }),
      }),
    })

    const corps = await reponse.json().catch(() => null)
    if (!reponse.ok) {
      const message = corps?.message ?? corps?.error?.message ?? `HTTP ${reponse.status}`
      return { ok: false, erreur: String(message).slice(0, 300) }
    }
    return { ok: true, id: String(corps?.id ?? '') }
  } catch (err) {
    return { ok: false, erreur: (err instanceof Error ? err.message : 'échec réseau').slice(0, 300) }
  }
}
