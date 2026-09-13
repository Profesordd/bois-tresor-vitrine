export const metadata = { title: 'Mentions légales' }

export default function MentionsLegalesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-brand-900 mb-2 font-serif">Mentions légales</h1>
      <p className="text-brand-400 text-sm mb-10">
        Document type — les champs entre crochets doivent être complétés avec les informations légales réelles de l’entreprise avant mise en ligne.
      </p>

      <div className="prose prose-gray max-w-none space-y-8 text-brand-700">
        <section>
          <h2 className="text-xl font-bold text-brand-900">1. Éditeur du site</h2>
          <p>Le site <strong>Bois Trésor</strong> est édité par [Raison sociale à compléter], [forme juridique], au capital de [montant] €.</p>
          <ul>
            <li>Siège social : [adresse à compléter]</li>
            <li>SIRET : [numéro à compléter]</li>
            <li>Email : contact@bois-tresor.com</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-900">2. Directeur de publication</h2>
          <p>[Nom du responsable de publication à compléter] — contact@bois-tresor.com</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-900">3. Hébergement</h2>
          <p>Ce site est hébergé par :</p>
          <ul>
            <li>Vercel Inc., 340 Pine Street Suite 701, San Francisco, CA 94104 — États-Unis</li>
            <li>Supabase Inc. (base de données)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-900">4. Propriété intellectuelle</h2>
          <p>L&apos;ensemble des contenus du site (textes, images, graphismes, logo) est protégé par le droit de la propriété intellectuelle. Toute reproduction, même partielle, est interdite sans l&apos;accord préalable de Bois Trésor.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-900">5. Responsabilité</h2>
          <p>Bois Trésor s&apos;efforce de maintenir les informations du site à jour et exactes. Néanmoins, des erreurs ou omissions peuvent survenir. Bois Trésor ne saurait être tenu responsable des dommages directs ou indirects résultant de l&apos;utilisation du site.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-900">6. Données personnelles</h2>
          <p>La collecte et le traitement des données personnelles sont détaillés dans notre <a href="/confidentialite" className="text-brand-600 underline">politique de confidentialité</a>.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-brand-900">7. Litiges</h2>
          <p>En cas de litige, les parties rechercheront une solution amiable. À défaut, les tribunaux français seront compétents, le droit français étant applicable.</p>
        </section>
      </div>
    </div>
  )
}
