export const metadata = { title: 'Politique de confidentialité' }

export default function ConfidentialitePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-brand-900 mb-2 font-serif">Politique de confidentialité</h1>
      <p className="text-brand-400 text-sm mb-10">Document type, conforme RGPD — à compléter avec les informations réelles de l’entreprise.</p>

      <div className="prose prose-gray max-w-none text-brand-700 space-y-8">
        {[
          { title: '1. Responsable du traitement', body: '[Raison sociale à compléter], [adresse à compléter] — contact@bois-tresor.com' },
          { title: '2. Données collectées', body: 'Nous collectons les données nécessaires au traitement de vos commandes : nom, prénom, adresse email, adresse de livraison, numéro de téléphone. Ces données sont collectées lors de votre commande ou de votre inscription à la newsletter.' },
          { title: '3. Finalités du traitement', body: 'Vos données sont utilisées pour : traiter vos commandes, vous envoyer des confirmations et suivis de livraison, vous informer de nos offres (si consentement), améliorer nos services, respecter nos obligations légales.' },
          { title: '4. Base légale', body: 'Les traitements reposent sur l\'exécution du contrat de vente, le consentement (newsletter), et nos obligations légales.' },
          { title: '5. Durée de conservation', body: 'Vos données de commande sont conservées 10 ans (obligation comptable). Vos données de newsletter sont conservées jusqu\'à votre désinscription.' },
          { title: '6. Partage des données', body: 'Vos données ne sont jamais vendues. Elles peuvent être partagées uniquement avec nos prestataires nécessaires à l\'exécution du service (transporteurs, prestataire de paiement), soumis à des contrats de confidentialité.' },
          { title: '7. Vos droits', body: 'Conformément au RGPD, vous disposez d\'un droit d\'accès, de rectification, d\'effacement, de portabilité et d\'opposition. Pour exercer ces droits : contact@bois-tresor.com. Vous pouvez également déposer une réclamation auprès de la CNIL (cnil.fr).' },
          { title: '8. Sécurité', body: 'Nous mettons en œuvre les mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, perte ou destruction.' },
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
