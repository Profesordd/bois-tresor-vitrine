/**
 * Vérifie que chaque prix du catalogue tombe sur la grille du processeur.
 *
 *   node scripts/verifier-grille.mjs
 *
 * Le processeur de paiement n'accepte que huit prix unitaires. Un prix de
 * vente n'est encaissable que s'il vaut exactement l'un d'eux multiplié par
 * un entier — c'est le rôle de `checkoutMultiplier` sur chaque produit.
 *
 * Tout est compté EN CENTIMES, en entiers. Diviser des flottants donne de
 * faux positifs : 119,97 / 29,99 vaut 4,0003, qui s'arrondit à 4, alors que
 * 29,99 × 4 fait 119,96. Ce contrôle-là avait déjà validé un prix faux.
 *
 * Le script lit `lib/products.ts` au lieu de l'importer : le fichier est en
 * TypeScript et utilise les alias `@/`, que Node ne résout pas seul.
 */
import fs from 'node:fs'
import path from 'node:path'

const GRILLE = [999, 1499, 1999, 2499, 2999, 3499, 3999, 4499]
const SOURCE = path.join(path.resolve(import.meta.dirname, '..'), 'lib', 'products.ts')

/** Le prix est-il encaissable ? Renvoie { unitaire, multiplicateur } ou null. */
function surLaGrille(centimes) {
  for (const unitaire of GRILLE) {
    if (centimes % unitaire === 0) return { unitaire, multiplicateur: centimes / unitaire }
  }
  return null
}

/** Les prix encaissables les plus proches, pour proposer une correction. */
function voisins(centimes, ecart = 500) {
  const out = new Set()
  for (const u of GRILLE) {
    for (let m = 1; u * m <= centimes + ecart; m++) {
      if (Math.abs(u * m - centimes) <= ecart) out.add(u * m)
    }
  }
  return [...out].sort((a, b) => Math.abs(a - centimes) - Math.abs(b - centimes)).slice(0, 4)
}

const source = fs.readFileSync(SOURCE, 'utf8')
const lignes = source.split('\n')

/* `price:` seulement — ni `originalPrice`, qui n'est jamais encaissé, ni
   `pricePerStere`, qui n'est qu'un repère affiché. */
const prix = []
lignes.forEach((ligne, i) => {
  const m = ligne.match(/(?<![A-Za-z])price:\s*([\d.]+)\s*,/)
  if (!m) return
  const centimes = Math.round(Number(m[1]) * 100)
  /* Le nom du produit ou du lot, cherché au-dessus : c'est ce qui rend le
     rapport lisible quand un prix cloche. */
  let etiquette = `ligne ${i + 1}`
  for (let j = i; j > Math.max(0, i - 8); j--) {
    const n = lignes[j].match(/(?:slug|id):\s*'([^']+)'/)
    if (n) { etiquette = n[1]; break }
  }
  prix.push({ etiquette, centimes, ligne: i + 1 })
})

const euros = (c) => (c / 100).toFixed(2).replace('.', ',') + ' €'
let horsGrille = 0

console.log(`\nGrille du processeur : ${GRILLE.map(euros).join(' · ')}\n`)
for (const p of prix) {
  const ok = surLaGrille(p.centimes)
  if (ok) {
    console.log(`  ✓ ${euros(p.centimes).padStart(10)}  ${euros(ok.unitaire)} × ${ok.multiplicateur}`.padEnd(46) + p.etiquette)
  } else {
    horsGrille++
    console.log(`  ✗ ${euros(p.centimes).padStart(10)}  HORS GRILLE`.padEnd(46) + `${p.etiquette} (ligne ${p.ligne})`)
    console.log(`      → au plus près : ${voisins(p.centimes).map(euros).join(', ')}`)
  }
}

console.log(`\n${prix.length} prix contrôlés, ${horsGrille} hors grille.\n`)
process.exit(horsGrille === 0 ? 0 : 1)
