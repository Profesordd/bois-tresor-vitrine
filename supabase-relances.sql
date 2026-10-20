-- =============================================
-- BOIS TRESOR — Séquence de relance des adresses laissées (20/10/2026)
--
-- Cinq messages après un paiement non abouti : 1 h, 6 h, J+1, J+3, J+7.
-- Deux le premier jour, parce que l'essentiel d'un panier abandonné se
-- joue dans les premières heures.
--
-- Deux garde-fous sont dans le schéma, pas dans le code :
--   1. `relances_lead_etape_key` rend un double envoi impossible, même si
--      deux exécutions du planificateur se chevauchent.
--   2. `on delete cascade` : effacer un lead efface son historique, sinon
--      une demande de suppression laisserait des traces derrière elle.
-- =============================================

-- ── Désinscription, portée par le lead lui-même ──
-- Une adresse qui se désinscrit ne doit plus rien recevoir, quelle que
-- soit la tentative d'achat concernée : la décision porte sur la personne,
-- pas sur l'une de ses visites.
alter table leads add column if not exists desinscrit    boolean not null default false;
alter table leads add column if not exists desinscrit_a  timestamptz;

create index if not exists leads_relancables_idx
  on leads (created_at)
  where a_commande = false and desinscrit = false;

create table if not exists relances (
  id         uuid        primary key default gen_random_uuid(),
  lead_id    uuid        not null references leads (id) on delete cascade,

  -- 1 à 5, dans l'ordre du calendrier.
  etape      smallint    not null check (etape between 1 and 5),
  envoye_a   timestamptz not null default now(),

  -- Identifiant renvoyé par Resend, pour retrouver un envoi chez eux.
  resend_id  text,
  -- Renseigné quand l'envoi a échoué. La ligne est créée dans tous les cas :
  -- sans elle, le planificateur réessaierait indéfiniment la même étape.
  erreur     text,

  unique (lead_id, etape)
);

create index if not exists relances_lead_idx    on relances (lead_id, etape);
create index if not exists relances_envoye_idx  on relances (envoye_a desc);

alter table relances enable row level security;
