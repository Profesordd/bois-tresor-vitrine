export const metadata = { title: 'CGV — Conditions Générales de Vente' }

export default function CgvPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-ink mb-2 font-serif">Conditions Générales de Vente</h1>
      <p className="text-gray-400 text-sm mb-10">Bois Tresor</p>

      <div className="prose prose-gray max-w-none text-gray-700 space-y-8">
        {[
          { title: '1. Produits', body: 'Les produits proposés sont ceux figurant sur le site au moment de la consultation, dans la limite des stocks disponibles. Les photographies sont fournies à titre indicatif et n’ont pas de valeur contractuelle.' },
          { title: '2. Prix', body: 'Les prix sont indiqués en euros toutes taxes comprises (TTC), hors frais de livraison éventuels. Bois Tresor se réserve le droit de modifier ses prix à tout moment ; le Client est facturé sur la base du tarif en vigueur au moment de la confirmation de la commande.' },
          { title: '3. Commande', body: 'Le Client valide sa commande après avoir vérifié le détail de son panier. Cette validation vaut acceptation des descriptifs produits et des prix affichés.' },
          { title: '4. Paiement', body: 'Le paiement s’effectue en ligne par carte bancaire (CB, Visa, Mastercard) via une plateforme bancaire certifiée PCI-DSS, avec authentification 3D-Secure. Bois Tresor n’a jamais accès aux informations de carte bancaire.' },
          { title: '5. Livraison', body: 'Les produits sont livrés à l’adresse indiquée par le Client, partout en France métropolitaine, par transporteur spécialisé, avec déchargement au plus près du lieu de stockage. La livraison est offerte à partir de 89 € d’achat. En dessous de ce montant, les frais de livraison sont affichés dans le panier avant toute validation de commande. Les délais indiqués sont donnés à titre approximatif.' },
          { title: '6. Droit de rétractation', body: 'Le Client dispose de 14 jours à compter de la réception pour exercer son droit de rétractation, conformément au Code de la consommation.' },
          { title: '7. Garanties', body: 'Les produits bénéficient de la garantie légale de conformité et de la garantie contre les vices cachés.' },
          { title: '8. Droit applicable', body: 'Les présentes CGV sont soumises au droit français. En cas de litige, les parties rechercheront une solution amiable avant toute action judiciaire.' },
        ].map(({ title, body }) => (
          <section key={title}>
            <h2 className="text-xl font-bold text-ink">{title}</h2>
            <p>{body}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
