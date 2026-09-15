/**
 * Export de toutes les données du tableau de bord vers un dossier local.
 *
 *   node scripts/export-donnees.mjs            -> 90 derniers jours
 *   node scripts/export-donnees.mjs 365        -> une année
 *
 * Produit un dossier horodaté dans Téléchargements, contenant :
 *   - un récapitulatif lisible (.txt)
 *   - un fichier .csv par jeu de données, ouvrable dans Excel
 *
 * Les CSV sont écrits au format français : séparateur point-virgule et
 * marque d'encodage UTF-8 en tête. Sans ces deux détails, Excel colle
 * toutes les colonnes dans une seule et casse les accents.
 */

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import pg from 'pg'

const JOURS = Number(process.argv[2]) || 90
const REF = 'gokiqefjfbiusaoyimxe'

/* ── Lecture de .env.local, sans dépendance externe ── */
function chargerEnv() {
  const fichier = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(fichier)) return
  for (const ligne of fs.readFileSync(fichier, 'utf8').split('\n')) {
    const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m) continue
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    if (!process.env[m[1]]) process.env[m[1]] = v
  }
}

/* ── Écriture CSV ── */
function cellule(v) {
  if (v === null || v === undefined) return ''
  if (v instanceof Date) return v.toLocaleString('fr-FR')
  let s = typeof v === 'object' ? JSON.stringify(v) : String(v)
  s = s.replace(/\r?\n/g, ' ⏎ ')
  /* Un point-virgule ou un guillemet dans une cellule casserait le tableau
     s'il n'était pas protégé. */
  if (s.includes(';') || s.includes('"')) s = '"' + s.replace(/"/g, '""') + '"'
  return s
}

function ecrireCsv(dossier, nom, lignes, entetes) {
  const cols = entetes ?? (lignes[0] ? Object.keys(lignes[0]) : [])
  const contenu =
    '﻿' +
    [cols.join(';'), ...lignes.map((l) => cols.map((c) => cellule(l[c])).join(';'))].join('\r\n')
  const chemin = path.join(dossier, nom)
  fs.writeFileSync(chemin, contenu, 'utf8')
  console.log(`  ${nom.padEnd(34)} ${String(lignes.length).padStart(5)} ligne(s)`)
  return lignes.length
}

function duree(ms) {
  const s = Math.round((ms ?? 0) / 1000)
  if (s < 60) return `${s} s`
  const m = Math.floor(s / 60)
  return `${m} min ${String(s % 60).padStart(2, '0')} s`
}

/* ── Programme ── */
chargerEnv()

const motDePasse = process.env.SUPABASE_DB_PASSWORD
if (!motDePasse) {
  console.error('SUPABASE_DB_PASSWORD absent de .env.local — export impossible.')
  process.exit(1)
}

const client = new pg.Client({
  connectionString: `postgresql://postgres.${REF}:${encodeURIComponent(motDePasse)}@aws-1-eu-west-3.pooler.supabase.com:5432/postgres`,
  ssl: { rejectUnauthorized: false },
})
await client.connect()

const maintenant = new Date()
const horodatage = maintenant.toISOString().slice(0, 16).replace('T', '_').replace(':', 'h')
const telechargements = path.join(os.homedir(), 'Downloads')
const dossier = path.join(telechargements, `bois-tresor-donnees_${horodatage}`)
fs.mkdirSync(dossier, { recursive: true })

console.log(`\nExport des ${JOURS} derniers jours\n`)

const depuis = `now() - interval '${JOURS} days'`

/* 1. Visites, une ligne par visiteur */
const visites = (
  await client.query(`
    select
      s.started_at                                   as "Date et heure",
      coalesce(s.country, '?')                       as "Pays",
      coalesce(s.device, 'inconnu')                  as "Appareil",
      coalesce(s.utm_source, case when s.referrer is null then 'direct'
        else split_part(replace(replace(s.referrer,'https://',''),'http://',''), '/', 1) end) as "Provenance",
      s.utm_campaign                                 as "Campagne",
      s.entry_path                                   as "Page d'arrivee",
      s.exit_path                                    as "Page de sortie",
      s.pageviews                                    as "Pages vues",
      round(s.duration_ms / 1000.0)::int             as "Temps passe (s)",
      case when s.saw_collection then 'oui' else 'non' end as "A vu une collection",
      case when s.saw_product    then 'oui' else 'non' end as "A ouvert une fiche",
      case when s.clicked_buy    then 'oui' else 'non' end as "A mis au panier",
      s.id                                           as "Identifiant visite"
    from analytics_sessions s
    where s.started_at >= ${depuis}
    order by s.started_at desc`)
).rows
ecrireCsv(dossier, '1-visites.csv', visites)

/* 2. Parcours détaillé, une ligne par action */
const parcours = (
  await client.query(`
    select
      e.occurred_at                        as "Date et heure",
      e.session_id                         as "Identifiant visite",
      coalesce(s.country, '?')             as "Pays",
      coalesce(s.device, 'inconnu')        as "Appareil",
      case e.type
        when 'pageview'   then 'arrive sur'
        when 'page_exit'  then 'quitte'
        when 'click'      then 'clique sur'
        when 'form_field' then 'champ de formulaire'
      end                                  as "Action",
      e.path                               as "Page",
      e.label                              as "Element",
      round(e.duration_ms / 1000.0)::int   as "Temps sur la page (s)",
      e.scroll_pct                         as "Scroll atteint (%)",
      e.meta->'product'->>'name'           as "Produit",
      e.meta->'product'->>'quantity'       as "Quantite",
      e.meta->'product'->>'value'          as "Montant (EUR)",
      e.meta->>'filled'                    as "Champ rempli"
    from analytics_events e
    join analytics_sessions s on s.id = e.session_id
    where e.occurred_at >= ${depuis}
    order by e.session_id, e.occurred_at, e.id`)
).rows
ecrireCsv(dossier, '2-parcours-detaille.csv', parcours)

/* 3. Performance par produit */
const produits = (await client.query(`select * from analytics_product_performance($1)`, [JOURS])).rows
ecrireCsv(
  dossier,
  '3-produits.csv',
  produits.map((p) => ({
    Produit: p.name,
    'Fiches vues': p.vues,
    'Mises au panier': p.achats,
    'Dont depuis la fiche': p.achats_fiche,
    'Dont depuis une carte': p.achats_carte,
    'Taux depuis la fiche (%)': p.vues > 0 ? p.taux : '',
    'Montant total (EUR)': p.valeur_totale,
    'Scroll moyen (%)': p.scroll_moyen,
    Identifiant: p.slug,
  }))
)

/* 4. Entonnoir par appareil */
const appareils = (await client.query(`select * from analytics_funnel_by_device($1)`, [JOURS])).rows
ecrireCsv(
  dossier,
  '4-appareils.csv',
  appareils.map((d) => ({
    Appareil: d.device,
    Visites: d.visites,
    'A vu une collection': d.saw_collection,
    'A ouvert une fiche': d.saw_product,
    'A mis au panier': d.clicked_buy,
    'Taux (%)': d.visites ? Math.round((d.clicked_buy * 1000) / d.visites) / 10 : 0,
    'Temps moyen (s)': d.duree_moyenne_s,
    'Pages par visite': d.pages_par_visite,
  }))
)

/* 5. Pages */
const apercu = (await client.query(`select analytics_overview($1) as d`, [JOURS])).rows[0].d
ecrireCsv(
  dossier,
  '5-pages.csv',
  apercu.pages.map((p) => ({
    Page: p.path,
    Vues: p.vues,
    'Temps moyen (s)': p.duree_moyenne_s,
    'Scroll moyen (%)': p.scroll_moyen,
    Sorties: p.sorties,
    'Taux de sortie (%)': p.vues ? Math.round((p.sorties * 100) / p.vues) : 0,
  }))
)

/* 6. Clics */
ecrireCsv(
  dossier,
  '6-clics.csv',
  apercu.clics.map((c) => ({ Element: c.label, Page: c.path, Clics: c.total }))
)

/* 7. Demandes de contact */
const messages = (
  await client.query(`
    select
      created_at                                  as "Recu le",
      name                                        as "Nom",
      email                                       as "E-mail",
      coalesce(subject, '')                       as "Sujet",
      message                                     as "Message",
      case when handled then 'oui' else 'non' end as "Traite",
      handled_at                                  as "Traite le"
    from contact_messages
    where created_at >= ${depuis}
    order by created_at desc`)
).rows
ecrireCsv(dossier, '7-demandes-contact.csv', messages)

/* ── Récapitulatif lisible ── */
const r = apercu.resume ?? {}
const pct = (n) => (r.visites ? Math.round((n * 100) / r.visites) : 0)

const recap = `BOIS TRESOR — DONNEES DU SITE
Export du ${maintenant.toLocaleString('fr-FR')}
Periode : ${JOURS} derniers jours

Chiffres limites a la France, la Belgique, la Suisse, le Luxembourg et
Monaco. Les robots sont exclus des la collecte.

VUE D'ENSEMBLE
  Visites                      ${r.visites ?? 0}
  Temps moyen par visite       ${duree((r.duree_moyenne_s ?? 0) * 1000)}
  Pages par visite             ${r.pages_par_visite ?? 0}
  Visites d'une seule page     ${r.visites_une_page ?? 0} (${pct(r.visites_une_page ?? 0)} %)
  Visites hors zone ecartees   ${r.hors_zone ?? 0}

ENTONNOIR
  Visites                      ${r.visites ?? 0}
  A vu une collection          ${r.etape_collection ?? 0} (${pct(r.etape_collection ?? 0)} %)
  A ouvert une fiche produit   ${r.etape_produit ?? 0} (${pct(r.etape_produit ?? 0)} %)
  A mis au panier              ${r.etape_achat ?? 0} (${pct(r.etape_achat ?? 0)} %)

  L'entonnoir s'arrete au depart vers le paiement : la suite se deroule
  sur le checkout externe, hors de portee de ce site.

PAR APPAREIL
${appareils.map((d) => `  ${String(d.device).padEnd(10)} ${String(d.visites).padStart(5)} visites  ->  ${String(d.clicked_buy).padStart(4)} au panier (${d.visites ? Math.round((d.clicked_buy * 100) / d.visites) : 0} %)`).join('\n') || '  (aucune donnee)'}

PAR PAYS
${(apercu.pays ?? []).map((p) => `  ${String(p.code).padEnd(10)} ${String(p.visites).padStart(5)} visites`).join('\n') || '  (aucune donnee)'}

PROVENANCE
${(apercu.sources ?? []).map((s) => `  ${String(s.source).slice(0, 28).padEnd(30)} ${String(s.visites).padStart(5)}`).join('\n') || '  (aucune donnee)'}

PRODUITS LES PLUS DEMANDES
${produits.slice(0, 15).map((p) => `  ${String(p.name).slice(0, 40).padEnd(42)} ${String(p.vues).padStart(4)} vues  ${String(p.achats).padStart(3)} paniers (${String(p.achats_fiche)} via fiche, ${String(p.achats_carte)} via carte)`).join('\n') || '  (aucune donnee)'}

  Le taux de conversion d'une fiche ne se calcule que sur les visiteurs
  qui l'ont ouverte. Les achats faits directement depuis une carte de
  collection sont comptes a part : ils n'ont jamais vu la fiche.

DEMANDES DE CONTACT
  Total                        ${messages.length}
  Non traitees                 ${messages.filter((m) => m.Traite === 'non').length}

FICHIERS DE CE DOSSIER
  1-visites.csv            une ligne par visiteur, avec son temps passe
  2-parcours-detaille.csv  chaque action, page par page
  3-produits.csv           vues et mises au panier par produit
  4-appareils.csv          entonnoir mobile / tablette / ordinateur
  5-pages.csv              temps, scroll et taux de sortie par page
  6-clics.csv              elements les plus cliques
  7-demandes-contact.csv   messages recus via le formulaire

  Les .csv s'ouvrent dans Excel. Ils contiennent des donnees
  personnelles (noms, e-mails) : a ne pas diffuser.
`

fs.writeFileSync(path.join(dossier, '0-RECAPITULATIF.txt'), recap, 'utf8')
console.log(`  0-RECAPITULATIF.txt`)

await client.end()
console.log(`\nDossier cree :\n  ${dossier}\n`)
