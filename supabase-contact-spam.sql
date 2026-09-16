-- =============================================
-- BOIS TRESOR — Adresses bloquées pour le formulaire de contact
--
-- Marquer une demande comme indésirable supprime le message et ajoute son
-- adresse ici. Les envois suivants venant de cette adresse ne sont plus
-- enregistrés du tout — l'expéditeur, lui, voit la même confirmation que
-- d'habitude : un blocage annoncé invite simplement à changer d'adresse.
--
-- Un extrait du message est conservé pour que le gérant puisse revoir, des
-- semaines plus tard, pourquoi cette adresse a été bloquée — et la
-- débloquer s'il s'est trompé. Sans cette trace, une erreur de clic
-- couperait définitivement un vrai client, sans que personne ne le sache.
-- =============================================

create table if not exists contact_blocklist (
  -- Adresse normalisée en minuscules, pour que la casse ne contourne rien.
  email        text        primary key,
  blocked_at   timestamptz not null default now(),
  extrait      text,
  nom          text
);

create index if not exists contact_blocklist_date_idx on contact_blocklist (blocked_at desc);

alter table contact_blocklist enable row level security;
