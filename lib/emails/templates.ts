import { SITE_URL } from './resend'

const BROWN  = '#9C5F2C'
const DARK   = '#2A180A'
const GRAY   = '#7A6A57'
const LIGHT  = '#FBF6EE'
const BORDER = '#F3E1CB'

function base(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f3f0ea;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f0ea;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid ${BORDER};max-width:600px;width:100%;">

        <tr>
          <td style="background:${BROWN};padding:28px 40px;text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
              Bois Trésor
            </p>
            <p style="margin:6px 0 0;font-size:13px;color:#F3E1CB;">Bois de chauffage & granulés premium</p>
          </td>
        </tr>

        <tr><td style="padding:36px 40px;">${body}</td></tr>

        <tr>
          <td style="background:${LIGHT};border-top:1px solid ${BORDER};padding:24px 40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:12px;color:${GRAY};">
              Bois Trésor — Bois de chauffage & granulés premium
            </p>
            <p style="margin:0;font-size:12px;color:${GRAY};">
              <a href="${SITE_URL}/contact" style="color:${BROWN};text-decoration:none;">Nous contacter</a>
              &nbsp;·&nbsp;
              <a href="${SITE_URL}/suivi-commande" style="color:${BROWN};text-decoration:none;">Suivi commande</a>
              &nbsp;·&nbsp;
              <a href="${SITE_URL}/produits" style="color:${BROWN};text-decoration:none;">Notre catalogue</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/* ─── Confirmation au client (formulaire contact) ─── */
export function contactConfirmationHtml(name: string, message: string): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${DARK};">Message bien reçu !</h1>
    <p style="margin:0 0 24px;font-size:15px;color:${GRAY};">Bonjour <strong>${name}</strong>, nous avons bien reçu votre message et vous répondrons sous 24h ouvrées.</p>

    <div style="background:${LIGHT};border-left:4px solid ${BROWN};padding:16px 20px;border-radius:4px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:${GRAY};font-style:italic;">"${message.slice(0, 200)}${message.length > 200 ? '…' : ''}"</p>
    </div>

    <p style="font-size:14px;color:${GRAY};line-height:1.7;margin:0;">
      En attendant, vous pouvez consulter notre <a href="${SITE_URL}/produits" style="color:${BROWN};">catalogue</a>
      ou suivre votre commande sur notre <a href="${SITE_URL}/suivi-commande" style="color:${BROWN};">page de suivi</a>.
    </p>
  `
  return base('Votre message a bien été reçu', body)
}

/* ─── Notification interne (formulaire contact) ─── */
export function contactNotificationHtml(name: string, email: string, subject: string, message: string): string {
  const body = `
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:${DARK};">Nouveau message de contact</h1>
    <p style="margin:0 0 24px;font-size:14px;color:${GRAY};">Un client a soumis le formulaire de contact.</p>

    <table width="100%" cellpadding="0" cellspacing="0">
      ${[['Nom', name], ['Email', email], ['Sujet', subject]].map(([k, v]) => `
        <tr>
          <td style="padding:8px 0;font-size:13px;color:${GRAY};width:80px;font-weight:600;">${k}</td>
          <td style="padding:8px 0;font-size:13px;color:${DARK};">${v}</td>
        </tr>
      `).join('')}
    </table>

    <hr style="border:none;border-top:1px solid ${BORDER};margin:28px 0;" />

    <h2 style="font-size:14px;font-weight:700;color:${DARK};margin:0 0 8px;">Message</h2>
    <div style="background:${LIGHT};border:1px solid ${BORDER};border-radius:8px;padding:16px;font-size:14px;color:${DARK};line-height:1.7;white-space:pre-wrap;">${message}</div>

    <div style="text-align:center;margin-top:20px;">
      <a href="mailto:${email}" style="display:inline-block;background:${BROWN};color:#ffffff;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;text-decoration:none;">Répondre par email</a>
    </div>
  `
  return base('Nouveau message — Bois Trésor', body)
}
