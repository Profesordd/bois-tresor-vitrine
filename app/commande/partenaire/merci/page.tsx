import { CheckCircle2, Mail, Truck } from 'lucide-react'

/**
 * Remerciement du canal partenaire.
 *
 * Volontairement sous le chemin /commande/partenaire/ : aucune mesure Meta
 * ni d'audience ne s'y déclenche, puisque ces pages sont exclues. Une
 * vente du partenaire ne laisse donc aucune trace dans le Facebook ni dans
 * l'admin de bois-tresor, pas même une vue sur cette page.
 *
 * Aucun PurchaseTracker ici, contrairement à la page du site.
 */

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Merci pour votre commande', robots: { index: false, follow: false } }

interface Props {
  searchParams: Promise<{ ref?: string }>
}

export default async function MerciPartenairePage({ searchParams }: Props) {
  const { ref } = await searchParams

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 text-center">
      <CheckCircle2 size={56} className="text-brand-600 mx-auto mb-5" />
      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
        Merci, votre commande est enregistrée
      </h1>

      {ref && (
        <div className="mt-6 rounded-xl border-2 border-brand-200 bg-brand-50 px-6 py-5">
          <p className="text-[15px] text-gray-600">Votre numéro de commande</p>
          <p className="font-mono text-2xl font-bold text-ink mt-1">{ref}</p>
          <p className="text-[14px] text-gray-600 mt-2">Notez-le, il nous servira pour tout échange.</p>
        </div>
      )}

      <div className="mt-8 space-y-3 text-left">
        <p className="flex items-start gap-2.5 text-[16px] text-gray-700">
          <Mail size={19} className="text-brand-600 flex-shrink-0 mt-0.5" />
          Vous recevez un e-mail de confirmation avec le détail de votre commande.
        </p>
        <p className="flex items-start gap-2.5 text-[16px] text-gray-700">
          <Truck size={19} className="text-brand-600 flex-shrink-0 mt-0.5" />
          Livraison offerte. Le transporteur vous appelle avant de passer.
        </p>
      </div>
    </div>
  )
}
