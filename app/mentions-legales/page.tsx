import { ShieldCheck } from 'lucide-react'
import { SIRET, TVA_INTRACOM, ANNUAIRE_URL } from '@/lib/site'

export const metadata = { title: 'Mentions légales' }

export default function MentionsLegalesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-ink mb-4 font-serif">Mentions légales</h1>

      <div className="flex gap-4 bg-brand-50 border border-brand-100 rounded-lg p-5 mb-10">
        <ShieldCheck size={24} className="text-brand-600 flex-shrink-0 mt-0.5" />
        <div className="text-[15px] text-gray-700 leading-relaxed space-y-2">
          <p>
            <strong className="text-ink">Bois Tresor est le nouveau site internet de notre entreprise.</strong>{' '}
            Même équipe, même bois, mêmes conditions : seul le site change, pour vous permettre de
            commander plus simplement en ligne.
          </p>
          <p>
            Vous vérifiez qui se cache derrière ce site avant de commander ? Vous avez raison.
            Voici nos informations légales complètes — elles sont vérifiables publiquement auprès
            du registre des entreprises.
          </p>
        </div>
      </div>

      <div className="prose prose-gray max-w-none space-y-8 text-gray-700 text-[16px]">
        <section>
          <h2 className="text-xl font-bold text-ink">1. Éditeur du site</h2>
          <ul>
            <li>Responsable : Jean-Paul MONMEJA</li>
            <li>Adresse de la société et siège social : 380 Route du Moulin, 13100 Aix-en-Provence</li>
            <li>SIRET : {SIRET}</li>
            <li>TVA intracommunautaire : {TVA_INTRACOM}</li>
            <li>E-mail : contact@bois-tresor.com</li>
          </ul>
          <p>
            Ces informations sont vérifiables sur{' '}
            <a href={ANNUAIRE_URL} target="_blank" rel="noopener noreferrer" className="text-brand-700 underline">
              l’annuaire officiel des entreprises
            </a>{' '}
            (service public).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink">2. Directeur de la publication</h2>
          <p>Jean-Paul MONMEJA — contact@bois-tresor.com</p>
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
          <p>
            L&apos;ensemble des éléments du site (textes, images, graphismes, logo) est protégé par
            le droit de la propriété intellectuelle. Toute reproduction, même partielle, est
            interdite sans l&apos;accord préalable de Bois Tresor.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink">5. Responsabilité</h2>
          <p>
            Bois Tresor s&apos;efforce de maintenir les informations du site à jour et exactes, sans
            garantie absolue d&apos;exhaustivité. Bois Tresor ne saurait être tenu responsable des
            dommages résultant de l&apos;utilisation du site.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink">6. Données personnelles</h2>
          <p>
            Le traitement des données personnelles est détaillé dans notre{' '}
            <a href="/confidentialite" className="text-brand-700 underline">politique de confidentialité</a>,
            conforme au RGPD.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink">7. Médiation et litiges</h2>
          <p>
            Conformément à l&apos;article L612-1 du Code de la consommation, vous pouvez recourir
            gratuitement à un médiateur de la consommation. À défaut de solution amiable, le droit
            français est applicable et les tribunaux français sont compétents.
          </p>
        </section>
      </div>
    </div>
  )
}
