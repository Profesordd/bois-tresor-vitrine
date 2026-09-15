-- =============================================
-- BOIS TRESOR — Mesure d'audience (première partie)
--
-- Collecte maison, sans cookie et sans donnée personnelle :
--   - identifiant de session tiré au sort, gardé en sessionStorage,
--     donc effacé à la fermeture de l'onglet et jamais partagé entre sites ;
--   - aucune adresse IP, aucun identifiant publicitaire, aucun nom ;
--   - aucune donnée transmise à un tiers.
-- Dans ces conditions, la CNIL considère la mesure d'audience exemptée de
-- consentement — elle couvre donc 100 % des visiteurs, là où un outil
-- soumis au bandeau n'en verrait qu'une fraction.
--
-- Tables réservées au serveur : RLS actif, aucune policy publique.
-- =============================================

-- ── Une ligne par visite ──────────────────────────────────────────────
create table if not exists analytics_sessions (
  id             uuid        primary key,
  started_at     timestamptz not null default now(),
  last_seen_at   timestamptz not null default now(),

  entry_path     text        not null,
  exit_path      text,
  referrer       text,

  utm_source     text,
  utm_medium     text,
  utm_campaign   text,

  device         text        check (device in ('mobile', 'tablet', 'desktop')),

  pageviews      integer     not null default 0,
  duration_ms    bigint      not null default 0,

  -- Étapes de l'entonnoir, mises à jour au fil de la visite.
  saw_collection boolean     not null default false,
  saw_product    boolean     not null default false,
  clicked_buy    boolean     not null default false
);

-- ── Le détail de ce que fait le visiteur ──────────────────────────────
create table if not exists analytics_events (
  id          bigserial   primary key,
  session_id  uuid        not null references analytics_sessions(id) on delete cascade,

  -- pageview : arrivée sur une page
  -- page_exit : départ, avec le temps passé et le scroll atteint
  -- click     : clic sur un lien ou un bouton
  -- form_field: champ de formulaire quitté (rempli ou abandonné)
  type        text        not null check (type in ('pageview', 'page_exit', 'click', 'form_field')),

  path        text        not null,
  occurred_at timestamptz not null default now(),

  duration_ms integer,
  scroll_pct  integer     check (scroll_pct between 0 and 100),
  label       text,
  meta        jsonb       not null default '{}'
);

-- ── Index : les requêtes du tableau de bord filtrent par date et par page ──
create index if not exists analytics_sessions_started_idx on analytics_sessions (started_at desc);
create index if not exists analytics_sessions_funnel_idx  on analytics_sessions (saw_collection, saw_product, clicked_buy);
create index if not exists analytics_events_session_idx   on analytics_events (session_id, occurred_at);
create index if not exists analytics_events_type_idx      on analytics_events (type, occurred_at desc);
create index if not exists analytics_events_path_idx      on analytics_events (path, type);

-- ── RLS : aucune policy, donc aucun accès depuis le navigateur ────────
-- L'écriture passe par /api/analytics/collect et la lecture par le tableau
-- de bord, tous deux côté serveur avec la clé service_role.
alter table analytics_sessions enable row level security;
alter table analytics_events   enable row level security;

-- ── Mise à jour atomique des agrégats de session ──────────────────────
-- Les compteurs sont incrémentés côté base : deux requêtes simultanées
-- (l'onglet qui se ferme pendant qu'une autre page s'ouvre) ne peuvent pas
-- s'écraser mutuellement. Les étapes d'entonnoir ne font que passer à vrai.
create or replace function analytics_touch_session(
  p_session        uuid,
  p_last_path      text,
  p_pageviews      integer,
  p_duration_ms    bigint,
  p_saw_collection boolean,
  p_saw_product    boolean,
  p_clicked_buy    boolean
) returns void
language sql
security definer
set search_path = public
as $$
  update analytics_sessions set
    last_seen_at   = now(),
    exit_path      = p_last_path,
    pageviews      = pageviews   + greatest(p_pageviews, 0),
    duration_ms    = duration_ms + greatest(p_duration_ms, 0),
    saw_collection = saw_collection or p_saw_collection,
    saw_product    = saw_product    or p_saw_product,
    clicked_buy    = clicked_buy    or p_clicked_buy
  where id = p_session;
$$;

revoke all on function analytics_touch_session from public, anon, authenticated;
