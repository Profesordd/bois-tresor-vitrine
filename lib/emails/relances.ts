import { SIRET, ADRESSE_SIEGE, CONTACT_EMAIL, ANNUAIRE_URL, SHIPPING_ZONE } from '@/lib/site'
import { getProductBySlug } from '@/lib/products'
import { lotsDisponibles, produitDuLot } from '@/lib/lots'
import { buildCheckoutUrl } from '@/lib/checkout'

/**
 * Les cinq relances envoyées après un paiement non abouti.
 *
 * Calendrier : 1 h, 6 h, J+1, J+3, J+7. Deux le premier jour, parce que
 * l'essentiel d'un panier abandonné se récupère dans les premières heures.
 *
 * Chaque message porte les deux mêmes ressorts, dans cet ordre :
 *   1. la réassurance, parce que la première crainte de ce public n'est pas
 *      le prix mais l'arnaque ;
 *   2. la rareté, qui est réelle et vérifiable sur le site.
 *
 * ⚠️ Le bouton mène DIRECTEMENT à la page de paiement, avec la bonne
 * variante et la bonne quantité, reconstruites depuis le produit et le lot
 * enregistrés au moment du clic. Renvoyer vers la fiche produit obligerait
 * le destinataire à refaire tout le parcours, et c'est précisément là qu'on
 * l'a déjà perdu une fois.
 *
 * Aucun chiffre inventé. Les deux arguments de rareté utilisés sont vrais :
 * la saison, et le fait qu'il ne reste qu'une référence de granulés en
 * vente. Si cela change, ces textes changent aussi.
 */

export interface LeadRelance {
  id: string
  email: string
  produit_slug: string | null
  produit_nom: string | null
  lot: string | null
  montant: string | number | null
}

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.bois-tresor.com').replace(/\/$/, '')

/** Délais depuis le clic, en heures. L'index vaut l'étape moins un. */
export const DELAIS_HEURES = [1, 6, 24, 72, 168] as const
export const NB_ETAPES = DELAIS_HEURES.length

/**
 * L'adresse de paiement d'origine, reconstruite.
 *
 * Repli sur la fiche produit si le produit a disparu du catalogue ou n'a
 * plus d'identifiant de variante : mieux vaut une fiche qu'un lien mort.
 */
export function lienPaiement(lead: LeadRelance): string {
  const produit = lead.produit_slug ? getProductBySlug(lead.produit_slug) : null
  if (!produit) return `${SITE}/produits/`

  const lot = lead.lot ? lotsDisponibles(produit).find((l) => l.id === lead.lot) : null
  const article = lot ? produitDuLot(produit, lot) : produit
  return buildCheckoutUrl([{ product: article, quantity: 1 }]) ?? `${SITE}/produits/${produit.slug}/`
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
function gabarit(
  titre: string,
  corps: string,
  bouton: { texte: string; url: string },
  desinscription: string,
  rappel?: { produit: string; prix: string | null }
): string {
  const encart = rappel
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:#f2f7f3;border-radius:8px;">
         <tr><td style="padding:14px 16px;">
           <p style="margin:0;font:400 14px/1.45 -apple-system,Segoe UI,Arial,sans-serif;color:#4a524c;">Votre choix</p>
           <p style="margin:2px 0 0;font:600 16px/1.4 -apple-system,Segoe UI,Arial,sans-serif;color:#1f2420;">${echapper(rappel.produit)}</p>
           ${rappel.prix ? `<p style="margin:4px 0 0;font:700 21px -apple-system,Segoe UI,Arial,sans-serif;color:#1f2420;">${rappel.prix}</p>` : ''}
         </td></tr>
       </table>`
    : ''

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${echapper(titre)}</title></head>
<body style="margin:0;padding:0;background:#f6f7f6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f6;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;">
  <tr><td style="background:#14432f;padding:18px 28px;">
    <span style="font:600 21px Georgia,serif;color:#ffffff;">Bois</span>
    <span style="font:600 21px Georgia,serif;color:#8fcfa8;"> Tresor</span>
    <span style="float:right;font:400 13px -apple-system,Segoe UI,Arial,sans-serif;color:#8fcfa8;line-height:28px;">Entreprise familiale française</span>
  </td></tr>
  <tr><td style="padding:26px 28px 8px;font:400 17px/1.55 -apple-system,Segoe UI,Arial,sans-serif;color:#1f2420;">
    <h1 style="margin:0 0 16px;font:700 22px/1.3 Georgia,serif;color:#1f2420;">${echapper(titre)}</h1>
    ${encart}
    ${corps}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 6px;"><tr>
      <td style="background:#1a6b47;border-radius:8px;">
        <a href="${bouton.url}" style="display:inline-block;padding:16px 32px;font:700 18px -apple-system,Segoe UI,Arial,sans-serif;color:#ffffff;text-decoration:none;">${echapper(bouton.texte)}</a>
      </td>
    </tr></table>
    <p style="margin:0 0 22px;font:400 13px -apple-system,Segoe UI,Arial,sans-serif;color:#767c77;">Paiement sécurisé. Livraison offerte.</p>
  </td></tr>
  <tr><td style="padding:18px 28px 24px;border-top:1px solid #eceeec;font:400 13px/1.6 -apple-system,Segoe UI,Arial,sans-serif;color:#767c77;">
    <p style="margin:0 0 6px;">Bois Tresor, ${ADRESSE_SIEGE.rue}, ${ADRESSE_SIEGE.ville}, ${ADRESSE_SIEGE.pays}</p>
    <p style="margin:0 0 6px;">SIRET ${SIRET} · <a href="${ANNUAIRE_URL}" style="color:#1a6b47;">vérifier sur l’annuaire officiel</a></p>
    <p style="margin:0 0 6px;">Une question : <a href="mailto:${CONTACT_EMAIL}" style="color:#1a6b47;">${CONTACT_EMAIL}</a></p>
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

const SIGNATURE = 'Jean-Paul et Julien\nBois Tresor, entreprise familiale française\nSIRET ' + SIRET

/** Les cinq messages, dans l'ordre du calendrier. */
export function composer(etape: number, lead: LeadRelance, desinscription: string): Message {
  const url = lienPaiement(lead)
  const nom = lead.produit_nom ?? 'votre commande'
  const produit = echapper(nom)
  const prix = montantLisible(lead)
  const rappel = { produit: nom, prix }
  const p = (t: string) => `<p style="margin:0 0 14px;">${t}</p>`
  const pied = (t: string) =>
    `${t}\n\n${SIGNATURE}\nVérifier notre entreprise : ${ANNUAIRE_URL}\nNe plus recevoir ces messages : ${desinscription}`

  switch (etape) {
    case 1:
      return {
        sujet: 'Votre commande n’est pas allée au bout',
        html: gabarit(
          'Votre commande n’est pas allée au bout',
          p('Bonjour,') +
          p('Votre paiement ne s’est pas terminé. Le plus souvent, c’est la banque qui a demandé une confirmation, ou la page qui s’est fermée trop tôt.') +
          p('<strong>Votre choix est encore disponible.</strong> Le bouton ci-dessous vous ramène directement à la page de paiement, avec votre commande déjà prête.') +
          p(`Nous sommes une entreprise familiale française, immatriculée sous le SIRET ${SIRET}. Vous pouvez le vérifier en un clic, le lien est en bas de ce message.`),
          { texte: 'Terminer mon paiement', url },
          desinscription,
          rappel
        ),
        texte: pied(`Bonjour,\n\nVotre paiement ne s'est pas terminé. Le plus souvent, c'est la banque qui a demandé une confirmation, ou la page qui s'est fermée trop tôt.\n\nVotre choix est encore disponible : ${nom}${prix ? ` (${prix})` : ''}.\n\nTerminer mon paiement : ${url}\n\nNous sommes une entreprise familiale française, SIRET ${SIRET}.`),
      }

    case 2:
      return {
        sujet: 'Il ne nous reste qu’une référence de granulés',
        html: gabarit(
          'Il ne nous reste qu’une référence',
          p('Bonjour,') +
          p('Un mot rapide sur nos stocks, parce que ça bouge vite en ce moment.') +
          p('Sur nos <strong>vingt références de granulés, il n’en reste qu’une seule</strong> en vente. Les dix-neuf autres sont parties. C’est la saison : tout le monde se réapprovisionne en même temps.') +
          p('Celle que vous aviez choisie est encore là aujourd’hui. Nous ne reconstituons pas le stock avant l’hiver prochain.') +
          p('Livraison offerte, paiement sécurisé, et une vraie entreprise derrière : vous pouvez vérifier notre immatriculation en bas de ce message.'),
          { texte: 'Terminer ma commande', url },
          desinscription,
          rappel
        ),
        texte: pied(`Bonjour,\n\nSur nos vingt références de granulés, il n'en reste qu'une seule en vente. Les dix-neuf autres sont parties. C'est la saison.\n\nCelle que vous aviez choisie est encore là aujourd'hui : ${nom}${prix ? ` (${prix})` : ''}. Nous ne reconstituons pas avant l'hiver prochain.\n\nTerminer ma commande : ${url}`),
      }

    case 3:
      return {
        sujet: 'Vous pouvez vérifier qui nous sommes',
        html: gabarit(
          'Vous pouvez vérifier qui nous sommes',
          p('Bonjour,') +
          p('C’est la question qu’on nous pose le plus souvent : est-ce qu’il y a une vraie entreprise derrière ce site ? Voici de quoi le vérifier vous-même.') +
          `<ul style="margin:0 0 14px;padding-left:20px;">
             <li style="margin-bottom:8px;">SIRET <strong>${SIRET}</strong>, consultable sur <a href="${ANNUAIRE_URL}" style="color:#1a6b47;">l’annuaire officiel des entreprises</a>, un site de l’État.</li>
             <li style="margin-bottom:8px;">Siège à ${ADRESSE_SIEGE.ville}. Une adresse réelle, pas une boîte postale.</li>
             <li style="margin-bottom:8px;">Vos coordonnées bancaires ne passent jamais par nos serveurs. Le paiement est traité par un prestataire agréé, en 3D-Secure.</li>
             <li style="margin-bottom:8px;">Livraison offerte ${SHIPPING_ZONE}, sans minimum.</li>
           </ul>` +
          p('Et le stock, lui, continue de descendre : il ne reste qu’une référence de granulés sur les vingt que nous proposions.'),
          { texte: 'Reprendre mon paiement', url },
          desinscription,
          rappel
        ),
        texte: pied(`Bonjour,\n\nEst-ce qu'il y a une vraie entreprise derrière ce site ? Voici de quoi le vérifier.\n\n- SIRET ${SIRET}, consultable sur l'annuaire officiel des entreprises : ${ANNUAIRE_URL}\n- Siège à ${ADRESSE_SIEGE.ville}, une adresse réelle.\n- Vos coordonnées bancaires ne passent jamais par nos serveurs, le paiement est en 3D-Secure.\n- Livraison offerte ${SHIPPING_ZONE}, sans minimum.\n\nEt il ne reste qu'une référence de granulés sur les vingt que nous proposions.\n\nReprendre mon paiement : ${url}`),
      }

    case 4:
      return {
        sujet: 'Notre histoire, en deux minutes',
        html: gabarit(
          'Deux frères, et du bois',
          p('Bonjour,') +
          p('Nous sommes Jean-Paul et Julien. Notre père était bûcheron, notre grand-père aussi. On a grandi au milieu des stères, et on se chauffe au bois depuis toujours.') +
          p('C’est pour ça qu’on sait ce que c’est d’attendre une livraison en plein hiver, ou de recevoir du bois vert qui fume et qui ne chauffe pas. On ne vend que ce qu’on brûlerait chez nous.') +
          p('Nous préparons le bois nous-mêmes, et nous répondons nous-mêmes à vos messages. Quand vous écrivez à notre adresse de contact, c’est l’un de nous deux qui vous lit.') +
          p('Il ne reste qu’une référence de granulés en vente. Si c’est celle qu’il vous faut, c’est maintenant.'),
          { texte: 'Terminer ma commande', url },
          desinscription,
          rappel
        ),
        texte: pied(`Bonjour,\n\nNous sommes Jean-Paul et Julien. Notre père était bûcheron, notre grand-père aussi. On a grandi au milieu des stères, et on se chauffe au bois depuis toujours.\n\nOn sait ce que c'est d'attendre une livraison en plein hiver, ou de recevoir du bois vert qui ne chauffe pas. On ne vend que ce qu'on brûlerait chez nous.\n\nNous préparons le bois nous-mêmes, et nous répondons nous-mêmes à vos messages.\n\nIl ne reste qu'une référence de granulés en vente.\n\nTerminer ma commande : ${url}`),
      }

    default:
      return {
        sujet: 'Dernier message : c’est encore disponible',
        html: gabarit(
          'Notre dernier message',
          p('Bonjour,') +
          p('C’est le dernier message que nous vous envoyons. Nous ne voulons pas encombrer votre boîte.') +
          p(`<strong>${produit}</strong> est encore disponible aujourd’hui. C’est la seule référence de granulés qu’il nous reste, et nous ne reconstituons pas avant l’hiver prochain.`) +
          p('Si vous avez trouvé votre bois ailleurs, tant mieux : l’essentiel est que vous passiez l’hiver au chaud. Si vous hésitiez encore, le bouton ci-dessous vous amène directement au paiement.') +
          p('Et si quelque chose vous a retenu chez nous, répondez à ce message. On lit tout, et ça nous aide à nous améliorer.'),
          { texte: 'Terminer ma commande', url },
          desinscription,
          rappel
        ),
        texte: pied(`Bonjour,\n\nC'est le dernier message que nous vous envoyons.\n\n${nom} est encore disponible aujourd'hui. C'est la seule référence de granulés qu'il nous reste, et nous ne reconstituons pas avant l'hiver prochain.\n\nSi vous hésitiez encore : ${url}\n\nEt si quelque chose vous a retenu chez nous, répondez à ce message. On lit tout.`),
      }
  }
}
