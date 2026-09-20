export const metadata = { title: 'Livraison' }

export default function LivraisonPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-ink mb-2 font-serif">Livraison</h1>
      <p className="text-gray-500 mb-10">Bois de chauffage et granulés livrés en France métropolitaine, en Belgique, en Suisse et au Luxembourg, directement chez vous.</p>

      <div className="prose prose-gray max-w-none text-gray-700 space-y-8">
        <section>
          <h2 className="text-xl font-bold text-ink">Mode de livraison</h2>
          <p>Le bois est acheminé par transporteur spécialisé, sur palette filmée ou en vrac selon le produit. Son camion est équipé d’un hayon et d’un chariot élévateur adapté au bois : la palette est déposée au plus près de votre lieu de stockage, y compris lorsque l’accès est difficile.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-ink">Délais</h2>
          <p>Votre commande est préparée sous 48 h ouvrées et livrée en 3 à 7 jours ouvrés selon votre région. Vous êtes informé par e-mail dès l’expédition ; pour les commandes volumineuses, une prise de rendez-vous de livraison peut être nécessaire.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-ink">À la réception</h2>
          <p>Indiquez-nous les particularités de votre accès après votre commande : chemin étroit, pente, portail. Nous nous organisons en conséquence. Vérifiez la quantité et l’état de la marchandise à l’arrivée, puis stockez le bois à l’abri de la pluie, surélevé et dans un endroit ventilé pour préserver sa qualité.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-ink">Frais de livraison</h2>
          <p>
            La livraison est offerte sur toutes les commandes, sans montant minimum, en France
            métropolitaine comme en Belgique, en Suisse et au Luxembourg. Le prix affiché sur le site est le prix
            payé : rien ne s’ajoute au moment du paiement.
          </p>
        </section>
      </div>
    </div>
  )
}
