import Link from 'next/link'
import { ArrowLeft, CreditCard, AlertTriangle, Check, X } from 'lucide-react'
import { cawlConfigure, cawlEnvironnement } from '@/lib/cawl'
import CawlEssai, { type ArticleEssai } from '@/components/admin/CawlEssai'
import { PRODUCTS } from '@/lib/products'
import { lotsDisponibles, libelleLot } from '@/lib/lots'

/**
 * Les montants réels du catalogue, pour essayer sur de vrais prix plutôt
 * que sur un chiffre rond. Un produit vendu par lot en fournit un par lot.
 */
function articlesDuCatalogue(): ArticleEssai[] {
  const out: ArticleEssai[] = [{ libelle: 'Essai à 1 €', montantCents: 100 }]
  for (const p of PRODUCTS) {
    if (p.unlisted) continue
    const lots = lotsDisponibles(p)
    if (lots.length > 0) {
      for (const l of lots) {
        out.push({ libelle: `${p.name} · ${libelleLot(l)}`, montantCents: Math.round(l.price * 100) })
      }
    } else if (p.variantId) {
      out.push({ libelle: p.name, montantCents: Math.round(p.price * 100) })
    }
  }
  return out
}

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Paiement CAWL', robots: { index: false, follow: false } }

/**
 * Banc d'essai du processeur CAWL.
 *
 * Sous /admin/, donc protégé par le middleware et invisible des clients.
 * Le parcours d'achat du site n'est pas touché : il passe toujours par le
 * prestataire externe actuel.
 */
export default function PaiementCawlPage() {
  const configure = cawlConfigure()
  const env = cawlEnvironnement()
  const reglages = [
    { cle: 'CAWL_MERCHANT_ID', present: Boolean(process.env.CAWL_MERCHANT_ID), role: 'votre PSPID' },
    { cle: 'CAWL_API_KEY', present: Boolean(process.env.CAWL_API_KEY), role: 'identifiant de la clé' },
    { cle: 'CAWL_SECRET_KEY', present: Boolean(process.env.CAWL_SECRET_KEY), role: 'clé secrète, signature des appels' },
  ]
  const manquants = reglages.filter((r) => !r.present)

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/admin/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6">
        <ArrowLeft size={15} /> Retour au tableau de bord
      </Link>

      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink flex items-center gap-2.5">
        <CreditCard size={24} className="text-brand-600" />
        Paiement CAWL
      </h1>
      <p className="text-gray-500 text-sm mt-1">
        Essai du processeur du Crédit Agricole, bâti sur Worldline. Le parcours d’achat du
        site n’est pas concerné : il passe toujours par le prestataire actuel.
      </p>

      <div className={`rounded-lg border p-4 mt-5 ${manquants.length > 0 ? 'border-amber-300 bg-amber-50' : 'border-brand-200 bg-brand-50'}`}>
        <p className={`flex items-center gap-2 font-semibold ${manquants.length > 0 ? 'text-amber-900' : 'text-brand-800'}`}>
          {manquants.length > 0 ? <AlertTriangle size={18} /> : <Check size={18} className="text-brand-600" />}
          {manquants.length > 0 ? `${manquants.length} clé(s) manquante(s)` : 'Clés en place'}
        </p>
        <ul className="mt-2.5 space-y-1 text-[15px]">
          {reglages.map((r) => (
            <li key={r.cle} className="flex items-center gap-2">
              {r.present
                ? <Check size={15} className="text-brand-600 flex-shrink-0" />
                : <X size={15} className="text-amber-700 flex-shrink-0" />}
              <code className="text-[13px]">{r.cle}</code>
              <span className="text-gray-500 text-[14px]">· {r.role}</span>
            </li>
          ))}
        </ul>
        <p className="text-[14px] text-gray-600 mt-3">
          Environnement : <code className="text-[13px]">{env.url}</code>
          {env.reel
            ? <strong className="text-red-700"> — réel, les cartes sont débitées</strong>
            : <span className="text-brand-700"> — préprod, aucun débit</span>}
        </p>
      </div>

      <div className="mt-6">
        {configure
          ? <CawlEssai reel={env.reel} articles={articlesDuCatalogue()} />
          : <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
              Renseignez les clés dans la configuration pour lancer un essai.
            </p>}
      </div>
    </div>
  )
}
