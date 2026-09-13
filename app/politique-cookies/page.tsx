export const metadata = { title: 'Politique cookies' }

export default function PolitiqueCookiesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-ink mb-2 font-serif">Politique cookies</h1>
      <p className="text-gray-500 mb-10">Le site Bois Émeraude utilise un minimum de cookies, uniquement nécessaires à son bon fonctionnement.</p>

      <div className="prose prose-gray max-w-none text-gray-700 space-y-8">
        <section>
          <h2 className="text-xl font-bold text-ink">Cookies strictement nécessaires</h2>
          <p>Des cookies techniques permettent la navigation et le fonctionnement du panier d’achat. Ils sont stockés localement dans votre navigateur, ne nécessitent aucun consentement et ne servent à aucun suivi publicitaire.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-ink">Absence de traceurs publicitaires</h2>
          <p>Bois Émeraude n’utilise pas de cookies publicitaires ni de traceurs tiers à des fins de profilage marketing.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-ink">Gestion</h2>
          <p>Vous pouvez configurer votre navigateur pour refuser les cookies ou effacer les données du site. Le panier sera alors réinitialisé.</p>
        </section>
      </div>
    </div>
  )
}
