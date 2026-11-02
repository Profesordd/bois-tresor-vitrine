import { Flame, Package, TreePine } from 'lucide-react'
import { resumerVentes, type VenteCommande } from '@/lib/admin/ventes'
import { formatPrice } from '@/lib/utils'

const PRESENTATION = {
  'bois-de-chauffage': { titre: 'Bois de chauffage', quantite: 'palettes', icone: TreePine, couleur: 'bg-brand-50 text-brand-700', barre: 'bg-brand-600' },
  granules: { titre: 'Granulés', quantite: 'lots / palettes', icone: Flame, couleur: 'bg-amber-50 text-amber-800', barre: 'bg-amber-500' },
  autres: { titre: 'Autres produits', quantite: 'unités', icone: Package, couleur: 'bg-gray-100 text-gray-700', barre: 'bg-gray-500' },
} as const

export default function VentesParFamille({ commandes, periode }: { commandes: VenteCommande[]; periode: string }) {
  const familles = resumerVentes(commandes)
  const totalCents = familles.reduce((s, f) => s + f.encaisseCents, 0)

  return (
    <section aria-labelledby="ventes-titre" className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-5">
        <div>
          <h2 id="ventes-titre" className="font-semibold text-ink">Ce qui a été vendu</h2>
          <p className="text-[13px] text-gray-500 mt-1">{periode} · Commandes payées du site uniquement</p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">Ventes encaissées</span>
      </div>

      <div className={`grid gap-3 ${familles.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {familles.map((f) => {
          const p = PRESENTATION[f.famille]
          const Icone = p.icone
          const part = totalCents > 0 ? (f.encaisseCents * 100) / totalCents : 0
          return (
            <article key={f.famille} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2.5 mb-4">
                <span className={`rounded-lg p-2 ${p.couleur}`}><Icone size={19} aria-hidden="true" /></span>
                <h3 className="font-semibold text-ink text-sm">{p.titre}</h3>
              </div>
              <p className="font-serif text-3xl font-bold text-ink tabular-nums">{formatPrice(f.encaisseCents / 100)}</p>
              <p className="text-xs text-gray-500 mt-1">encaissés sur la période</p>
              <dl className="grid grid-cols-2 gap-3 mt-5">
                <div><dt className="text-xs text-gray-500">Commandes payées</dt><dd className="text-xl font-semibold text-ink tabular-nums mt-0.5">{f.commandes}</dd></div>
                <div><dt className="text-xs text-gray-500">Quantité vendue</dt><dd className="text-xl font-semibold text-ink tabular-nums mt-0.5">{f.quantite} <span className="text-xs font-normal text-gray-500">{p.quantite}</span></dd></div>
              </dl>
              <div className="h-1.5 bg-gray-100 rounded-full mt-4 overflow-hidden" aria-hidden="true">
                <div className={`h-full rounded-full ${p.barre}`} style={{ width: `${part}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-2">{part.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} % du montant encaissé</p>
            </article>
          )
        })}
      </div>

      {totalCents === 0 ? (
        <p className="text-sm text-gray-500 mt-4">Aucune vente payée sur cette période.</p>
      ) : (
        <details className="group mt-5 border-t border-gray-100 pt-4">
          <summary className="cursor-pointer text-sm font-medium text-brand-700 hover:text-brand-900">Détail des produits vendus</summary>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm text-left">
              <caption className="sr-only">Produits vendus sur la période sélectionnée</caption>
              <thead className="text-xs text-gray-500 border-b border-gray-200">
                <tr><th scope="col" className="py-2 pr-3 font-medium">Produit</th><th scope="col" className="py-2 px-2 font-medium text-right">Commandes</th><th scope="col" className="py-2 px-2 font-medium text-right">Quantité</th><th scope="col" className="py-2 pl-2 font-medium text-right">Encaissé</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {familles.flatMap((f) => f.produits.map((p) => (
                  <tr key={p.cle}>
                    <th scope="row" className="py-3 pr-3 min-w-[180px] font-normal text-gray-700"><span className="block text-[11px] text-gray-400 mb-0.5">{PRESENTATION[f.famille].titre}</span>{p.nom}</th>
                    <td className="py-3 px-2 text-right tabular-nums text-gray-600">{p.commandes}</td>
                    <td className="py-3 px-2 text-right tabular-nums text-gray-600">{p.quantite}</td>
                    <td className="py-3 pl-2 text-right tabular-nums font-semibold text-ink whitespace-nowrap">{formatPrice(p.encaisseCents / 100)}</td>
                  </tr>
                )))}
              </tbody>
              <tfoot className="border-t border-gray-200 text-ink font-semibold">
                <tr><th scope="row" className="pt-3 pr-3">Total</th><td className="pt-3 px-2 text-right tabular-nums">{familles.reduce((s, f) => s + f.commandes, 0)}</td><td className="pt-3 px-2 text-right tabular-nums">{familles.reduce((s, f) => s + f.quantite, 0)}</td><td className="pt-3 pl-2 text-right tabular-nums whitespace-nowrap">{formatPrice(totalCents / 100)}</td></tr>
              </tfoot>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-3">La quantité correspond aux lots ou palettes commandés, pas au nombre de sacs ou de stères.</p>
        </details>
      )}
    </section>
  )
}
