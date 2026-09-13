import { MessageSquareText } from 'lucide-react'

/**
 * Zone avis clients — volontairement sans avis fabriqués.
 * À connecter à un vrai flux d'avis (connecteur Trustpilot légitime ou
 * avis internes vérifiés après commande) une fois le site en production.
 */
export default function ReviewsSection() {
  return (
    <section className="bg-brand-50 py-16">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
          <MessageSquareText size={26} className="text-brand-600" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-brand-900 mb-3">Avis clients</h2>
        <p className="text-brand-600 leading-relaxed">
          Cet espace accueillera les avis clients vérifiés dès l’ouverture de la boutique —
          via un connecteur Trustpilot légitime ou les avis internes recueillis après livraison.
          Aucun avis fictif n’est affiché sur ce site de démonstration.
        </p>
      </div>
    </section>
  )
}
