import RetourPaiement from '@/components/shop/RetourPaiement'

export const metadata = { title: 'Confirmation du paiement', robots: { index: false, follow: false } }

/**
 * Adresse de retour du 3-D Secure, pour le checkout maison.
 *
 * La banque y renvoie la page entière depuis le 22/10/2026 : le cadre
 * cassait l'authentification silencieuse. La page confirme donc la
 * commande elle-même, à partir de l'identifiant posé dans `returnUrl`.
 *
 * Le banc d'essai de l'administration a sa propre adresse de retour, il
 * ne passe pas par ici.
 */
export default function RetourCommandePage() {
  return <RetourPaiement />
}
