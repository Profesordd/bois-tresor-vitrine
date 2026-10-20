-- =============================================
-- BOIS TRESOR — Adresses laissées avant le paiement (20/10/2026)
--
-- Le paiement se fait sur un domaine tiers, sur lequel nous n'exécutons
-- aucun code. Une fois le visiteur parti là-bas, il est hors de portée :
-- s'il abandonne, nous n'avons rien pour le recontacter. Sur deux jours de
-- publicité, 70 personnes ont atteint le paiement et 3 ont commandé.
--
-- D'où cette étape : le clic sur « Commander » demande l'adresse e-mail
-- avant de rediriger. Elle est enregistrée ici, puis la redirection part.
--
-- Données personnelles : RLS actif, aucune policy publique, accès serveur
-- uniquement par la clé service_role.
-- =============================================

create table if not exists leads (
  id         uuid        primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  email      text        not null,
  -- Facultatif. Sur cette clientèle, un appel aboutit souvent là où un
  -- e-mail reste sans réponse, en particulier après un refus de carte.
  telephone  text,

  -- Accord pour recevoir autre chose que le suivi de sa commande. En
  -- France, prospecter par e-mail quelqu'un qui n'a jamais acheté suppose
  -- son accord préalable : sans cette case, pas de relance commerciale.
  consent    boolean     not null default false,

  -- Ce que la personne s'apprêtait à payer, figé au moment du clic : le
  -- catalogue bouge, le lead doit rester lisible dans six mois.
  produit_slug text,
  produit_nom  text,
  lot          text,
  montant      numeric(10, 2),

  -- Rattachement à la mesure d'audience : d'où venait la visite, combien
  -- de temps elle a duré, quelles pages ont été vues.
  session_id uuid,
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  pays       text,
  appareil   text,

  -- Passe à vrai quand une commande payée porte la même adresse (webhook
  -- Shopify orders/paid). Sert à ne jamais relancer quelqu'un qui a payé.
  a_commande    boolean     not null default false,
  commande_a    timestamptz,

  -- Suivi manuel par le gérant : appelé, répondu, sans suite.
  traite     boolean     not null default false,
  traite_a   timestamptz,
  note       text
);

-- Une adresse peut revenir plusieurs fois, sur des produits différents :
-- pas de contrainte d'unicité, c'est la suite des tentatives qui informe.
create index if not exists leads_created_idx  on leads (created_at desc);
create index if not exists leads_email_idx    on leads (lower(email));
create index if not exists leads_traite_idx   on leads (traite, created_at desc);
create index if not exists leads_commande_idx on leads (a_commande, created_at desc);

alter table leads enable row level security;
