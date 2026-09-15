-- =============================================
-- BOIS TRESOR — Conversion produit, calcul corrigé
--
-- Le calcul précédent divisait les mises au panier par les vues de fiche
-- et pouvait dépasser 100 % : on peut cliquer « Commander » depuis une
-- carte de collection sans jamais ouvrir la fiche. Les deux chiffres ne se
-- comparaient donc pas.
--
-- Le taux est désormais calculé de visiteur à visiteur, sur le seul
-- périmètre où la comparaison a un sens : parmi ceux qui ont ouvert la
-- fiche, combien ont ensuite mis au panier. Les achats faits sans passer
-- par la fiche sont comptés à part, dans leur propre colonne.
-- =============================================

drop function if exists analytics_product_performance(integer);

create or replace function analytics_product_performance(p_days integer default 7)
returns table (
  slug            text,
  name            text,
  vues            bigint,   -- visiteurs ayant ouvert la fiche
  achats          bigint,   -- visiteurs ayant mis au panier (toutes origines)
  achats_fiche    bigint,   -- ... après avoir ouvert la fiche
  achats_carte    bigint,   -- ... directement depuis une carte de collection
  taux            numeric,  -- achats_fiche / vues, borné par construction
  valeur_totale   numeric,
  scroll_moyen    integer
)
language sql
security definer
set search_path = public
as $$
with bornes as (
  select now() - make_interval(days => greatest(p_days, 1)) as depuis
),
evts as (
  select e.*, e.session_id as sid
  from analytics_events e
  join analytics_sessions s on s.id = e.session_id, bornes b
  where e.occurred_at >= b.depuis
    and s.country = any(analytics_zone())
),
-- Un visiteur compte une fois par produit, même s'il revient dix fois.
vues as (
  select
    split_part(trim(both '/' from e.path), '/', 2) as slug,
    e.sid
  from evts e
  where e.type = 'pageview'
    and e.path like '/produits/%'
    and split_part(trim(both '/' from e.path), '/', 2) <> ''
  group by 1, 2
),
scrolls as (
  select
    split_part(trim(both '/' from e.path), '/', 2) as slug,
    coalesce(round(avg(e.scroll_pct))::int, 0)     as scroll_moyen
  from evts e
  where e.type = 'page_exit' and e.path like '/produits/%'
  group by 1
),
achats as (
  select
    e.meta->'product'->>'slug'                               as slug,
    e.sid,
    max(e.meta->'product'->>'name')                          as name,
    sum((e.meta->'product'->>'value')::numeric)              as valeur
  from evts e
  where e.type = 'click' and e.meta->'product'->>'slug' is not null
  group by 1, 2
),
agg_vues as (
  select slug, count(*) as vues from vues group by 1
),
agg_achats as (
  select
    a.slug,
    max(a.name)                                                        as name,
    count(*)                                                           as achats,
    count(*) filter (where v.sid is not null)                          as achats_fiche,
    count(*) filter (where v.sid is null)                              as achats_carte,
    coalesce(sum(a.valeur), 0)                                         as valeur_totale
  from achats a
  left join vues v on v.slug = a.slug and v.sid = a.sid
  group by 1
)
select
  coalesce(v.slug, a.slug)                                             as slug,
  coalesce(a.name, coalesce(v.slug, a.slug))                           as name,
  coalesce(v.vues, 0)                                                  as vues,
  coalesce(a.achats, 0)                                                as achats,
  coalesce(a.achats_fiche, 0)                                          as achats_fiche,
  coalesce(a.achats_carte, 0)                                          as achats_carte,
  case when coalesce(v.vues, 0) > 0
       then round(coalesce(a.achats_fiche, 0)::numeric * 100 / v.vues, 1)
       else 0 end                                                      as taux,
  coalesce(a.valeur_totale, 0)                                         as valeur_totale,
  coalesce(s.scroll_moyen, 0)                                          as scroll_moyen
from agg_vues v
full outer join agg_achats a on a.slug = v.slug
left join scrolls s on s.slug = coalesce(v.slug, a.slug)
where coalesce(v.vues, 0) > 0 or coalesce(a.achats, 0) > 0
order by achats desc, vues desc
limit 60;
$$;

revoke all on function analytics_product_performance(integer) from public, anon, authenticated;
