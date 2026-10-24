import { SIRET, ADRESSE_SIEGE, CONTACT_EMAIL, ANNUAIRE_URL, SHIPPING_ZONE } from '@/lib/site'
import { getProductBySlug } from '@/lib/products'
import { lotsDisponibles, produitDuLot } from '@/lib/lots'
import { buildCheckoutUrl } from '@/lib/checkout'

/**
 * Les cinq relances envoyées après un paiement non abouti.
 *
 * Calendrier : 30 min, 3 h, J+1, J+2, J+3. Deux messages le premier jour,
 * puis un par jour. L'essentiel d'un panier abandonné se récupère dans la
 * première heure, et au-delà de trois jours un prospect qui n'a pas
 * répondu a trouvé son bois ailleurs.
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

/**
 * Délais depuis le moment où l'adresse a été laissée, en minutes.
 * L'index vaut l'étape moins un.
 *
 * ⚠️ C'est le moment où le message devient DÛ, pas celui où il part. Le
 * planificateur de `vercel.json` ne l'envoie qu'à son passage suivant :
 * sa fréquence doit rester nettement plus courte que le premier délai,
 * sinon les trente minutes ci-dessous n'ont aucun effet.
 */
export const DELAIS_MINUTES = [30, 60, 90] as const
export const NB_ETAPES = DELAIS_MINUTES.length

/** Libellé lisible d'un délai, pour l'administration. */
export function libelleDelai(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  if (minutes < 1440) return `${minutes / 60} h`
  return `J+${minutes / 1440}`
}

/**
 * L'adresse de paiement d'origine, reconstruite.
 *
 * Repli sur la fiche produit si le produit a disparu du catalogue ou n'a
 * plus d'identifiant de variante : mieux vaut une fiche qu'un lien mort.
 */
export function lienPaiement(lead: LeadRelance): string {
  const produit = lead.produit_slug ? getProductBySlug(lead.produit_slug) : null
  if (!produit) return `${SITE}/produits/`

  /* Les fiches qui se règlent sur le site ont leur propre adresse de
     paiement. Les envoyer chez le prestataire externe donnerait un panier
     vide, ou pire un prix qui ne correspond à rien. */
  if (produit.checkoutInterne) {
    const q = lead.lot ? `?lot=${encodeURIComponent(lead.lot)}` : ''
    return `${SITE}/commande/${produit.slug}/${q}`
  }

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

const SIGNATURE = 'Cordialement,\nJean\nBois Tresor, entreprise familiale française\nSIRET ' + SIRET

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
    /* Le message le plus important des cinq : il part une heure après le
       clic, quand la personne a encore son produit en tête. On ne lui
       explique rien, on lui rappelle ce qu'elle voulait, ce qu'il en reste,
       et on lui donne le bouton. L'explication du refus de carte est
       supprimée. Elle supposait que la personne avait sorti sa carte et que
       le paiement avait planté ; or la plupart repartent du paiement sans
       rien saisir. On lui parlait donc d'un problème qu'elle n'a pas eu, et
       on allongeait le seul message qui tire sa force d'être court.

       Un seul passage en gras, celui qui fait décider. Tout mettre en gras
       revient à ne rien mettre en gras. Et aucune phrase de remplissage :
       « il vous reste une minute à faire », « nous ne reconstituons pas
       avant l'hiver prochain », tout cela a été retiré le 20/10/2026, ça ne
       disait rien et ça diluait la seule information utile. */
    case 1:
      return {
        sujet: 'Votre commande vous attend, plus qu’une référence en stock',
        html: gabarit(
          'Votre commande vous attend',
          p('Bonjour,') +
          p('Votre commande n’est pas validée : le paiement n’est pas allé au bout.') +
          p('<strong>Sur nos vingt références de granulés, il n’en reste qu’une seule en vente. C’est la vôtre.</strong>') +
          p('Quand elle sera partie, il n’y aura plus de granulés sur le site.'),
          { texte: 'Payer ma commande maintenant', url },
          desinscription,
          rappel
        ),
        texte: pied(`Bonjour,

Votre commande n'est pas validée : le paiement n'est pas allé au bout.

Sur nos vingt références de granulés, il n'en reste qu'une seule en vente. C'est la vôtre : ${nom}${prix ? ` (${prix})` : ''}.

Quand elle sera partie, il n'y aura plus de granulés sur le site.

Payer ma commande maintenant : ${url}`),
      }
    case 2:
      return {
        sujet: 'Votre granulé part, il ne nous en reste qu’un lot',
        html: gabarit(
          'Votre granulé part vite',
          p('Bonjour,') +
          p('Un mot rapide, parce que ça bouge vite.') +
          p('<strong>Le granulé que vous avez choisi est le dernier que nous ayons encore en vente.</strong> Les autres références sont toutes parties.') +
          p('C’est un déstockage. Une fois ce lot écoulé, il ne reviendra pas à ce prix.') +
          p('Votre commande est prête, il ne manque que le paiement.') +
          p('Cordialement,<br>Jean'),
          { texte: 'Terminer ma commande', url },
          desinscription,
          rappel
        ),
        texte: pied(`Bonjour,

Un mot rapide, parce que ça bouge vite.

Le granulé que vous avez choisi est le dernier que nous ayons encore en vente. Les autres références sont toutes parties.

C'est un déstockage. Une fois ce lot écoulé, il ne reviendra pas à ce prix.

Votre commande est prête, il ne manque que le paiement : ${nom}${prix ? ` (${prix})` : ''}.

Terminer ma commande : ${url}`),
      }

    default:
      return {
        sujet: 'Dernière alerte : il ne reste presque plus rien',
        html: gabarit(
          'Dernière alerte',
          p('Bonjour,') +
          p('C’est le dernier message que je vous envoie à ce sujet.') +
          p('<strong>Il ne reste presque plus de stock sur ce granulé.</strong> C’est notre dernière référence en vente, en fin de déstockage, et elle part plus vite que prévu avec la saison qui démarre.') +
          p('Quand elle sera épuisée, elle disparaîtra du site. Nous ne la réapprovisionnons pas à ce prix.') +
          p('Votre commande est encore réservée à cet instant. Dans quelques heures, je ne peux rien vous garantir.') +
          p('Cordialement,<br>Jean'),
          { texte: 'Payer maintenant, avant que ce soit parti', url },
          desinscription,
          rappel
        ),
        texte: pied(`Bonjour,

C'est le dernier message que je vous envoie à ce sujet.

Il ne reste presque plus de stock sur ce granulé. C'est notre dernière référence en vente, en fin de déstockage, et elle part plus vite que prévu avec la saison qui démarre.

Quand elle sera épuisée, elle disparaîtra du site. Nous ne la réapprovisionnons pas à ce prix.

Votre commande est encore réservée à cet instant : ${nom}${prix ? ` (${prix})` : ''}. Dans quelques heures, je ne peux rien vous garantir.

Payer maintenant : ${url}`),
      }
  }
}
