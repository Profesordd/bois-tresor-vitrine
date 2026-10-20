import FormulaireDesinscription from '@/components/shop/FormulaireDesinscription'

export const metadata = {
  title: 'Ne plus recevoir nos messages',
  robots: { index: false, follow: false },
}

interface Props {
  searchParams: Promise<{ id?: string; t?: string }>
}

/**
 * Page de désinscription, atteinte depuis le lien en bas des relances.
 *
 * Un bouton à cliquer plutôt qu'une désinscription immédiate à l'ouverture :
 * les filtres de messagerie visitent les liens d'un message pour les
 * inspecter, et désinscriraient des gens qui n'ont rien demandé.
 */
export default async function DesinscriptionPage({ searchParams }: Props) {
  const { id, t } = await searchParams

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
        Ne plus recevoir nos messages
      </h1>
      {!id || !t ? (
        <p className="text-gray-600 mt-4 leading-relaxed">
          Ce lien est incomplet. Écrivez-nous à contact@bois-tresor.com et nous
          retirons votre adresse nous-mêmes.
        </p>
      ) : (
        <>
          <p className="text-gray-600 mt-4 leading-relaxed">
            Confirmez ci-dessous et nous ne vous écrirons plus au sujet de votre commande
            en attente. Les e-mails liés à une commande que vous passeriez ensuite
            continueront de vous parvenir.
          </p>
          <FormulaireDesinscription id={id} jeton={t} />
        </>
      )}
    </div>
  )
}
