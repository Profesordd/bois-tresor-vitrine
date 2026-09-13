export const metadata = { title: 'Paiement sécurisé' }

export default function PaiementSecurisePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-ink mb-2 font-serif">Paiement sécurisé</h1>
      <p className="text-gray-400 text-sm mb-10">Site de démonstration — le paiement en ligne n’est pas encore activé.</p>

      <div className="prose prose-gray max-w-none text-gray-700 space-y-8">
        <section>
          <h2 className="text-xl font-bold text-ink">Transaction protégée</h2>
          <p>Lors du règlement, vos informations de carte sont saisies dans un formulaire bancaire chiffré. Les données bancaires sont transmises directement à l’établissement financier et n’atteignent jamais nos serveurs.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-ink">Authentification 3D-Secure</h2>
          <p>Chaque transaction est validée par votre banque via un code envoyé par SMS ou votre application bancaire, afin de prévenir toute utilisation frauduleuse.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-ink">Moyens acceptés</h2>
          <p>Carte Bleue, Visa, Mastercard.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-ink">Confidentialité</h2>
          <p>Aucune donnée de carte n’est stockée sur nos serveurs. Pour en savoir plus, consultez notre <a href="/confidentialite" className="text-brand-600 underline">politique de confidentialité</a>.</p>
        </section>
      </div>
    </div>
  )
}
