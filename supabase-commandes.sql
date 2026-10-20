-- =============================================
-- BOIS TRESOR — Commandes passées sur le checkout maison (20/10/2026)
--
-- Jusqu'ici le paiement partait chez un prestataire externe et le site ne
-- gardait rien : ni adresse, ni ligne de commande. Le paiement se faisant
-- désormais sur le site, c'est à nous de tenir le registre.
--
-- Le montant vit ICI et nulle part ailleurs. Il est calculé côté serveur à
-- la création de la commande. Un montant transmis par le navigateur serait
-- modifiable par n'importe qui.
--
-- Données personnelles : RLS actif, aucune policy publique, accès serveur
-- uniquement par la clé service_role.
-- =============================================

create table if not exists commandes (
  id         uuid        primary key default gen_random_uuid(),
  reference  text        not null unique,
  created_at timestamptz not null default now(),

  statut     text        not null default 'en_attente'
             check (statut in ('en_attente', 'payee', 'refusee')),

  produit_slug  text     not null,
  produit_nom   text     not null,
  lot           text,
  quantite      integer  not null default 1,
  montant_cents integer  not null check (montant_cents > 0),

  email       text       not null,
  prenom      text       not null,
  nom         text       not null,
  telephone   text       not null,
  adresse     text       not null,
  complement  text,
  code_postal text       not null,
  ville       text       not null,
  pays        text       not null default 'FR',

  paiement_id     text,
  paiement_statut text,
  payee_a         timestamptz,
  erreur          text,

  session_id uuid,
  ip_client  text
);

create index if not exists commandes_created_idx  on commandes (created_at desc);
create index if not exists commandes_statut_idx   on commandes (statut, created_at desc);
create index if not exists commandes_email_idx    on commandes (lower(email));
create index if not exists commandes_paiement_idx on commandes (paiement_id);

alter table commandes enable row level security;
