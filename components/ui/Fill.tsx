interface Props {
  children: React.ReactNode
}

/**
 * Marque visuellement un passage de texte à remplacer par une info réelle
 * du client (nom, région, anecdote, chiffres...) avant mise en production.
 * Ne jamais publier tel quel — le persona cible ("Michel, 61 ans") se méfie
 * justement des sites qui sonnent faux ; seul du contenu vérifiable rassure.
 */
export default function Fill({ children }: Props) {
  return (
    <span className="inline bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-dashed border-amber-400 font-medium">
      {children}
    </span>
  )
}
