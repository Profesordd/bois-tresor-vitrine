import RetourPaiement from '@/components/shop/RetourPaiement'

export const dynamic = 'force-dynamic'

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
  /* Après un achat partenaire réussi, on renvoie le client vers l'URL du
     partenaire plutôt que sur une page de remerciement. Lue au runtime,
     elle se change par variable d'environnement sans toucher au code. */
  return <RetourPaiement redirectPartenaire={process.env.PARTENAIRE_REDIRECT_URL ?? null} />
}
