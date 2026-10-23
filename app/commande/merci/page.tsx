import Link from 'next/link'
import { CheckCircle2, Mail, Truck } from 'lucide-react'
import { CONTACT_EMAIL, SIRET, SHIPPING_ZONE } from '@/lib/site'
import { createAdminClient } from '@/lib/supabase/server'
import PurchaseTracker from '@/components/shop/PurchaseTracker'

export const dynamic = 'force-dynamic'

/**
 * La commande, relue en base.
 *
 * C'est elle qui fournit le montant envoyé au pixel, et non l'adresse de
 * la page : un montant passé en paramètre serait modifiable par le
 * visiteur, et c'est lui que Meta retiendrait après déduplication.
 */
async function getCommande(reference: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('commandes')
    .select('id, reference, statut, produit_slug, produit_nom, montant_cents, canal')
    .eq('reference', reference)
    .maybeSingle()
  return data
}

export const metadata = { title: 'Merci pour votre commande', robots: { index: false, follow: false } }

interface Props {
  searchParams: Promise<{ ref?: string }>
}

/**
 * Page de remerciement.
 *
 * La référence est affichée en gros : c'est ce que le client note, dicte
 * au téléphone et cherche dans ses mails. Rien n'est relu en base ici, la
 * commande a déjà été confirmée par le serveur.
 */
export default async function MerciPage({ searchParams }: Props) {
  const { ref } = await searchParams
  const commande = ref ? await getCommande(ref) : null

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 text-center">
      {/* L'achat n'est mesuré que s'il est réellement payé, et seulement
          pour le canal du site : une vente partenaire n'est pas la nôtre. */}
      {commande?.statut === 'payee' && commande.canal === 'site' && (
        <PurchaseTracker
          commandeId={commande.id as string}
          reference={commande.reference as string}
          produitSlug={commande.produit_slug as string}
          produitNom={commande.produit_nom as string}
          montant={(commande.montant_cents as number) / 100}
        />
      )}

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
          Livraison offerte, {SHIPPING_ZONE}. Le transporteur vous appelle avant de passer.
        </p>
      </div>

      <p className="text-[15px] text-gray-600 mt-8">
        Une question ? Écrivez-nous à{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-700 underline">{CONTACT_EMAIL}</a>.
        C’est l’un de nous deux qui vous répond.
      </p>
      <p className="text-[14px] text-gray-500 mt-2">
        Bois Tresor, entreprise familiale française. SIRET {SIRET}.
      </p>

      <Link
        href="/"
        className="inline-block mt-8 text-brand-700 hover:text-brand-800 font-medium underline"
      >
        Retour à l’accueil
      </Link>
    </div>
  )
}
