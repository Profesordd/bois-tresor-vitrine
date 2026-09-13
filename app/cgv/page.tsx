export const metadata = { title: 'CGV — Conditions Générales de Vente' }

export default function CgvPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-brand-900 mb-2 font-serif">Conditions Générales de Vente</h1>
      <p className="text-brand-400 text-sm mb-4">Document type — à faire valider par un professionnel du droit avant mise en ligne réelle.</p>
      <p className="text-brand-400 text-sm mb-10">Dernière mise à jour : à compléter</p>

      <div className="prose prose-gray max-w-none text-brand-700 space-y-8">
        {[
          { title: '1. Objet', body: 'Les présentes Conditions Générales de Vente (CGV) régissent les ventes de bois de chauffage et de granulés de bois effectuées sur le site Bois Trésor. Toute commande implique l’acceptation pleine et entière des présentes CGV.' },
          { title: '2. Produits', body: 'Les produits proposés (bûches, bois densifié, bûches compressées, granulés) sont décrits sur le site au moment de la commande, avec leurs caractéristiques techniques (essence, taux d’humidité, conditionnement). Les visuels du site sont illustratifs et sans valeur contractuelle tant que les photographies définitives des produits n’ont pas été intégrées.' },
          { title: '3. Prix', body: 'Les prix sont indiqués en euros TTC. Bois Trésor se réserve le droit de modifier ses prix à tout moment, notamment en fonction des variations du marché du bois-énergie. Les produits sont facturés au prix en vigueur au moment de la validation de la commande.' },
          { title: '4. Commande', body: 'La commande n’est définitive qu’après validation du paiement. Un email de confirmation est envoyé à l’acheteur. Sur ce site de démonstration, aucun paiement réel n’est traité.' },
          { title: '5. Paiement', body: 'Le paiement s’effectuera en ligne par carte bancaire via un prestataire de paiement sécurisé, une fois le moyen de paiement définitif intégré par le client.' },
          { title: '6. Livraison', body: 'Les palettes et conditionnements sont expédiés par transporteur. Les délais indiqués sont donnés à titre indicatif. Bois Trésor ne saurait être tenu responsable des retards imputables au transporteur.' },
          { title: '7. Rétractation', body: 'Conformément à l’article L221-18 du Code de la consommation, le client dispose d’un délai de 14 jours à compter de la réception pour exercer son droit de rétractation, sous réserve des exceptions légales applicables aux biens susceptibles de se détériorer ou périmer rapidement.' },
          { title: '8. Garantie', body: 'Tous les produits bénéficient de la garantie légale de conformité et de la garantie contre les vices cachés, conformément au Code civil et au Code de la consommation.' },
          { title: '9. Responsabilité', body: 'La responsabilité de Bois Trésor est limitée au montant de la commande concernée. Bois Trésor ne saurait être tenu responsable des dommages indirects.' },
          { title: '10. Droit applicable', body: 'Les présentes CGV sont soumises au droit français. Tout litige sera soumis aux tribunaux compétents du ressort du siège social de Bois Trésor.' },
        ].map(({ title, body }) => (
          <section key={title}>
            <h2 className="text-xl font-bold text-brand-900">{title}</h2>
            <p>{body}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
