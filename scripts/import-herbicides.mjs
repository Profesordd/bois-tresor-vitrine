/**
 * Import des désherbants depuis l'export WooCommerce de naturejardin-fr.com.
 *
 *   node scripts/import-herbicides.mjs <fichier.csv>
 *
 * Produit `lib/herbicides.json` (repris par lib/products.ts) et télécharge la
 * photo principale de chaque fiche dans public/products/herbicides/.
 *
 * Source de vérité : le CSV (nom, prix, prix barré, description, image).
 * L'ordre de popularité (champ `popularite`) a été relevé séparément sur
 * ?orderby=popularity et appliqué au JSON : relancer cet import remet les
 * produits dans l'ordre du CSV — trier ensuite sur `popularite`.
 * La page produit du site n'est consultée que pour vérifier que la fiche
 * existe encore et récupérer son slug d'origine.
 */
import fs from 'node:fs'
import path from 'node:path'

const [, , csvPath] = process.argv
if (!csvPath) { console.error('Usage : node scripts/import-herbicides.mjs <export.csv>'); process.exit(1) }

const ROOT = path.resolve(import.meta.dirname, '..')
const IMG_DIR = path.join(ROOT, 'public', 'products', 'herbicides')
const OUT = path.join(ROOT, 'lib', 'herbicides.json')
fs.mkdirSync(IMG_DIR, { recursive: true })

/* ── CSV (RFC 4180, guillemets doublés, retours à la ligne dans les champs) ── */
function parseCsv(text) {
  const rows = []; let row = []; let cell = ''; let inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++ } else inQ = false }
      else cell += c
    } else if (c === '"') inQ = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = '' }
    else if (c !== '\r') cell += c
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row) }
  const [head, ...body] = rows
  return body.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])))
}

/* ── Nettoyage de la description : balises cassées de l'export, faux
      compteur d'avis, émojis. Le fond du texte est conservé tel quel. ── */
function nettoyer(html) {
  return html
    .replace(/\\n/g, '\n')
    .replace(/<ul><\/p>/g, '<ul>').replace(/<p><\/ul>/g, '</ul>')
    .replace(/<ol><\/p>/g, '<ol>').replace(/<p><\/ol>/g, '</ol>')
    .replace(/<h6 class="inline-rating">[\s\S]*?<\/h6>/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{1F000}-\u{1F2FF}]/gu, '')
    .replace(/�/g, '')
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function slugifier(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/* ── Contenance et matière active, lues dans le nom et la description ── */
function contenance(nom) {
  const m = nom.match(/(\d+)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*(ml|l)/i)
  if (m) return `${m[1]} × ${m[2].replace('.', ',')} ${m[3].toUpperCase() === 'L' ? 'L' : 'ml'}`
  const u = nom.match(/(\d+(?:[.,]\d+)?)\s*(ml|l)\b/i)
  if (u) return `${u[1].replace('.', ',')} ${u[2].toUpperCase() === 'L' ? 'L' : 'ml'}`
  return null
}
function matiereActive(nom, desc) {
  if (/tidex/i.test(nom)) return 'Fluroxypyr 20 % (EW)'
  if (/dynamic/i.test(nom)) return 'Glyphosate 500 g/L'
  if (/powerflex|flex 480/i.test(nom)) return 'Glyphosate 480 g/L'
  if (/360\s*g/i.test(desc) || /36\s*%/i.test(desc) || /glyphosate/i.test(nom + desc)) return 'Glyphosate 360 g/L'
  return null
}

const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'))
console.log(`${rows.length} lignes dans le CSV`)

const produits = []
for (const r of rows) {
  const nom = r['Nom'].replace(/\s+/g, ' ').trim()
  const regulier = Number(r['Tarif régulier']) || 0
  const promo = Number(r['Tarif promo']) || 0
  const price = promo > 0 ? promo : regulier
  const original = promo > 0 && regulier > promo ? regulier : null
  const description = nettoyer(r['Description'])
  const slug = slugifier(nom)
  const imageUrl = (r['Images'] || '').split(',')[0].trim()

  /* Photo principale : téléchargée une fois, servie depuis le site. */
  let image = '/placeholder.svg'
  if (imageUrl) {
    const ext = path.extname(new URL(imageUrl).pathname) || '.webp'
    const fichier = `${slug}${ext}`
    const dest = path.join(IMG_DIR, fichier)
    if (!fs.existsSync(dest)) {
      const res = await fetch(imageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      if (res.ok) fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
      else console.warn(`  ! image ${res.status} : ${imageUrl}`)
    }
    if (fs.existsSync(dest)) image = `/products/herbicides/${fichier}`
  }

  produits.push({
    slug, name: nom, price, original_price: original,
    contenance: contenance(nom), matiere_active: matiereActive(nom, description),
    selectif: /tidex|s[ée]lectif/i.test(nom),
    image, description,
    source: `https://naturejardin-fr.com/produit/${slug}-2/`,
  })
  console.log(`  ✓ ${nom} — ${price} €${original ? ` (barré ${original} €)` : ''} — ${image === '/placeholder.svg' ? 'SANS PHOTO' : 'photo ok'}`)
}

fs.writeFileSync(OUT, JSON.stringify(produits, null, 2) + '\n')
console.log(`\n${produits.length} produits écrits dans lib/herbicides.json`)
