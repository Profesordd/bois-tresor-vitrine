-- =============================================
-- BOIS TRESOR — Messages du formulaire de contact
--
-- Les demandes sont enregistrées en base et lues depuis l'espace
-- d'administration. Aucun envoi d'email : le gérant répond lui-même,
-- depuis sa propre boîte. Rien ne peut donc échouer en silence.
--
-- La table contient des données personnelles (nom, email, message) :
-- RLS actif, aucune policy publique, accès serveur uniquement.
-- =============================================

create table if not exists contact_messages (
  id         uuid        primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  name       text        not null,
  email      text        not null,
  subject    text,
  message    text        not null,

  -- Passe à vrai quand le gérant a répondu, pour distinguer les nouvelles
  -- demandes de celles déjà traitées.
  handled    boolean     not null default false,
  handled_at timestamptz
);

create index if not exists contact_messages_created_idx on contact_messages (created_at desc);
create index if not exists contact_messages_handled_idx on contact_messages (handled, created_at desc);

alter table contact_messages enable row level security;
