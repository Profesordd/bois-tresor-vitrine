interface Props {
  html: string
}

/**
 * Description longue d'un produit, pour les fiches qui en ont besoin
 * (`richDescription`). Le HTML vient du catalogue en dur, jamais d'une
 * saisie extérieure : on peut l'injecter tel quel.
 */
export default function ProductDescription({ html }: Props) {
  return (
    <section className="border-2 border-gray-100 rounded-lg p-5 sm:p-7 max-w-3xl">
      <h2 className="font-bold text-ink text-lg mb-4">Description</h2>
      <div
        className="text-[16px] text-gray-700 leading-relaxed space-y-3 [&_h3]:font-bold [&_h3]:text-ink [&_h3]:text-[17px] [&_h3]:mt-5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-ink"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  )
}
