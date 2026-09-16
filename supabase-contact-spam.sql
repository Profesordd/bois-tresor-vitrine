-- =============================================
-- BOIS TRESOR — Adresses bloquées pour le formulaire de contact
--
-- Marquer une demande comme indésirable supprime le message et ajoute son
-- adresse ici. Les envois suivants venant de cette adresse ne sont plus
-- enregistrés du tout — l'expéditeur, lui, voit la même confirmation que
-- d'habitude : un blocage annoncé invite simplement à changer d'adresse.
--
-- Le blocage est définitif, par choix : aucune interface ni route ne permet
-- de débloquer. Seule l'adresse est conservée, en minuscules pour qu'un
-- changement de casse ne contourne rien. Ni le nom ni le message ne sont
-- gardés : le message est effacé, et les conserver n'aurait plus d'objet.
-- =============================================

create table if not exists contact_blocklist (
  email      text        primary key,
  blocked_at timestamptz not null default now()
);

create index if not exists contact_blocklist_date_idx on contact_blocklist (blocked_at desc);

alter table contact_blocklist enable row level security;

-- Colonnes d'une version précédente, devenues sans objet.
alter table contact_blocklist drop column if exists extrait;
alter table contact_blocklist drop column if exists nom;
