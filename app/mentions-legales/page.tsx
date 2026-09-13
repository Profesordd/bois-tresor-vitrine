export const metadata = { title: 'Mentions légales' }

export default function MentionsLegalesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-ink mb-2 font-serif">Mentions légales</h1>
      <p className="text-gray-400 text-sm mb-10">Bois Tresor</p>

      <div className="prose prose-gray max-w-none space-y-8 text-gray-700">
        <section>
          <h2 className="text-xl font-bold text-ink">1. Éditeur du site</h2>
          <p>Le site <strong>bois-tresor.com</strong> est édité par Bois Tresor.</p>
          <ul>
            <li>Email : contact@bois-tresor.com</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink">2. Directeur de publication</h2>
          <p>Bois Tresor — contact@bois-tresor.com</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink">3. Hébergement</h2>
          <p>Ce site est hébergé par :</p>
          <ul>
            <li>Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis</li>
            <li>Supabase Inc. (base de données, hébergement en Irlande)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink">4. Propriété intellectuelle</h2>
          <p>L&apos;ensemble des éléments du site (textes, images, graphismes, logo) est protégé par le droit de la propriété intellectuelle. Toute reproduction, même partielle, est interdite sans l&apos;accord préalable de Bois Tresor.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink">5. Responsabilité</h2>
          <p>Bois Tresor s&apos;efforce de maintenir les informations du site à jour et exactes, sans garantie absolue d&apos;exhaustivité. Bois Tresor ne saurait être tenu responsable des dommages résultant de l&apos;utilisation du site.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink">6. Données personnelles</h2>
          <p>Le traitement des données personnelles est détaillé dans notre <a href="/confidentialite" className="text-brand-600 underline">politique de confidentialité</a>, conforme au RGPD.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink">7. Litiges</h2>
          <p>En cas de litige, les parties rechercheront une solution amiable. À défaut, le droit français est applicable et les tribunaux français seront compétents.</p>
        </section>
      </div>
    </div>
  )
}
