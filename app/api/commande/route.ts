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

  const produit = typeof b?.produitSlug === 'string' ? getProductBySlug(b.produitSlug) : null
  if (!produit) return NextResponse.json({ error: 'Produit inconnu' }, { status: 400 })
  if (!produit.checkoutInterne) {
    return NextResponse.json({ error: 'Ce produit ne se règle pas ici' }, { status: 400 })
  }

  /* Le prix sort du catalogue, jamais de la requête. */
  const lots = lotsDisponibles(produit)
  const lot = lots.length > 0
    ? (lots.find((l) => l.id === b?.lot) ?? lots[0])
    : null
  const demandee = Number(b?.quantite)
  const quantite = Number.isFinite(demandee)
    ? Math.min(quantiteMaximum(lot), Math.max(1, Math.floor(demandee)))
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

  return NextResponse.json({
    ok: true,
    commandeId: data.id,
    reference: data.reference,
    montantCents: data.montant_cents,
  })
}
