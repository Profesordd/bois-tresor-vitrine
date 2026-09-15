import CollectionView from '@/components/shop/CollectionView'

export const metadata = {
  title: 'Bois de chauffage sec & granulés — livraison offerte',
  description:
    'Entreprise familiale française. Bois de chauffage sec prêt à brûler (moins de 20 % d’humidité) et granulés certifiés. Livraison offerte, paiement sécurisé.',
}

interface Props {
  searchParams: Promise<{ categorie?: string }>
}

export default async function ProduitsPage({ searchParams }: Props) {
  const { categorie } = await searchParams
  return <CollectionView categorySlug={categorie} />
}
