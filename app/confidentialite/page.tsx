export const metadata = { title: 'Politique de confidentialité' }

export default function ConfidentialitePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-ink mb-2 font-serif">Politique de confidentialité</h1>
      <p className="text-gray-400 text-sm mb-10">Bois Tresor — conforme RGPD</p>

      <div className="prose prose-gray max-w-none text-gray-700 space-y-8">
        {[
          { title: '1. Données collectées', body: 'Nom, prénom, e-mail, téléphone, adresse de livraison, ainsi que le détail des commandes (produits et montants). Les données de paiement (carte bancaire) ne sont jamais stockées par Bois Tresor.' },
          { title: '2. Finalités', body: 'Ces données servent à traiter et livrer vos commandes, gérer la relation client et le service après-vente, et respecter nos obligations légales et comptables.' },
          { title: '3. Durée de conservation', body: 'Données de commande et de facturation : 10 ans (obligation comptable). Données clients : 3 ans après le dernier contact.' },
          { title: '4. Destinataires', body: 'Vos informations ne sont transmises qu’à Bois Tresor et à ses prestataires techniques (hébergement, transport, paiement), tenus à la confidentialité.' },
          { title: '5. Vos droits', body: 'Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité. Pour les exercer : contact@bois-tresor.com. Vous pouvez également saisir la CNIL.' },
          { title: '6. Sécurité', body: 'Chiffrement SSL, contrôle d’accès à la base de données, séparation des droits.' },
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
