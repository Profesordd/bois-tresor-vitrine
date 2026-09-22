import Link from 'next/link'
import { Clock, MapPin, Building2 } from 'lucide-react'
import { SIRET, TVA_INTRACOM, ADRESSE_SIEGE, ANNUAIRE_URL, CONTACT_HOURS } from '@/lib/site'
import CartesContact from '@/components/contact/CartesContact'

export const metadata = { title: 'Contact' }

/**
 * Plus de formulaire (retiré le 22/09/2026) : il obligeait le gérant à
 * revenir sur le site pour lire et répondre. Deux cartes, un e-mail, et
 * la réponse part de sa boîte habituelle.
 */
export default function ContactPage() {
  return (
    <div>
      <div className="bg-brand-800 text-white py-6 sm:py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-3 font-serif">On vous répond.</h1>
          <p className="text-brand-100 text-[15px] sm:text-base">
            Vous voulez juste suivre votre colis ?{' '}
            <Link href="/suivi-commande" className="underline font-semibold">Suivi de commande →</Link>
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
        <CartesContact />

        <div className="grid sm:grid-cols-3 gap-4 mt-12">
          {[
            { icon: Clock,     title: 'Horaires',          val: CONTACT_HOURS, sub: 'Fermé week-end et jours fériés' },
            { icon: MapPin,    title: 'Zone de livraison', val: 'France métropolitaine, Belgique, Suisse et Luxembourg', sub: 'Livraison par transporteur spécialisé' },
            { icon: Building2, title: 'Siège social',      val: `${ADRESSE_SIEGE.rue}, ${ADRESSE_SIEGE.ville}`, sub: `SIRET ${SIRET} · TVA ${TVA_INTRACOM}` },
          ].map(({ icon: Icon, title, val, sub }) => (
            <div key={title} className="flex gap-4 p-4 bg-brand-50 rounded-lg">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-brand-600" />
              </div>
              <div>
                <p className="font-semibold text-ink text-sm">{title}</p>
                <p className="text-gray-700 text-sm">{val}</p>
                <p className="text-gray-400 text-xs mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-600 mt-4">
          Ces informations sont vérifiables sur{' '}
          <a href={ANNUAIRE_URL} target="_blank" rel="noopener noreferrer" className="text-brand-700 underline">
            l’annuaire officiel des entreprises
          </a>
          , et détaillées dans nos{' '}
          <Link href="/mentions-legales" className="text-brand-700 underline">mentions légales</Link>.
        </p>
      </div>
    </div>
  )
}
