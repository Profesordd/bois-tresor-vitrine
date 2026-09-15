-- =============================================
-- BOIS TRESOR — Statistiques restreintes à la zone commerciale
--
-- Toutes les requêtes du tableau de bord ne comptent que les visites
-- venues de France, Belgique, Suisse, Luxembourg et Monaco. Le reste du
-- trafic (robots résiduels, curieux lointains, scanners) n'a aucune chance
-- d'acheter : le compter écraserait le taux de conversion et ferait croire
-- à un problème du site.
--
-- Les visites hors zone restent en base et sont comptées à part, pour que
-- le gérant sache ce qui a été écarté plutôt que de l'ignorer.
-- =============================================

-- Les fonctions dont le type de retour change doivent être supprimées
-- avant d'être recréées : Postgres refuse de modifier une signature.
drop function if exists analytics_recent_sessions(integer, integer);

create or replace function analytics_zone() returns text[]
language sql immutable as $$ select array['FR','BE','CH','LU','MC'] $$;

-- ── Vue d'ensemble ────────────────────────────────────────────────────
create or replace function analytics_overview(p_days integer default 7)
returns json
language sql
security definer
set search_path = public
as $$
with bornes as (
  select now() - make_interval(days => greatest(p_days, 1)) as depuis
),
toutes as (
  select s.* from analytics_sessions s, bornes b where s.started_at >= b.depuis
),
visites as (
  select * from toutes where country = any(analytics_zone())
),
resume as (
  select
    count(*)                                                     as visites,
    coalesce(round(avg(duration_ms) / 1000.0)::int, 0)           as duree_moyenne_s,
    coalesce(round(avg(pageviews)::numeric, 1), 0)               as pages_par_visite,
    count(*) filter (where pageviews <= 1)                       as visites_une_page,
    count(*) filter (where saw_collection)                       as etape_collection,
    count(*) filter (where saw_product)                          as etape_produit,
    count(*) filter (where clicked_buy)                          as etape_achat,
    (select count(*) from toutes where country is null or not (country = any(analytics_zone()))) as hors_zone
  from visites
),
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
clics as (
  select e.label, e.path, count(*) as total
  from analytics_events e
  join visites s on s.id = e.session_id
  where e.type = 'click' and e.label is not null
  group by e.label, e.path
  order by total desc
  limit 20
),
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
),
pays as (
  select country as code, count(*) as visites
  from visites group by 1 order by visites desc
)
select json_build_object(
  'periode_jours', greatest(p_days, 1),
  'resume',    (select row_to_json(r) from resume r),
  'pages',     coalesce((select json_agg(p) from pages p), '[]'::json),
  'clics',     coalesce((select json_agg(c) from clics c), '[]'::json),
  'champs',    coalesce((select json_agg(f) from champs f), '[]'::json),
  'sources',   coalesce((select json_agg(s) from sources s), '[]'::json),
  'appareils', coalesce((select json_agg(a) from appareils a), '[]'::json),
  'pays',      coalesce((select json_agg(x) from pays x), '[]'::json)
);
$$;

-- ── Visites récentes ──────────────────────────────────────────────────
create or replace function analytics_recent_sessions(p_days integer default 7, p_limit integer default 100)
returns table (
  id uuid, started_at timestamptz, entry_path text, exit_path text,
  source text, device text, country text, pageviews integer, duration_ms bigint,
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
    s.device, s.country, s.pageviews, s.duration_ms,
    s.saw_collection, s.saw_product, s.clicked_buy
  from analytics_sessions s
  where s.started_at >= now() - make_interval(days => greatest(p_days, 1))
    and s.country = any(analytics_zone())
  order by s.started_at desc
  limit least(greatest(p_limit, 1), 500);
$$;

-- ── Entonnoir par appareil ────────────────────────────────────────────
create or replace function analytics_funnel_by_device(p_days integer default 7)
returns table (
  device text, visites bigint, saw_collection bigint, saw_product bigint,
  clicked_buy bigint, duree_moyenne_s integer, pages_par_visite numeric
)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(s.device, 'inconnu')                              as device,
    count(*)                                                   as visites,
    count(*) filter (where s.saw_collection)                   as saw_collection,
    count(*) filter (where s.saw_product)                      as saw_product,
    count(*) filter (where s.clicked_buy)                      as clicked_buy,
    coalesce(round(avg(s.duration_ms) / 1000.0)::int, 0)       as duree_moyenne_s,
    coalesce(round(avg(s.pageviews)::numeric, 1), 0)           as pages_par_visite
  from analytics_sessions s
  where s.started_at >= now() - make_interval(days => greatest(p_days, 1))
    and s.country = any(analytics_zone())
  group by 1
  order by visites desc;
$$;

-- ── Performance produit ───────────────────────────────────────────────
create or replace function analytics_product_performance(p_days integer default 7)
returns table (
  slug text, name text, vues bigint, achats bigint,
  taux numeric, valeur_totale numeric, scroll_moyen integer
)
language sql
security definer
set search_path = public
as $$
with bornes as (
  select now() - make_interval(days => greatest(p_days, 1)) as depuis
),
-- Seuls les événements de visiteurs de la zone sont comptés.
evts as (
  select e.*
  from analytics_events e
  join analytics_sessions s on s.id = e.session_id, bornes b
  where e.occurred_at >= b.depuis
    and s.country = any(analytics_zone())
),
vues as (
  select
    split_part(trim(both '/' from e.path), '/', 2) as slug,
    count(*) filter (where e.type = 'pageview')    as vues,
    coalesce(round(avg(e.scroll_pct) filter (where e.type = 'page_exit'))::int, 0) as scroll_moyen
  from evts e
  where e.path like '/produits/%'
    and split_part(trim(both '/' from e.path), '/', 2) <> ''
  group by 1
),
achats as (
  select
    e.meta->'product'->>'slug'                                   as slug,
    max(e.meta->'product'->>'name')                              as name,
    count(*)                                                     as achats,
    coalesce(sum((e.meta->'product'->>'value')::numeric), 0)     as valeur_totale
  from evts e
  where e.type = 'click' and e.meta->'product'->>'slug' is not null
  group by 1
)
select
  coalesce(v.slug, a.slug)                                       as slug,
  coalesce(a.name, coalesce(v.slug, a.slug))                     as name,
  coalesce(v.vues, 0)                                            as vues,
  coalesce(a.achats, 0)                                          as achats,
  case when coalesce(v.vues, 0) > 0
       then round(coalesce(a.achats, 0)::numeric * 100 / v.vues, 1)
       else 0 end                                                as taux,
  coalesce(a.valeur_totale, 0)                                   as valeur_totale,
  coalesce(v.scroll_moyen, 0)                                    as scroll_moyen
from vues v
full outer join achats a on a.slug = v.slug
where coalesce(v.vues, 0) > 0 or coalesce(a.achats, 0) > 0
order by achats desc, vues desc
limit 60;
$$;

revoke all on function analytics_overview(integer)                 from public, anon, authenticated;
revoke all on function analytics_recent_sessions(integer, integer) from public, anon, authenticated;
revoke all on function analytics_funnel_by_device(integer)         from public, anon, authenticated;
revoke all on function analytics_product_performance(integer)      from public, anon, authenticated;
