import { Home, PackageCheck, Lock, Mail } from 'lucide-react'
import Fill from '@/components/ui/Fill'

/**
 * Réassurance placée juste à côté du bouton d'achat : c'est le moment exact
 * où le persona hésite (« et si je paie et que je ne reçois rien ? »).
 */
export default function BuyReassurance() {
  return (
    <ul className="space-y-3 bg-brand-50 border border-brand-100 rounded-lg p-5">
      <li className="flex gap-3 text-[15px] text-gray-800">
        <Home size={19} className="text-brand-600 flex-shrink-0 mt-0.5" />
        <span>
          Entreprise familiale française — SIRET <Fill>à compléter</Fill>
        </span>
      </li>
      <li className="flex gap-3 text-[15px] text-gray-800">
        <PackageCheck size={19} className="text-brand-600 flex-shrink-0 mt-0.5" />
        <span>Livré ou remboursé</span>
      </li>
      <li className="flex gap-3 text-[15px] text-gray-800">
        <Lock size={19} className="text-brand-600 flex-shrink-0 mt-0.5" />
        <span>Paiement sécurisé : CB, Visa, Mastercard — 3D-Secure</span>
      </li>
      <li className="flex gap-3 text-[15px] text-gray-800">
        <Mail size={19} className="text-brand-600 flex-shrink-0 mt-0.5" />
        <span>E-mail de confirmation avec votre numéro de commande</span>
      </li>
    </ul>
  )
}
