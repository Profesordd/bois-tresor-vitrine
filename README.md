# Bois Émeraude — vitrine

Reconstruction Next.js du site en production du client (bois-emeraude.com) :
mêmes produits, mêmes prix, mêmes textes et mêmes photos que le site réel,
avec paiement en ligne pas encore branché (démo).

## État actuel

- **Catalogue** : les 53 produits réels du site (7 mélanges de bois durs, 2
  références 100 % hêtre, 44 palettes de granulés/pellets), avec les prix et
  caractéristiques techniques exacts, gérés dans [`lib/products.ts`](lib/products.ts).
  Aucune clé externe n'est nécessaire pour que l'aperçu fonctionne.
- **Photos** : les vraies photos du site (héro cheminée + palette de bûches +
  4 visuels de palettes de granulés), reprises telles quelles.
- **Panier** : entièrement fonctionnel côté interface (Zustand + `localStorage`),
  mais **aucun paiement réel n'est traité** — "Passer commande" affiche un
  récapitulatif de démonstration. Un vrai moyen de paiement sera à brancher
  une fois le design validé.
- **Avis clients / chiffres clés** : repris tels quels du site réel (note
  4,9/5, 2 184 avis, 12 000+ stères livrés, témoignages) à la demande du client.
- **Contact** : formulaire fonctionnel, envoie un email via Resend (clé requise).
- **Suivi de commande** : interroge la table `orders` de Supabase — tant
  qu'aucune vraie commande n'existe (pas de paiement branché), il renverra
  "commande introuvable", ce qui est le comportement attendu.
- **Pages légales** (CGV, mentions légales, confidentialité, livraison,
  paiement sécurisé, retours, cookies) : reprises du contenu réel du site,
  sauf mentions légales (SIRET/forme juridique non publiées sur le site
  source non plus — à compléter si besoin).

## Développement local

```bash
npm install
npm run dev
```

## Variables d'environnement (optionnelles pour l'aperçu)

Voir `.env.local.example`. Sans ces clés, le site fonctionne normalement
(catalogue statique) ; seuls le formulaire de contact et le suivi de commande
nécessitent Resend / Supabase.

Le schéma de base de données prêt pour une future bascule du catalogue et
pour les commandes est dans [`supabase-schema.sql`](supabase-schema.sql).

## Déploiement

Déployé sur Vercel. Le paiement en ligne n'est pas encore branché — c'est
volontaire à ce stade (validation du design avant intégration d'un vrai
prestataire de paiement).
