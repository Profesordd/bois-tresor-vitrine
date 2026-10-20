import RetourCawl from '@/components/admin/RetourCawl'

export const metadata = { title: 'Confirmation du paiement', robots: { index: false, follow: false } }

/**
 * Adresse de retour du 3-D Secure pour le checkout maison.
 *
 * Même composant que le banc d'essai : la banque n'y envoie que l'iframe,
 * la page prévient le parent et c'est lui qui confirme la commande.
 */
export default function RetourCommandePage() {
  return <RetourCawl />
}
