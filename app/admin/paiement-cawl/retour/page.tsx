import RetourCawl from '@/components/admin/RetourCawl'

export const metadata = { title: 'Retour CAWL', robots: { index: false, follow: false } }

/**
 * Page de retour du 3-D Secure.
 *
 * C'est l'adresse donnée à CAWL en `returnUrl`. La banque y envoie le
 * navigateur une fois l'authentification terminée, le plus souvent à
 * l'intérieur de l'iframe. Elle ne fait que prévenir la page parente.
 */
export default function RetourCawlPage() {
  return <RetourCawl />
}
