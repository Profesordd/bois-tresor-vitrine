import type { Spec } from '@/types/database'

interface Props {
  specs: Spec[]
}

const DELIVERY = [
  'Livraison offerte dès 89 € d’achat, partout en France métropolitaine.',
  'Préparation sous 48 h ouvrées, livraison en 3 à 7 jours ouvrés selon votre région.',
  'Livraison par camion avec hayon : la palette est déposée au plus près de votre lieu de stockage.',
  'Vous recevez un e-mail dès l’expédition, avec le suivi de votre commande.',
]

const PAYMENT = [
  'Paiement en ligne par carte bancaire : CB, Visa, Mastercard.',
  'Formulaire bancaire chiffré et authentification 3D-Secure par votre banque.',
  'Aucune donnée de carte n’est conservée sur nos serveurs.',
  'E-mail de confirmation immédiat, avec votre numéro de commande.',
]

/** Détails produit : rien n'est masqué derrière un accordéon, le persona ne clique pas. */
export default function ProductDetails({ specs }: Props) {
  return (
    <div className="grid md:grid-cols-3 gap-6 items-start">
      <section className="border-2 border-gray-100 rounded-lg p-5">
        <h2 className="font-bold text-ink text-lg mb-4">Caractéristiques</h2>
        <dl className="divide-y divide-gray-100">
          {specs.map((s) => (
            <div key={s.label} className="flex justify-between gap-4 py-2.5 text-[15px]">
              <dt className="text-gray-500">{s.label}</dt>
              <dd className="text-ink font-semibold text-right">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-2 border-gray-100 rounded-lg p-5">
        <h2 className="font-bold text-ink text-lg mb-4">Livraison</h2>
        <ul className="space-y-2.5 text-[15px] text-gray-700 leading-relaxed">
          {DELIVERY.map(item => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section className="border-2 border-gray-100 rounded-lg p-5">
        <h2 className="font-bold text-ink text-lg mb-4">Paiement</h2>
        <ul className="space-y-2.5 text-[15px] text-gray-700 leading-relaxed">
          {PAYMENT.map(item => <li key={item}>{item}</li>)}
        </ul>
      </section>
    </div>
  )
}
