-- =============================================
-- BOIS TRESOR — Conversion par produit et entonnoir par appareil
-- =============================================

-- ── Entonnoir segmenté par type d'appareil ────────────────────────────
-- Un appareil qui convertit nettement moins que l'autre ne révèle pas une
-- préférence des visiteurs : c'est presque toujours le signe d'un défaut
-- d'affichage ou d'un bouton inatteignable sur cet appareil.
create or replace function analytics_funnel_by_device(p_days integer default 7)
returns table (
  device           text,
  visites          bigint,
  saw_collection   bigint,
  saw_product      bigint,
  clicked_buy      bigint,
  duree_moyenne_s  integer,
  pages_par_visite numeric
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
  group by 1
  order by visites desc;
$$;

-- ── Conversion produit par produit ────────────────────────────────────
-- Les vues viennent des pages /produits/<slug>/ ; les achats viennent du
-- slug porté par le bouton, et non de l'URL de la page — sans quoi un clic
-- depuis une carte de collection serait attribué à la collection.
create or replace function analytics_product_performance(p_days integer default 7)
returns table (
  slug         text,
  name         text,
  vues         bigint,
  achats       bigint,
  taux         numeric,
  valeur_totale numeric,
  scroll_moyen integer
)
language sql
security definer
set search_path = public
as $$
with bornes as (
  select now() - make_interval(days => greatest(p_days, 1)) as depuis
),
vues as (
  select
    -- /produits/<slug>/ -> <slug>
    split_part(trim(both '/' from e.path), '/', 2) as slug,
    count(*) filter (where e.type = 'pageview')    as vues,
    coalesce(round(avg(e.scroll_pct) filter (where e.type = 'page_exit'))::int, 0) as scroll_moyen
  from analytics_events e, bornes b
  where e.occurred_at >= b.depuis
    and e.path like '/produits/%'
    and split_part(trim(both '/' from e.path), '/', 2) <> ''
  group by 1
),
achats as (
  select
    e.meta->'product'->>'slug'                                   as slug,
    max(e.meta->'product'->>'name')                              as name,
    count(*)                                                     as achats,
    coalesce(sum((e.meta->'product'->>'value')::numeric), 0)     as valeur_totale
  from analytics_events e, bornes b
  where e.occurred_at >= b.depuis
    and e.type = 'click'
    and e.meta->'product'->>'slug' is not null
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

revoke all on function analytics_funnel_by_device(integer)     from public, anon, authenticated;
revoke all on function analytics_product_performance(integer)  from public, anon, authenticated;
