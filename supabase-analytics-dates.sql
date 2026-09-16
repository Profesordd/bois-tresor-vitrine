-- =============================================
-- BOIS TRESOR — Statistiques sur une plage de dates, en heure française
--
-- Les horodatages sont stockés en UTC. Interrogés tels quels, le « 15
-- septembre » commencerait à 2 h du matin heure de Paris en été, et une
-- visite de 23 h 30 basculerait au lendemain. Toutes les bornes sont donc
-- converties depuis le fuseau Europe/Paris, qui gère aussi le changement
-- d'heure.
--
-- p_from et p_to sont des dates incluses : du 15 au 15 = la journée du 15.
-- =============================================

-- Bornes exactes d'une plage de journées françaises.
create or replace function analytics_bornes(p_from date, p_to date)
returns table (depuis timestamptz, jusqua timestamptz)
language sql immutable as $$
  select
    (p_from::timestamp) at time zone 'Europe/Paris',
    ((p_to + 1)::timestamp) at time zone 'Europe/Paris';
$$;

-- ── Vue d'ensemble ────────────────────────────────────────────────────
create or replace function analytics_overview_dates(p_from date, p_to date)
returns json
language sql
security definer
set search_path = public
as $$
with b as (select * from analytics_bornes(p_from, p_to)),
visites as (
  select s.* from analytics_sessions s, b
  where s.started_at >= b.depuis and s.started_at < b.jusqua
    and s.country = any(analytics_zone())
),
resume as (
  select
    count(*)                                            as visites,
    coalesce(round(avg(duration_ms) / 1000.0)::int, 0)  as duree_moyenne_s,
    coalesce(round(avg(pageviews)::numeric, 1), 0)      as pages_par_visite,
    count(*) filter (where pageviews <= 1)              as visites_une_page,
    count(*) filter (where saw_collection)              as etape_collection,
    count(*) filter (where saw_product)                 as etape_produit,
    count(*) filter (where clicked_buy)                 as etape_achat,
    0                                                   as hors_zone
  from visites
),
pages as (
  select
    e.path,
    count(*) filter (where e.type = 'pageview') as vues,
    coalesce(round(avg(e.duration_ms) filter (where e.type = 'page_exit') / 1000.0)::int, 0) as duree_moyenne_s,
    coalesce(round(avg(e.scroll_pct) filter (where e.type = 'page_exit'))::int, 0)           as scroll_moyen,
    count(*) filter (where e.path = s.exit_path and e.type = 'pageview') as sorties
  from analytics_events e
  join visites s on s.id = e.session_id
  group by e.path
  having count(*) filter (where e.type = 'pageview') > 0
  order by vues desc limit 25
),
clics as (
  select e.label, e.path, count(*) as total
  from analytics_events e join visites s on s.id = e.session_id
  where e.type = 'click' and e.label is not null
  group by e.label, e.path order by total desc limit 20
),
champs as (
  select e.label, count(*) as ouvertures,
         count(*) filter (where (e.meta->>'filled') = 'false') as abandons
  from analytics_events e join visites s on s.id = e.session_id
  where e.type = 'form_field' and e.label is not null
  group by e.label order by abandons desc limit 15
),
sources as (
  select coalesce(utm_source, case when referrer is null then 'direct'
           else split_part(replace(replace(referrer,'https://',''),'http://',''), '/', 1) end) as source,
         count(*) as visites
  from visites group by 1 order by visites desc limit 12
),
appareils as (
  select coalesce(device, 'inconnu') as appareil, count(*) as visites
  from visites group by 1 order by visites desc
),
pays as (
  select country as code, count(*) as visites from visites group by 1 order by visites desc
),
-- Une ligne par journée française, pour suivre l'évolution.
jours as (
  select
    ((s.started_at at time zone 'Europe/Paris')::date)  as jour,
    count(*)                                           as visites,
    count(*) filter (where s.clicked_buy)              as achats
  from visites s group by 1 order by 1
)
select json_build_object(
  'du', p_from, 'au', p_to,
  'resume',    (select row_to_json(r) from resume r),
  'pages',     coalesce((select json_agg(p) from pages p), '[]'::json),
  'clics',     coalesce((select json_agg(c) from clics c), '[]'::json),
  'champs',    coalesce((select json_agg(f) from champs f), '[]'::json),
  'sources',   coalesce((select json_agg(s) from sources s), '[]'::json),
  'appareils', coalesce((select json_agg(a) from appareils a), '[]'::json),
  'pays',      coalesce((select json_agg(x) from pays x), '[]'::json),
  'jours',     coalesce((select json_agg(j) from jours j), '[]'::json)
);
$$;

-- ── Visites récentes ──────────────────────────────────────────────────
drop function if exists analytics_recent_sessions_dates(date, date, integer);
create or replace function analytics_recent_sessions_dates(p_from date, p_to date, p_limit integer default 200)
returns table (
  id uuid, started_at timestamptz, entry_path text, exit_path text,
  source text, device text, country text, pageviews integer, duration_ms bigint,
  saw_collection boolean, saw_product boolean, clicked_buy boolean
)
language sql security definer set search_path = public as $$
  select s.id, s.started_at, s.entry_path, s.exit_path,
    coalesce(s.utm_source, case when s.referrer is null then 'direct'
      else split_part(replace(replace(s.referrer,'https://',''),'http://',''), '/', 1) end),
    s.device, s.country, s.pageviews, s.duration_ms,
    s.saw_collection, s.saw_product, s.clicked_buy
  from analytics_sessions s, analytics_bornes(p_from, p_to) b
  where s.started_at >= b.depuis and s.started_at < b.jusqua
    and s.country = any(analytics_zone())
  order by s.started_at desc
  limit least(greatest(p_limit, 1), 1000);
$$;

-- ── Entonnoir par appareil ────────────────────────────────────────────
create or replace function analytics_funnel_by_device_dates(p_from date, p_to date)
returns table (device text, visites bigint, saw_collection bigint, saw_product bigint,
               clicked_buy bigint, duree_moyenne_s integer, pages_par_visite numeric)
language sql security definer set search_path = public as $$
  select coalesce(s.device, 'inconnu'), count(*),
    count(*) filter (where s.saw_collection),
    count(*) filter (where s.saw_product),
    count(*) filter (where s.clicked_buy),
    coalesce(round(avg(s.duration_ms) / 1000.0)::int, 0),
    coalesce(round(avg(s.pageviews)::numeric, 1), 0)
  from analytics_sessions s, analytics_bornes(p_from, p_to) b
  where s.started_at >= b.depuis and s.started_at < b.jusqua
    and s.country = any(analytics_zone())
  group by 1 order by 2 desc;
$$;

-- ── Performance produit ───────────────────────────────────────────────
create or replace function analytics_product_performance_dates(p_from date, p_to date)
returns table (slug text, name text, vues bigint, achats bigint, achats_fiche bigint,
               achats_carte bigint, taux numeric, valeur_totale numeric, scroll_moyen integer)
language sql security definer set search_path = public as $$
with b as (select * from analytics_bornes(p_from, p_to)),
evts as (
  select e.*, e.session_id as sid
  from analytics_events e
  join analytics_sessions s on s.id = e.session_id, b
  where e.occurred_at >= b.depuis and e.occurred_at < b.jusqua
    and s.country = any(analytics_zone())
),
vues as (
  select split_part(trim(both '/' from e.path), '/', 2) as slug, e.sid
  from evts e
  where e.type = 'pageview' and e.path like '/produits/%'
    and split_part(trim(both '/' from e.path), '/', 2) <> ''
  group by 1, 2
),
scrolls as (
  select split_part(trim(both '/' from e.path), '/', 2) as slug,
         coalesce(round(avg(e.scroll_pct))::int, 0) as scroll_moyen
  from evts e where e.type = 'page_exit' and e.path like '/produits/%' group by 1
),
achats as (
  select e.meta->'product'->>'slug' as slug, e.sid,
         max(e.meta->'product'->>'name') as name,
         sum((e.meta->'product'->>'value')::numeric) as valeur
  from evts e
  where e.type = 'click' and e.meta->'product'->>'slug' is not null
  group by 1, 2
),
agg_vues as (select slug, count(*) as vues from vues group by 1),
agg_achats as (
  select a.slug, max(a.name) as name, count(*) as achats,
         count(*) filter (where v.sid is not null) as achats_fiche,
         count(*) filter (where v.sid is null)     as achats_carte,
         coalesce(sum(a.valeur), 0)                as valeur_totale
  from achats a left join vues v on v.slug = a.slug and v.sid = a.sid
  group by 1
)
select coalesce(v.slug, a.slug), coalesce(a.name, coalesce(v.slug, a.slug)),
  coalesce(v.vues, 0), coalesce(a.achats, 0),
  coalesce(a.achats_fiche, 0), coalesce(a.achats_carte, 0),
  case when coalesce(v.vues, 0) > 0
       then round(coalesce(a.achats_fiche, 0)::numeric * 100 / v.vues, 1) else 0 end,
  coalesce(a.valeur_totale, 0), coalesce(s.scroll_moyen, 0)
from agg_vues v
full outer join agg_achats a on a.slug = v.slug
left join scrolls s on s.slug = coalesce(v.slug, a.slug)
where coalesce(v.vues, 0) > 0 or coalesce(a.achats, 0) > 0
order by 4 desc, 3 desc limit 60;
$$;

-- ── Événements détaillés, pour l'export ───────────────────────────────
create or replace function analytics_events_dates(p_from date, p_to date, p_limit integer default 20000)
returns table (
  occurred_at timestamptz, session_id uuid, country text, device text,
  type text, path text, label text, duration_ms integer, scroll_pct integer,
  produit text, quantite text, montant text, champ_rempli text
)
language sql security definer set search_path = public as $$
  select e.occurred_at, e.session_id, s.country, s.device, e.type, e.path, e.label,
         e.duration_ms, e.scroll_pct,
         e.meta->'product'->>'name', e.meta->'product'->>'quantity',
         e.meta->'product'->>'value', e.meta->>'filled'
  from analytics_events e
  join analytics_sessions s on s.id = e.session_id, analytics_bornes(p_from, p_to) b
  where e.occurred_at >= b.depuis and e.occurred_at < b.jusqua
    and s.country = any(analytics_zone())
  order by e.session_id, e.occurred_at, e.id
  limit least(greatest(p_limit, 1), 100000);
$$;

revoke all on function analytics_bornes(date, date)                        from public, anon, authenticated;
revoke all on function analytics_overview_dates(date, date)                from public, anon, authenticated;
revoke all on function analytics_recent_sessions_dates(date, date, integer) from public, anon, authenticated;
revoke all on function analytics_funnel_by_device_dates(date, date)        from public, anon, authenticated;
revoke all on function analytics_product_performance_dates(date, date)     from public, anon, authenticated;
revoke all on function analytics_events_dates(date, date, integer)         from public, anon, authenticated;
