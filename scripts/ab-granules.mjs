/**
 * Suivi du test A/B prix sur les granulés.
 *
 *   node scripts/ab-granules.mjs [nombre de jours, 7 par défaut]
 *
 * Compare les deux fiches par page d'atterrissage et par campagne, et non
 * par produit : une visite qui arrive sur B puis navigue vers A ne doit pas
 * être comptée du mauvais côté. `entry_path` tranche, le produit non.
 *
 * ⚠️ Ce script compte des CLICS, pas des ventes. La décision se prend sur
 * les commandes payées par variante, relevées côté processeur de paiement.
 * Un prix plus élevé peut très bien augmenter les clics et baisser les
 * paiements — c'est précisément le risque du test.
 */
import pg from 'pg'
import fs from 'node:fs'
import path from 'node:path'

const JOURS = Number(process.argv[2]) || 7
const ROOT = path.resolve(import.meta.dirname, '..')
const ZONE = ['FR', 'BE', 'CH', 'LU', 'MC']

const FICHES = {
  A: { slug: 'granules-de-bois-limouzi-palette-de-134-sacs-de-15-kg', label: 'Fiche A — prix bas' },
  B: { slug: 'granules-de-bois-limouzi-sacs-de-15-kg',                label: 'Fiche B — prix haut' },
}

const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8')
    .split('\n').filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).trim()] })
)

const client = new pg.Client({
  connectionString: `postgresql://postgres.gokiqefjfbiusaoyimxe:${encodeURIComponent(env.SUPABASE_DB_PASSWORD)}@aws-1-eu-west-3.pooler.supabase.com:5432/postgres`,
  ssl: { rejectUnauthorized: false },
})
await client.connect()
const q = async (sql, p = []) => (await client.query(sql, p)).rows

console.log(`\nTest A/B granulés — ${JOURS} derniers jours, zone commerciale, robots exclus\n`)

/* ── Visites et clics, par fiche d'atterrissage ── */
const parFiche = await q(
  `select
     case when s.entry_path like '%' || $2 || '%' then 'A'
          when s.entry_path like '%' || $3 || '%' then 'B' end as fiche,
     s.utm_campaign as campagne,
     count(*)                                        as visites,
     count(*) filter (where s.clicked_buy)           as clics_commander,
     round(100.0 * count(*) filter (where s.clicked_buy) / nullif(count(*), 0), 1) as taux,
     count(*) filter (where s.device = 'mobile')     as mobile,
     round(avg(s.duration_ms) / 1000)                as duree_s
   from analytics_sessions s
   where s.started_at > now() - ($1 || ' days')::interval
     and s.country = any($4)
     and (s.entry_path like '%' || $2 || '%' or s.entry_path like '%' || $3 || '%')
   group by 1, 2 order by 1, 3 desc`,
  [String(JOURS), FICHES.A.slug, FICHES.B.slug, ZONE]
)
console.log('── Par fiche d’atterrissage et campagne ──')
console.table(parFiche)

/* ── Lot choisi et valeur cliquée, par fiche ── */
const parLot = await q(
  `select
     case when e.meta->'product'->>'slug' = $2 then 'A'
          when e.meta->'product'->>'slug' = $3 then 'B' end as fiche,
     regexp_replace(e.meta->'product'->>'name', '.*— ', '')  as lot,
     count(*)                                                as clics,
     round(sum((e.meta->'product'->>'value')::numeric))       as valeur_cliquee
   from analytics_events e
   join analytics_sessions s on s.id = e.session_id
   where e.type = 'click' and e.label ilike 'commander%'
     and e.occurred_at > now() - ($1 || ' days')::interval
     and s.country = any($4)
     and e.meta->'product'->>'slug' in ($2, $3)
   group by 1, 2 order by 1, 3 desc`,
  [String(JOURS), FICHES.A.slug, FICHES.B.slug, ZONE]
)
console.log('\n── Lot choisi et valeur cliquée ──')
console.table(parLot)

/* ── Résumé : panier moyen cliqué, le chiffre qui compte avant les ventes ── */
console.log('\n── Résumé ──')
for (const [cle, { label }] of Object.entries(FICHES)) {
  const v = parFiche.filter((r) => r.fiche === cle).reduce((n, r) => n + Number(r.visites), 0)
  const c = parFiche.filter((r) => r.fiche === cle).reduce((n, r) => n + Number(r.clics_commander), 0)
  const val = parLot.filter((r) => r.fiche === cle).reduce((n, r) => n + Number(r.valeur_cliquee || 0), 0)
  const clics = parLot.filter((r) => r.fiche === cle).reduce((n, r) => n + Number(r.clics), 0)
  console.log(
    `${label.padEnd(22)} ${String(v).padStart(5)} visites · ${String(c).padStart(4)} clics ` +
    `(${v ? ((c / v) * 100).toFixed(1) : '—'} %) · panier cliqué moyen ${clics ? (val / clics).toFixed(2) : '—'} €`
  )
}
console.log('\nRappel : décider sur les commandes PAYÉES par variante, pas sur ces clics.\n')

await client.end()
