-- =============================================
-- BOIS TRESOR — Produits épuisés
--
-- Le catalogue vit en dur dans le code, avec un stock indicatif. Cette
-- table ne contient que les exceptions : un produit présent ici est
-- affiché « Rupture de stock » et ne peut plus être commandé, quel que
-- soit le stock inscrit dans le catalogue.
--
-- Une ligne arrive de deux façons :
--   - 'admin'   : le gérant a cliqué « Marquer en rupture » dans l'admin
--   - 'shopify' : une commande payée contenait un produit vendu à l'unité
--                 (stock catalogue = 1), reçue par le webhook
-- Retirer la ligne remet le produit en vente.
-- =============================================

create table if not exists stock_epuise (
  slug       text        primary key,
  source     text        not null default 'admin',
  created_at timestamptz not null default now()
);

alter table stock_epuise enable row level security;
-- Aucune policy publique : lecture et écriture passent par le serveur
-- (clé service_role), jamais par le navigateur.
