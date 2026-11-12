# Présentation du checkout

Le 12 novembre 2026, le propriétaire demande de reprendre le design de FrancePaiement / Destock Malin sur les deux parcours Bois Trésor. Le composant `components/shop/CheckoutDesign.tsx` et sa feuille de style isolée portent uniquement la présentation : contact, adresse, carte, récapitulatif, quantité, réassurance et carrousel de trois avis fournis par le propriétaire.

Les textes des avis et noms sont repris sans inventer de titre, de date, de volume d'avis ou de mention d'achat vérifié. Ils sont limités au checkout ; le référentiel des avis des autres pages reste inchangé. Les garanties propres à l'électroménager et les compteurs de réservation ne sont pas repris.

Sur ordinateur : formulaire à gauche et récapitulatif à droite. Sur téléphone : récapitulatif dépliable au-dessus du formulaire. Le parcours client conserve l'identité Bois Trésor ; le partenaire conserve son identité neutre sans menu ni liens vers la boutique. Les pages merci/retour conservent leurs comportements et leur habillage antérieurs.

`FormulaireCommande.tsx` conserve intégralement ses fonctions de validation, création, paiement, confirmation, retour bancaire, capture du contact et suivi par canal. Les appels serveur, montants, quantités maximales, pays, choix du lot, redirections et pixels séparés restent identiques. La saisie de la carte commence vide ; le CVV reste limité à trois chiffres et le champ invalide reçoit le focus. Aucun changement des API, du catalogue, de Supabase, des variables Vercel ou du processeur Walid.

Vérification avant publication : TypeScript et build (134 pages) réussis ; six contrôles navigateur sur les deux canaux en 1440, 390 et 320 px. Trois avis et navigation, quantités/prix, validation/focus et absence de débordement/erreur JavaScript vérifiés. Sur le serveur local seulement, création et paiement simulés par interception intégrale des requêtes : canal et lot conservés, collecte du contact client et suivi partenaire séparés. Aucun paiement, commande, lead ou événement publicitaire réellement envoyé.

Les captures et rapports de vérification restent dans le dossier privé ignoré `.local/` de FrancePaiement. Les résultats du déploiement et du recontrôle en production sont consignés dans le journal de reprise.
