# Routage CAWL — 12 novembre 2026

Demande du propriétaire : utiliser Walid pour les nouvelles commandes client et partenaire, en conservant le suivi des paiements déjà engagés.

- Migration additive sql/20261112-cawl-processors.sql : colonne cawl_processor avec défaut process-1, valeurs autorisées process-1/walid et trigger empêchant de changer le compte d’une commande existante. Aucun montant, statut, droit RLS ou ancienne référence de paiement réécrit.
- CAWL_ACTIVE_PROCESSOR choisit le compte à la création serveur de la commande. Les quatre routes de paiement/confirmation/rattrapage utilisent ensuite son compte enregistré ; aucune valeur de compte fournie par le navigateur n’est utilisée.
- Anciennes variables CAWL_* conservées pour process-1 ; Walid utilise exclusivement CAWL_WALID_API_URL, CAWL_WALID_MERCHANT_ID, CAWL_WALID_API_KEY et CAWL_WALID_SECRET_KEY. Aucun fallback de clés. Les fonctions bancaires sans compte explicite restent sur process-1 pour préserver les anciens outils administrateur ; les parcours marchands transmettent toujours le compte enregistré.
- Configuration Production : CAWL_ACTIVE_PROCESSOR=walid, nouvelles clés exclusivement serveur. Aucun changement des variables Supabase/Meta, des produits, montants, pixels ou sessions. Les commandes déjà créées restent sur leur compte, même si elles sont payées après la bascule. Un formulaire sans commande créée utilise le compte actif lors de la création.
- GET privé /api/admin/cawl/routage/ : contrôle session administrateur, retourne le compte actif et vérifie GET services/testconnection. Aucun paiement, commande ou événement publicitaire créé par ce diagnostic.
- Tests : node tests/cawl-routing.mjs ; node tests/cawl-order-routing.mjs ; npx tsc --noEmit ; npm run build. Les appels banque et base des tests sont simulés. La migration a aussi été vérifiée dans PostgreSQL local simulé : défaut historique, compte immuable, mises à jour métier permises, compte inconnu rejeté et réexécution.

Les anciens outils SQL/SAV qui interrogent CAWL doivent choisir le compte selon cawl_processor ; ne pas relire une commande Walid avec les clés historiques. Les exports de statistiques historiques sans ventilation bancaire ne prouvent pas une attribution au compte 1. Aucun test de débit réel automatique.

## Export des statistiques — 12 novembre 2026

Le flux historique /api/partenaire/stats/ est fixé au compte process-1, sans paramètre permettant de le remplacer par Walid. Le relais Stats Partenaires /walid lit séparément les seules commandes Walid payées dans Supabase ; les montants ne sont pas réimportés ni copiés. La comptabilité interne tous comptes reste inchangée. Test dédié : node tests/stats-processors.mjs --bois.
