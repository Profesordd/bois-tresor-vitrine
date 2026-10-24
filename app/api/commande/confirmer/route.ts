import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { lirePaiement, capturerPaiement, STATUTS_REFUS, STATUTS_DEJA_ENCAISSES } from '@/lib/cawl'
import { envoyerCapi } from '@/lib/analytics/capi'

/**
 * Confirmation d'une commande après le 3-D Secure.
 *
 * ⚠️ Le statut est relu chez CAWL, jamais pris du navigateur. Un visiteur
 * qui appellerait cette route à la main ne peut donc pas faire passer sa
 * commande en « payee » : c'est le serveur CAWL qui tranche.
 */
export async function POST(req: NextRequest) {
  const { commandeId } = await req.json().catch(() => ({}))
  if (typeof commandeId !== 'string' || !commandeId) {
    return NextResponse.json({ error: 'Commande manquante' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: commande } = await supabase
    .from('commandes')
    .select('id, reference, statut, montant_cents, paiement_id, produit_slug, produit_nom, email, lot, canal')
    .eq('id', commandeId)
    .maybeSingle()

  if (!commande) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })

  /* Déjà confirmée : on renvoie la même réponse, sans rien refaire — mais
     on s'assure quand même que la relance est bien coupée. Les commandes
     payées avant le correctif de l'écriture `void` n'avaient jamais mis ce
     marqueur, et leurs acheteurs continuaient d'être relancés. */
  if (commande.statut === 'payee') {
    await supabase.from('leads')
      .update({ a_commande: true, commande_a: new Date().toISOString() })
      .eq('email', commande.email as string)
      .eq('a_commande', false)
    return NextResponse.json({
      ok: true,
      reference: commande.reference,
      canal: commande.canal,
      montantEur: Number(((commande.montant_cents as number) / 100).toFixed(2)),
      produitSlug: commande.produit_slug,
      produitNom: commande.produit_nom,
    })
  }
  if (!commande.paiement_id) {
    return NextResponse.json({ error: 'Aucun paiement associé' }, { status: 409 })
  }

  try {
    const paiement = await lirePaiement(commande.paiement_id as string)

    if (STATUTS_REFUS.includes(paiement.statut)) {
      await supabase.from('commandes')
        .update({ statut: 'refusee', paiement_statut: paiement.statut })
        .eq('id', commande.id)
      /* Le slug et le lot accompagnent l'échec : la page de retour peut
         alors proposer de recommencer sur la bonne fiche au lieu d'un
         cul-de-sac. Ces clients avaient une carte valide. */
      return NextResponse.json({
        error: `Paiement refusé (${paiement.statut})`,
        produitSlug: commande.produit_slug,
        lot: commande.lot,
        canal: commande.canal,
      }, { status: 402 })
    }

    if (paiement.statut === 'PENDING_CAPTURE') {
      const pris = await capturerPaiement(commande.paiement_id as string, paiement.montantCents)
      if (!pris) {
        await supabase.from('commandes')
          .update({ statut: 'refusee', paiement_statut: paiement.statut })
          .eq('id', commande.id)
        return NextResponse.json({ error: 'Capture refusée' }, { status: 402 })
      }
    } else if (!STATUTS_DEJA_ENCAISSES.includes(paiement.statut)) {
      /* Statut inconnu : on ne déclare jamais une commande payée par défaut. */
      return NextResponse.json({ error: `Statut inattendu (${paiement.statut})` }, { status: 402 })
    }

    await supabase.from('commandes')
      .update({ statut: 'payee', paiement_statut: paiement.statut, payee_a: new Date().toISOString() })
      .eq('id', commande.id)

    /* L'achat part aussi vers Meta depuis le serveur, avec l'identifiant de
       la commande comme `event_id`. La page de remerciement enverra le même
       événement depuis le navigateur, avec le même identifiant : Meta les
       rapproche et n'en compte qu'un. L'envoi serveur est celui qui compte,
       il arrive même si le pixel est bloqué.

       Il ne retient jamais la réponse : une commande payée doit être
       confirmée au client, que Meta réponde ou non. */
    /* La relance n'a plus lieu d'être : cette personne a acheté. Le
       rapprochement se fait par l'adresse, la seule chose que les deux
       tables ont en commun.

       ⚠️ Attendu, pas `void`. En serverless, la fonction peut être gelée
       dès la réponse envoyée : une écriture non attendue n'arrive jamais.
       C'est ce qui laissait des acheteurs recevoir encore des relances. */
    await supabase.from('leads')
      .update({ a_commande: true, commande_a: new Date().toISOString() })
      .eq('email', commande.email as string)
      .eq('a_commande', false)

    /* L'achat ne remonte à Meta que pour le canal du site : une vente du
       partenaire n'est pas une conversion de bois-tresor. Attendu lui
       aussi, pour la même raison : sinon l'événement serveur se perd. */
    if (commande.canal === 'site') await envoyerCapi([{
      nom: 'Purchase',
      eventId: commande.id as string,
      url: `${(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.bois-tresor.com').replace(/\/$/, '')}/commande/merci/`,
      utilisateur: {
        ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
        userAgent: req.headers.get('user-agent'),
        fbp: req.cookies.get('_fbp')?.value ?? null,
        fbc: req.cookies.get('_fbc')?.value ?? null,
        email: commande.email as string,
      },
      donnees: {
        content_type: 'product',
        content_ids: [commande.produit_slug],
        content_name: commande.produit_nom,
        value: Number(((commande.montant_cents as number) / 100).toFixed(2)),
        currency: 'EUR',
        order_id: commande.reference,
      },
    }]).then((r) => {
      if (!r.ok) console.error('[purchase/capi]', r.status, JSON.stringify(r.corps).slice(0, 300))
    })

    return NextResponse.json({
      ok: true,
      reference: commande.reference,
      canal: commande.canal,
      montantEur: Number(((commande.montant_cents as number) / 100).toFixed(2)),
      produitSlug: commande.produit_slug,
      produitNom: commande.produit_nom,
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 502 })
  }
}
