export const metadata = { title: 'Retours & rétractation' }

export default function PolitiqueRetourPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-ink mb-2 font-serif">Retours & rétractation</h1>
      <p className="text-gray-500 mb-10">
        Chez Bois Tresor, votre satisfaction est une priorité. Si un produit ne vous convient pas,
        vous disposez d’un délai de 14 jours à compter de la réception pour demander un retour ou un remboursement.
      </p>

      <div className="prose prose-gray max-w-none text-gray-700 space-y-8">
        <section>
          <h2 className="text-xl font-bold text-ink">Droit de rétractation</h2>
          <p>Vous disposez de 14 jours calendaires à compter de la réception pour exercer votre droit de rétractation, sans justification.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-ink">Conditions de retour</h2>
          <p>Les produits doivent être non utilisés et dans leur conditionnement d’origine, et la demande formulée dans les 14 jours suivant la réception. Le bois de chauffage déjà utilisé ou partiellement consommé ne peut être retourné, sauf défaut de conformité (essence, humidité ou quantité).</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-ink">Procédure</h2>
          <p>Contactez-nous à contact@bois-tresor.com avec votre numéro de commande et le détail du produit concerné ; nous vous indiquerons la marche à suivre.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-ink">Remboursement</h2>
          <p>Après vérification, le remboursement est effectué sous 14 jours, sur le moyen de paiement utilisé lors de la commande.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-ink">Produit défectueux</h2>
          <p>En cas de produit endommagé ou non conforme, contactez-nous avec une photo : remplacement ou remboursement immédiat.</p>
        </section>
      </div>
    </div>
  )
}
