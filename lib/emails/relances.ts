import { SIRET, ADRESSE_SIEGE, CONTACT_EMAIL, SHIPPING_ZONE } from '@/lib/site'

/**
 * Les cinq relances envoyées après un paiement non abouti.
 *
 * Calendrier : 1 h, 6 h, J+1, J+3, J+7. Deux le premier jour, parce que
 * l'essentiel d'un panier abandonné se récupère dans les premières heures.
 * Les trois suivantes rattrapent surtout celui qui a eu un refus de carte
 * et qui s'y remet plus tard.
 *
 * Règles d'écriture, imposées par le public du site (voir la fiche projet) :
 * phrases courtes, pas de fausse urgence, pas de chiffre inventé. Les deux
 * seuls arguments de rareté utilisés ici sont vrais et vérifiables sur le
 * site : la saison, et le fait qu'il ne reste qu'une référence de granulés
 * en vente. Si cela change, ces textes doivent changer aussi.
 */

export interface LeadRelance {
  id: string
  email: string
  produit_slug: string | null
  produit_nom: string | null
  montant: string | number | null
}

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.bois-tresor.com').replace(/\/$/, '')

/** Délais depuis le clic, en heures. L'index vaut l'étape moins un. */
export const DELAIS_HEURES = [1, 6, 24, 72, 168] as const
export const NB_ETAPES = DELAIS_HEURES.length

function lienProduit(lead: LeadRelance): string {
  return lead.produit_slug ? `${SITE}/produits/${lead.produit_slug}/` : `${SITE}/produits/`
}

function montantLisible(lead: LeadRelance): string | null {
  const m = lead.montant === null ? NaN : Number(lead.montant)
  return Number.isFinite(m) ? `${m.toFixed(2).replace('.', ',')} €` : null
}

function echapper(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Gabarit commun.
 *
 * Tableaux et styles en ligne : c'est la seule mise en page qu'Outlook et
 * les webmails rendent de la même façon. Texte à 17 px, bouton large :
 * les destinataires de ce site ont en moyenne la soixantaine.
 */
function gabarit(titre: string, corps: string, bouton: { texte: string; url: string }, desinscription: string): string {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${echapper(titre)}</title></head>
<body style="margin:0;padding:0;background:#f6f7f6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f6;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;">
  <tr><td style="background:#14432f;padding:20px 28px;">
    <span style="font:600 21px Georgia,serif;color:#ffffff;">Bois</span>
    <span style="font:600 21px Georgia,serif;color:#8fcfa8;"> Tresor</span>
  </td></tr>
  <tr><td style="padding:28px;font:400 17px/1.55 -apple-system,Segoe UI,Arial,sans-serif;color:#1f2420;">
    <h1 style="margin:0 0 16px;font:700 23px/1.3 Georgia,serif;color:#1f2420;">${echapper(titre)}</h1>
    ${corps}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 8px;"><tr>
      <td style="background:#1a6b47;border-radius:8px;">
        <a href="${bouton.url}" style="display:inline-block;padding:15px 30px;font:700 17px -apple-system,Segoe UI,Arial,sans-serif;color:#ffffff;text-decoration:none;">${echapper(bouton.texte)}</a>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:20px 28px 26px;border-top:1px solid #eceeec;font:400 13px/1.6 -apple-system,Segoe UI,Arial,sans-serif;color:#767c77;">
    <p style="margin:0 0 6px;">Bois Tresor — ${ADRESSE_SIEGE.rue}, ${ADRESSE_SIEGE.ville}, ${ADRESSE_SIEGE.pays}</p>
    <p style="margin:0 0 6px;">SIRET ${SIRET} — une question : <a href="mailto:${CONTACT_EMAIL}" style="color:#1a6b47;">${CONTACT_EMAIL}</a></p>
    <p style="margin:0;"><a href="${desinscription}" style="color:#767c77;">Ne plus recevoir ces messages</a></p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`
}

interface Message {
  sujet: string
  html: string
  texte: string
}

/** Les cinq messages, dans l'ordre du calendrier. */
export function composer(etape: number, lead: LeadRelance, desinscription: string): Message {
  const url = lienProduit(lead)
  const produit = lead.produit_nom ? echapper(lead.produit_nom) : 'votre commande'
  const prix = montantLisible(lead)
  const p = (t: string) => `<p style="margin:0 0 14px;">${t}</p>`

  switch (etape) {
    case 1:
      return {
        sujet: 'Votre commande n’est pas allée au bout',
        html: gabarit(
          'Votre commande n’est pas allée au bout',
          p('Bonjour,') +
          p(`Vous avez commencé une commande chez nous il y a un moment, pour&nbsp;: <strong>${produit}</strong>${prix ? ` (${prix})` : ''}. Le paiement n’a pas abouti.`) +
          p('Il n’y a rien d’anormal à ça. Le plus souvent, c’est la banque qui a bloqué, ou la page de paiement qui s’est fermée trop tôt.') +
          p('Votre choix est encore disponible. Le lien ci-dessous vous y ramène directement.'),
          { texte: 'Reprendre ma commande', url },
          desinscription
        ),
        texte: `Bonjour,\n\nVous avez commencé une commande chez nous pour : ${lead.produit_nom ?? 'votre commande'}${prix ? ` (${prix})` : ''}. Le paiement n'a pas abouti.\n\nIl n'y a rien d'anormal à ça. Le plus souvent, c'est la banque qui a bloqué, ou la page de paiement qui s'est fermée trop tôt.\n\nReprendre ma commande : ${url}\n\nJean-Paul et Julien — Bois Tresor\nNe plus recevoir ces messages : ${desinscription}`,
      }

    case 2:
      return {
        sujet: 'Un souci au moment de payer ?',
        html: gabarit(
          'Un souci au moment de payer ?',
          p('Bonjour,') +
          p('Votre commande est restée en suspens. Si c’est le paiement qui a coincé, voici les deux causes qu’on rencontre le plus souvent&nbsp;:') +
          `<ul style="margin:0 0 14px;padding-left:20px;">
             <li style="margin-bottom:8px;">Votre banque a demandé une confirmation sur votre téléphone, et le délai est passé. Il suffit de recommencer en gardant le téléphone à portée de main.</li>
             <li style="margin-bottom:8px;">Le plafond de la carte est atteint. Une autre carte règle le problème.</li>
           </ul>` +
          p(`Si ce n’est ni l’un ni l’autre, répondez simplement à ce message. C’est nous qui lisons, et nous vous répondons.`),
          { texte: 'Terminer ma commande', url },
          desinscription
        ),
        texte: `Bonjour,\n\nVotre commande est restée en suspens. Si c'est le paiement qui a coincé, les deux causes les plus fréquentes sont une confirmation bancaire expirée sur votre téléphone, ou un plafond de carte atteint.\n\nSi ce n'est ni l'un ni l'autre, répondez à ce message, nous vous répondons.\n\nTerminer ma commande : ${url}\n\nJean-Paul et Julien — Bois Tresor\nNe plus recevoir ces messages : ${desinscription}`,
      }

    case 3:
      return {
        sujet: 'Qui nous sommes, avant que vous commandiez',
        html: gabarit(
          'Qui nous sommes',
          p('Bonjour,') +
          p('Vous ne nous connaissez peut-être pas, et c’est une bonne raison d’hésiter. Alors voilà.') +
          p('Nous sommes Jean-Paul et Julien, deux frères. Notre père était bûcheron, notre grand-père aussi. Nous préparons le bois nous-mêmes et nous répondons nous-mêmes à vos messages.') +
          p(`Notre entreprise est enregistrée sous le SIRET ${SIRET}. Vous pouvez le vérifier sur l’annuaire officiel des entreprises, c’est public et c’est gratuit.`) +
          p(`La livraison est offerte ${SHIPPING_ZONE}, sans minimum. Le paiement passe par un prestataire sécurisé&nbsp;: vos coordonnées bancaires ne transitent jamais par nos serveurs.`),
          { texte: 'Revenir à ma commande', url },
          desinscription
        ),
        texte: `Bonjour,\n\nNous sommes Jean-Paul et Julien, deux frères. Notre père était bûcheron, notre grand-père aussi. Nous préparons le bois nous-mêmes et nous répondons nous-mêmes à vos messages.\n\nNotre entreprise est enregistrée sous le SIRET ${SIRET}, vérifiable sur l'annuaire officiel des entreprises.\n\nLa livraison est offerte ${SHIPPING_ZONE}, sans minimum.\n\nRevenir à ma commande : ${url}\n\nJean-Paul et Julien — Bois Tresor\nNe plus recevoir ces messages : ${desinscription}`,
      }

    case 4:
      return {
        sujet: 'Ce qu’il nous reste',
        html: gabarit(
          'Ce qu’il nous reste',
          p('Bonjour,') +
          p('Un mot sur l’état de nos stocks, pour que vous décidiez en connaissance de cause.') +
          p('Sur nos vingt références de granulés, il n’en reste <strong>qu’une seule</strong> en vente. Les autres sont parties. C’est la saison qui veut ça&nbsp;: tout le monde se réapprovisionne en même temps, et nous ne reconstituons pas avant l’hiver prochain.') +
          p(`Ce que vous aviez choisi, <strong>${produit}</strong>, est encore là aujourd’hui. Nous ne pouvons pas vous promettre que ce sera encore le cas dans quinze jours.`),
          { texte: 'Voir si c’est encore disponible', url },
          desinscription
        ),
        texte: `Bonjour,\n\nSur nos vingt références de granulés, il n'en reste qu'une seule en vente. Les autres sont parties. C'est la saison : tout le monde se réapprovisionne en même temps.\n\nCe que vous aviez choisi, ${lead.produit_nom ?? 'votre commande'}, est encore disponible aujourd'hui.\n\nVoir si c'est encore disponible : ${url}\n\nJean-Paul et Julien — Bois Tresor\nNe plus recevoir ces messages : ${desinscription}`,
      }

    default:
      return {
        sujet: 'Notre dernier message',
        html: gabarit(
          'Notre dernier message',
          p('Bonjour,') +
          p('C’est le dernier message que nous vous envoyons à ce sujet. Nous ne voulons pas encombrer votre boîte.') +
          p(`Si vous avez trouvé votre bois ailleurs, tant mieux, l’essentiel est que vous passiez l’hiver au chaud. Si vous hésitez encore, le lien ci-dessous reste valable tant que le produit est en stock.`) +
          p(`Et si quelque chose vous a retenu sur notre site, dites-le-nous en répondant à ce message. On lit tout, et ça nous aide.`),
          { texte: 'Voir ma commande', url },
          desinscription
        ),
        texte: `Bonjour,\n\nC'est le dernier message que nous vous envoyons à ce sujet.\n\nSi vous avez trouvé votre bois ailleurs, tant mieux. Si vous hésitez encore, ce lien reste valable tant que le produit est en stock : ${url}\n\nEt si quelque chose vous a retenu sur notre site, dites-le-nous en répondant à ce message.\n\nJean-Paul et Julien — Bois Tresor\nNe plus recevoir ces messages : ${desinscription}`,
      }
  }
}
