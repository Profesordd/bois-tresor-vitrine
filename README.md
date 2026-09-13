# Bois Trésor — vitrine (démo)

Site vitrine e-commerce de démonstration pour une activité de vente de bois de
chauffage et granulés premium. Next.js 14 (App Router) + TypeScript + Tailwind.

## État actuel

- **Catalogue** : géré en dur dans [`lib/products.ts`](lib/products.ts) — aucune
  clé externe n'est nécessaire pour que l'aperçu fonctionne. Les prix qui s'y
  trouvent sont des **estimations indicatives**, à remplacer par la grille
  tarifaire réelle du client.
- **Visuels produits** : illustrations SVG originales ([`components/shop/ProductVisual.tsx`](components/shop/ProductVisual.tsx))
  en attendant les vraies photos produit.
- **Panier** : entièrement fonctionnel côté interface (Zustand + `localStorage`),
  mais **aucun paiement réel n'est traité** — "Passer commande" affiche un
  récapitulatif de démonstration. Un vrai moyen de paiement sera à brancher
  une fois le design validé.
- **Avis clients** : aucun avis fictif n'est affiché. La section dédiée est un
  emplacement prêt à recevoir un vrai flux d'avis (Trustpilot ou avis internes
  vérifiés) une fois le site en production.
- **Contact** : formulaire fonctionnel, envoie un email via Resend (clé requise).
- **Suivi de commande** : interroge la table `orders` de Supabase — tant
  qu'aucune vraie commande n'existe (pas de paiement branché), il renverra
  toujours "commande introuvable", ce qui est le comportement honnête attendu.

## Développement local

```bash
npm install
npm run dev
```

## Variables d'environnement (optionnelles pour l'aperçu)

Voir `.env.local.example`. Sans ces clés, le site fonctionne normalement
(catalogue statique) ; seuls le formulaire de contact et le suivi de commande
nécessitent Resend / Supabase.

Le schéma de base de données prêt pour la bascule future du catalogue et pour
les commandes est dans [`supabase-schema.sql`](supabase-schema.sql).

## Déploiement

Déployé sur Vercel. Le paiement en ligne n'est pas encore branché — c'est
volontaire à ce stade (validation du design avant intégration d'un vrai
prestataire de paiement).
