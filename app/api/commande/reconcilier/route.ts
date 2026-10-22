import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { lirePaiement, cawlConfigure, STATUTS_DEJA_ENCAISSES, STATUTS_REFUS } from '@/lib/cawl'
import { envoyerCapi } from '@/lib/analytics/capi'

/**
 * Rattrapage des paiements laissés en suspens.
 *
 * Le client qui ferme son onglet pendant le 3-D Secure ne revient jamais
 * sur `/api/commande/confirmer/`. Sa commande reste « en_attente » pour
 * toujours, alors que la banque, elle, a tranché. Sans ce rattrapage le
 * tableau de bord ment deux fois : il appelle « abandonnées » des
 * commandes refusées, et il raterait un paiement réellement encaissé dont
 * personne n'aurait connaissance.
 *
 * On redemande donc le statut à CAWL, qui est la seule source de vérité.
 * Jamais au navigateur, qui n'est plus là, et qui pourrait mentir.
 *
 * Le délai de grâce évite de doubler la route de confirmation sur un
 * paiement encore en cours de validation : un client peut rester plusieurs
 * minutes sur l'écran de sa banque.
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** En deçà, le client est peut-être encore devant l'écran de sa banque. */
const GRACE_MINUTES = 15
/** Au-delà, CAWL a de toute façon clos la transaction. */
const FENETRE_JOURS = 7
/** Au-delà, on s'arrête : l'exécution suivante prendra la suite. */
const LOT_MAX = 40

function autorise(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  return !secret || req.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!autorise(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  if (!cawlConfigure()) return NextResponse.json({ error: 'CAWL non configuré' }, { status: 503 })

  const supabase = createAdminClient()
  const maintenant = Date.now()

  const { data, error } = await supabase
    .from('commandes')
    .select('id, reference, montant_cents, paiement_id, email, produit_slug, produit_nom')
    .eq('statut', 'en_attente')
    .not('paiement_id', 'is', null)
    .lt('created_at', new Date(maintenant - GRACE_MINUTES * 60_000).toISOString())
    .gt('created_at', new Date(maintenant - FENETRE_JOURS * 86_400_000).toISOString())
    .order('created_at', { ascending: false })
    .limit(LOT_MAX)

  if (error) {
    console.error('[reconcilier] lecture impossible', error.message)
    return NextResponse.json({ error: 'Lecture impossible' }, { status: 502 })
  }

  const bilan = { vues: data?.length ?? 0, payees: 0, refusees: 0, enCours: 0, erreurs: 0 }

  for (const c of data ?? []) {
    try {
      const p = await lirePaiement(c.paiement_id!)

      if (STATUTS_DEJA_ENCAISSES.includes(p.statut)) {
        /* Le montant est relu chez CAWL : si la somme encaissée ne
           correspond pas à la commande, on ne la marque pas payée, on la
           signale. Mieux vaut une alerte qu'une expédition à tort. */
        const conforme = p.montantCents === c.montant_cents
        await supabase.from('commandes').update({
          statut: conforme ? 'payee' : 'en_attente',
          paiement_statut: p.statut,
          payee_a: conforme ? new Date().toISOString() : null,
          erreur: conforme ? null : `Montant encaissé ${p.montantCents} au lieu de ${c.montant_cents}`,
        }).eq('id', c.id)
        if (conforme) {
          bilan.payees++
          /* L'achat n'a jamais été remonté à Meta : le client n'est pas
             revenu, donc ni le pixel ni la route de confirmation n'ont
             tourné. Même `event_id` que partout ailleurs, pour que Meta
             n'en compte qu'un si le client revient plus tard. */
          void envoyerCapi([{
            nom: 'Purchase',
            eventId: c.id,
            url: `${(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.bois-tresor.com').replace(/\/$/, '')}/commande/merci/`,
            utilisateur: { ip: null, userAgent: null, fbp: null, fbc: null, email: c.email },
            donnees: {
              content_type: 'product',
              content_ids: [c.produit_slug],
              content_name: c.produit_nom,
              value: Number((c.montant_cents / 100).toFixed(2)),
              currency: 'EUR',
              order_id: c.reference,
            },
          }]).then((r) => { if (!r.ok) console.error('[reconcilier/capi]', r.status) })
        } else bilan.erreurs++
        console.warn(`[reconcilier] ${c.reference} rattrapée : ${p.statut}${conforme ? '' : ' MONTANT DIFFÉRENT'}`)
        continue
      }

      if (STATUTS_REFUS.includes(p.statut) && p.statut !== 'REDIRECTED' && p.statut !== 'CREATED') {
        await supabase.from('commandes')
          .update({ statut: 'refusee', paiement_statut: p.statut })
          .eq('id', c.id)
        bilan.refusees++
        continue
      }

      /* Toujours chez la banque. On garde le statut à jour sans trancher :
         le passage suivant reposera la question. */
      await supabase.from('commandes').update({ paiement_statut: p.statut }).eq('id', c.id)
      bilan.enCours++
    } catch (err) {
      bilan.erreurs++
      console.error('[reconcilier]', c.reference, err instanceof Error ? err.message : err)
    }
  }

  return NextResponse.json({ ok: true, ...bilan })
}
