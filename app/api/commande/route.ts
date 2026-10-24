import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getProductBySlug } from '@/lib/products'
import { lotsDisponibles, quantiteMaximum } from '@/lib/lots'
import { estUnRobot } from '@/lib/analytics/geo'

/**
 * Enregistrement d'une commande, avant le paiement.
 *
 * ⚠️ Le montant n'est JAMAIS lu dans la requête. Il est recalculé ici à
 * partir du produit et du lot, d'après le catalogue. Faire confiance au
 * navigateur reviendrait à laisser n'importe qui fixer son propre prix.
 *
 * La commande naît « en_attente ». Seule la confirmation du serveur CAWL
 * la fera passer à « payee ».
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i
const PAYS_LIVRES = ['FR', 'BE', 'CH', 'LU', 'MC']
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function texte(v: unknown, max: number): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim().slice(0, max) : null
}

/** Référence lisible, du type BT-7F3A2B : dictable au téléphone. */
function reference(): string {
  const lettres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += lettres[Math.floor(Math.random() * lettres.length)]
  return `BT-${s}`
}

export async function POST(req: NextRequest) {
  if (estUnRobot(req.headers.get('user-agent'))) {
    return NextResponse.json({ error: 'Requête refusée' }, { status: 403 })
  }

  const b = await req.json().catch(() => null)

  /* Deux canaux. « site » : le checkout de bois-tresor, réservé aux fiches
     checkoutInterne. « partenaire » : un autre site qui redirige ses
     paiements ici ; il peut régler n'importe quel produit du catalogue,
     car ce sont nos produits, et le montant sort de toute façon du
     catalogue. Les deux restent comptés séparément par cette étiquette. */
  const canal = b?.canal === 'partenaire' ? 'partenaire' : 'site'

  const produit = typeof b?.produitSlug === 'string' ? getProductBySlug(b.produitSlug) : null
  if (!produit) return NextResponse.json({ error: 'Produit inconnu' }, { status: 400 })
  /* Sur le site, c'est `checkoutInterne` qui autorise la commande. Les
     fiches masquées (`unlisted`) mais checkoutInterne — la fiche B du test
     A/B, le produit d'essai — se commandent légitimement par leur URL ou
     par une pub. Le blocage des produits masqués ne vaut donc que pour le
     canal partenaire, qui lui est ouvert à tout le catalogue. */
  if (canal === 'site' && !produit.checkoutInterne) {
    return NextResponse.json({ error: 'Ce produit ne se règle pas ici' }, { status: 400 })
  }
  if (canal === 'partenaire' && produit.unlisted) {
    return NextResponse.json({ error: 'Produit inconnu' }, { status: 400 })
  }

  /* Le prix sort du catalogue, jamais de la requête. */
  const lots = lotsDisponibles(produit)
  const lot = lots.length > 0
    ? (lots.find((l) => l.id === b?.lot) ?? lots[0])
    : null
  /* Quantité bornée côté serveur. Un lot impose son propre maximum ; un
     produit sans lot acheté via le partenaire se prend jusqu'à dix. */
  const maxQuantite = lot ? quantiteMaximum(lot) : (canal === 'partenaire' ? 10 : 1)
  const demandee = Number(b?.quantite)
  const quantite = Number.isFinite(demandee)
    ? Math.min(maxQuantite, Math.max(1, Math.floor(demandee)))
    : 1
  const unitaireCents = Math.round((lot ? lot.price : produit.price) * 100)
  const montantCents = unitaireCents * quantite
  if (!Number.isInteger(montantCents) || montantCents <= 0) {
    return NextResponse.json({ error: 'Montant indisponible' }, { status: 400 })
  }

  const champs = {
    email: texte(b?.email, 200),
    prenom: texte(b?.prenom, 80),
    nom: texte(b?.nom, 80),
    telephone: texte(b?.telephone, 40),
    adresse: texte(b?.adresse, 200),
    code_postal: texte(b?.codePostal, 20),
    ville: texte(b?.ville, 120),
  }
  const manquant = Object.entries(champs).find(([, v]) => !v)
  if (manquant) return NextResponse.json({ error: `Champ manquant : ${manquant[0]}` }, { status: 400 })
  if (!EMAIL_RE.test(champs.email!)) {
    return NextResponse.json({ error: 'Adresse e-mail invalide' }, { status: 400 })
  }

  const pays = typeof b?.pays === 'string' && PAYS_LIVRES.includes(b.pays) ? b.pays : 'FR'
  const sessionId = texte(b?.sessionId, 40)

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('commandes')
    .insert({
      reference: reference(),
      produit_slug: produit.slug,
      produit_nom: (lot ? `${produit.name} — ${lot.poids}` : produit.name)
        + (quantite > 1 ? ` × ${quantite}` : ''),
      lot: lot?.id ?? null,
      quantite,
      canal,
      montant_cents: montantCents,
      ...champs,
      email: champs.email!.toLowerCase(),
      complement: texte(b?.complement, 200),
      pays,
      session_id: sessionId && UUID_RE.test(sessionId) ? sessionId : null,
      ip_client: req.headers.get('x-forwarded-for')?.split(',')[0].trim()
        ?? req.headers.get('x-real-ip') ?? null,
    })
    .select('id, reference, montant_cents')
    .single()

  if (error || !data) {
    console.error('[commande] insertion impossible', error?.message)
    return NextResponse.json({ error: 'Enregistrement impossible' }, { status: 502 })
  }

  /* L'adresse rejoint la séquence de relance.
     Le checkout l'enregistre déjà à la sortie du champ, mais le
     remplissage automatique du téléphone ne déclenche aucune sortie de
     champ : sans ce second filet, un client qui remplit tout d'un geste
     puis échoue au paiement ne recevrait jamais rien. Or c'est le plus
     chaud de tous, il avait sorti sa carte.
     Rien ne retient la réponse : une relance manquée ne doit pas empêcher
     une commande de naître. */
  /* Les relances sont celles de bois-tresor, avec ses liens et sa marque.
     Une commande partenaire n'y a pas sa place : son client n'est pas le
     nôtre. */
  if (canal === 'site') void (async () => {
    const adresse = champs.email!.toLowerCase()
    const { data: deja } = await supabase
      .from('leads')
      .select('id')
      .eq('email', adresse)
      .eq('a_commande', false)
      .gte('created_at', new Date(Date.now() - 12 * 86400_000).toISOString())
      .limit(1)
    if (deja && deja.length > 0) return
    await supabase.from('leads').insert({
      email: adresse,
      telephone: champs.telephone,
      consent: false,
      produit_slug: produit.slug,
      produit_nom: lot ? `${produit.name} — ${lot.poids}` : produit.name,
      lot: lot?.id ?? null,
      montant: montantCents / 100,
      session_id: sessionId && UUID_RE.test(sessionId) ? sessionId : null,
      pays,
    })
  })().catch(() => { /* la commande prime sur la relance */ })

  return NextResponse.json({
    ok: true,
    commandeId: data.id,
    reference: data.reference,
    montantCents: data.montant_cents,
  })
}
