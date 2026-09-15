-- =============================================
-- BOIS TRESOR — Requêtes du tableau de bord
--
-- Les agrégats sont calculés par la base et renvoyés en un seul appel :
-- le tableau de bord ne rapatrie jamais les lignes brutes, qui se comptent
-- vite en dizaines de milliers.
-- =============================================

-- ── Vue d'ensemble sur une période ────────────────────────────────────
create or replace function analytics_overview(p_days integer default 7)
returns json
language sql
security definer
set search_path = public
as $$
with bornes as (
  select now() - make_interval(days => greatest(p_days, 1)) as depuis
),
visites as (
  select s.* from analytics_sessions s, bornes b where s.started_at >= b.depuis
),
resume as (
  select
    count(*)                                                     as visites,
    coalesce(round(avg(duration_ms) / 1000.0)::int, 0)           as duree_moyenne_s,
    coalesce(round(avg(pageviews)::numeric, 1), 0)               as pages_par_visite,
    count(*) filter (where pageviews <= 1)                       as visites_une_page,
    count(*) filter (where saw_collection)                       as etape_collection,
    count(*) filter (where saw_product)                          as etape_produit,
    count(*) filter (where clicked_buy)                          as etape_achat
  from visites
),
-- Performance page par page : temps passé, scroll atteint, taux de sortie.
pages as (
  select
    e.path,
    count(*) filter (where e.type = 'pageview')                          as vues,
    coalesce(round(avg(e.duration_ms) filter (where e.type = 'page_exit') / 1000.0)::int, 0) as duree_moyenne_s,
    coalesce(round(avg(e.scroll_pct) filter (where e.type = 'page_exit'))::int, 0)           as scroll_moyen,
    count(*) filter (where e.path = s.exit_path and e.type = 'pageview')  as sorties
  from analytics_events e
  join visites s on s.id = e.session_id
  group by e.path
  having count(*) filter (where e.type = 'pageview') > 0
  order by vues desc
  limit 25
),
-- Ce sur quoi les visiteurs cliquent réellement.
clics as (
  select e.label, e.path, count(*) as total
  from analytics_events e
  join visites s on s.id = e.session_id
  where e.type = 'click' and e.label is not null
  group by e.label, e.path
  order by total desc
  limit 20
),
-- Champs de formulaire ouverts puis laissés vides.
champs as (
  select
    e.label,
    count(*)                                             as ouvertures,
    count(*) filter (where (e.meta->>'filled') = 'false') as abandons
  from analytics_events e
  join visites s on s.id = e.session_id
  where e.type = 'form_field' and e.label is not null
  group by e.label
  order by abandons desc
  limit 15
),
-- D'où viennent les visiteurs.
sources as (
  select
    coalesce(utm_source, case when referrer is null then 'direct' else split_part(replace(replace(referrer,'https://',''),'http://',''), '/', 1) end) as source,
    count(*) as visites
  from visites
  group by 1
  order by visites desc
  limit 12
),
appareils as (
  select coalesce(device, 'inconnu') as appareil, count(*) as visites
  from visites group by 1 order by visites desc
)
select json_build_object(
  'periode_jours', greatest(p_days, 1),
  'resume',    (select row_to_json(r) from resume r),
  'pages',     coalesce((select json_agg(p) from pages p), '[]'::json),
  'clics',     coalesce((select json_agg(c) from clics c), '[]'::json),
  'champs',    coalesce((select json_agg(f) from champs f), '[]'::json),
  'sources',   coalesce((select json_agg(s) from sources s), '[]'::json),
  'appareils', coalesce((select json_agg(a) from appareils a), '[]'::json)
);
$$;

-- ── Liste des visites récentes ────────────────────────────────────────
create or replace function analytics_recent_sessions(p_days integer default 7, p_limit integer default 100)
returns table (
  id uuid, started_at timestamptz, entry_path text, exit_path text,
  source text, device text, pageviews integer, duration_ms bigint,
  saw_collection boolean, saw_product boolean, clicked_buy boolean
)
language sql
security definer
set search_path = public
as $$
  select
    s.id, s.started_at, s.entry_path, s.exit_path,
    coalesce(s.utm_source, case when s.referrer is null then 'direct'
      else split_part(replace(replace(s.referrer,'https://',''),'http://',''), '/', 1) end) as source,
    s.device, s.pageviews, s.duration_ms,
    s.saw_collection, s.saw_product, s.clicked_buy
  from analytics_sessions s
  where s.started_at >= now() - make_interval(days => greatest(p_days, 1))
  order by s.started_at desc
  limit least(greatest(p_limit, 1), 500);
$$;

-- ── Parcours détaillé d'une visite ────────────────────────────────────
create or replace function analytics_session_detail(p_session uuid)
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'session', (
      -- La provenance est recomposée ici comme dans la liste, sans quoi la
      -- fiche détaillée afficherait une origine vide.
      select row_to_json(x) from (
        select s.*,
          coalesce(s.utm_source, case when s.referrer is null then 'direct'
            else split_part(replace(replace(s.referrer,'https://',''),'http://',''), '/', 1) end) as source
        from analytics_sessions s where s.id = p_session
      ) x
    ),
    'events',  coalesce((
      select json_agg(row_to_json(e) order by e.occurred_at, e.id)
      from analytics_events e where e.session_id = p_session
    ), '[]'::json)
  );
$$;

revoke all on function analytics_overview(integer)                  from public, anon, authenticated;
revoke all on function analytics_recent_sessions(integer, integer)  from public, anon, authenticated;
revoke all on function analytics_session_detail(uuid)               from public, anon, authenticated;
