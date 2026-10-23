import RetourPartenaire from '@/components/shop/RetourPartenaire'

export const dynamic = 'force-dynamic'
export const metadata = { title: { absolute: 'Confirmation du paiement' }, robots: { index: false, follow: false } }

/**
 * Adresse de retour du 3-D Secure pour le canal partenaire.
 *
 * Sous /commande/partenaire/ : exclue du pixel de bois-tresor. Elle
 * confirme la commande, déclenche le Purchase du pixel Burban, puis renvoie
 * le client vers le site du partenaire (PARTENAIRE_REDIRECT_URL).
 */
export default function RetourPartenairePage() {
  return <RetourPartenaire redirectUrl={process.env.PARTENAIRE_REDIRECT_URL ?? null} />
}
