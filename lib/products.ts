import type { Product, Category, Spec } from '@/types/database'

/**
 * Catalogue Bois Tresor — repris du site en production du client
 * (bois-tresor.com) : mêmes intitulés produits, mêmes prix, mêmes
 * caractéristiques techniques que celles publiées sur le site réel.
 *
 * Les photos produit sont les vraies photos du site (héro + bûches +
 * palettes de granulés) ; faute d'une photo unique par référence sur le
 * site source lui-même, les mêmes visuels sont réutilisés sur plusieurs
 * fiches granulés, comme sur le site d'origine.
 */

export const CATEGORIES: Category[] = [
  { id: 'cat-buches',    slug: 'bois-de-chauffage',    name: 'Bois de chauffage',   family: 'bois-de-chauffage', created_at: '' },
  { id: 'cat-granules',  slug: 'granules-et-pellets',  name: 'Granulés & pellets',  family: 'granules',          created_at: '' },
]

function cat(id: string): Category {
  return CATEGORIES.find(c => c.id === id)!
}

let _n = 0
function nextId() { _n += 1; return `be-${String(_n).padStart(3, '0')}` }

const WOOD_IMAGE = '/products/buche-feuillus.jpg'
const PELLET_IMAGES = ['/products/granules-1.jpg', '/products/granules-2.jpeg', '/products/granules-3.webp', '/products/granules-4.jpeg']

/* ─────────────────────────────────────────────
   BOIS DE CHAUFFAGE — Mélange de bois durs
   (chêne, charme, hêtre, frêne)
   ───────────────────────────────────────────── */
interface MelangeInput { length: string; stere: string; slug: string; price: number; badge?: string | null }

function buildMelange({ length, stere, slug, price, badge = null }: MelangeInput): Product {
  const name = `Mélange de bois durs – ${length} – Palette de ${stere} stères`
  const specs: Spec[] = [
    { label: 'Bûche',           value: 'Fendue et en grande partie écorcée' },
    { label: 'Origine',         value: '100 % bois français' },
    { label: 'Type de bois',    value: '100 % feuillus durs : chêne – charme – hêtre – frêne' },
    { label: 'Longueur',        value: `${length} (±5 %)` },
    { label: 'Stères',          value: stere },
    { label: 'Taux d’humidité', value: '≤ 20 %' },
    { label: 'PCI sur brut',    value: '≥ 3,9 kWh.kg⁻¹' },
    { label: 'Taux de cendre',  value: '≤ 1,5 %' },
    { label: 'Utilisation',     value: 'Immédiate' },
  ]
  return {
    id: nextId(),
    slug,
    name,
    tagline: 'Chêne, charme, hêtre et frêne — séché à cœur',
    keyPoints: [
      'Bois sec, prêt à brûler : moins de 20 % d’humidité. Il ne fume pas.',
      '100 % feuillus durs français : chêne, charme, hêtre et frêne.',
      `Bûches de ${length}, fendues et en grande partie écorcées.`,
      `Palette de ${stere} stères, livrée filmée.`,
      'Livraison offerte pour votre 1ère commande, partout en France métropolitaine.',
      'Paiement sécurisé en ligne. E-mail de confirmation avec votre numéro de commande.',
    ],
    description: `<p>Composé des meilleures essences de feuillus durs : chêne, charme, frêne et hêtre. Nous garantissons un rendement maximal de votre poêle à bois.</p><ul><li>Bûches fendues et en grande partie écorcées, longueur ${length} (±5 %)</li><li>100 % bois français, taux d’humidité ≤ 20 %</li><li>Palette de ${stere} stères, livraison soignée</li><li>Utilisation immédiate dès réception</li></ul>`,
    price,
    original_price: null,
    stock: 20,
    family: 'bois-de-chauffage',
    subtype: 'buche',
    image: WOOD_IMAGE,
    specs,
    category_id: cat('cat-buches').id,
    category: cat('cat-buches'),
    badge,
    rating: null,
    review_count: 0,
    created_at: '',
  }
}

const MELANGES: Product[] = [
  buildMelange({ length: '45cm', stere: '2,6', slug: 'melange-de-bois-durs-45cm-palette-de-26-steres', price: 89,  badge: 'bestseller' }),
  buildMelange({ length: '50cm', stere: '2,5', slug: 'melange-de-bois-durs-50cm-palette-de-25-steres', price: 99 }),
  buildMelange({ length: '40cm', stere: '2,7', slug: 'melange-de-bois-durs-40cm-palette-de-27-steres', price: 105 }),
  buildMelange({ length: '1m',   stere: '2',   slug: 'melange-de-bois-durs-1m-palette-de-2-steres',    price: 109 }),
  buildMelange({ length: '33cm', stere: '2,9', slug: 'melange-de-bois-durs-33cm-palette-de-29-steres', price: 115 }),
  buildMelange({ length: '25cm', stere: '3,3', slug: 'melange-de-bois-durs-25cm-palette-de-33-steres', price: 120 }),
  buildMelange({ length: '30cm', stere: '3',   slug: 'melange-de-bois-durs-30cm-palette-de-3-steres',  price: 129 }),
]

/* ─────────────────────────────────────────────
   BOIS DE CHAUFFAGE — 100 % Hêtre
   ───────────────────────────────────────────── */
interface HetreInput { stere: string; volumeNote: string; poids: string; slug: string; price: number }

function buildHetre({ stere, volumeNote, poids, slug, price }: HetreInput): Product {
  const name = `Bois de chauffage 30cm – Palette ${stere} stère${stere === '1,7' ? '' : 's'} – 100% Hêtre`
  const specs: Spec[] = [
    { label: 'Essence',            value: '100 % hêtre' },
    { label: 'Longueur des bûches', value: '30 cm' },
    { label: 'Volume',             value: volumeNote },
    { label: 'Poids approximatif', value: poids },
    { label: 'Séchage',            value: 'au four (prêt à l’emploi)' },
    { label: 'Taux d’humidité',    value: '≤ 18 %' },
    { label: 'Conditionnement',    value: 'palette jetable filmée' },
    { label: 'Origine',            value: 'forêts gérées durablement' },
  ]
  return {
    id: nextId(),
    slug,
    name,
    tagline: '100 % hêtre, séché au four, prêt à brûler',
    keyPoints: [
      'Bois sec, prêt à brûler : moins de 18 % d’humidité. Il ne fume pas.',
      '100 % hêtre, issu de forêts gérées durablement.',
      'Bûches de 30 cm, séchées au four.',
      `Palette de ${volumeNote}, ${poids} environ, livrée filmée.`,
      'Livraison offerte pour votre 1ère commande, partout en France métropolitaine.',
      'Paiement sécurisé en ligne. E-mail de confirmation avec votre numéro de commande.',
    ],
    description: `<p>Bois de chauffage 100 % hêtre en bûches de 30 cm, séché au four et prêt à brûler immédiatement. Palette de ${volumeNote} livrée filmée.</p>`,
    price,
    original_price: null,
    stock: 15,
    family: 'bois-de-chauffage',
    subtype: 'buche',
    image: WOOD_IMAGE,
    specs,
    category_id: cat('cat-buches').id,
    category: cat('cat-buches'),
    badge: null,
    rating: null,
    review_count: 0,
    created_at: '',
  }
}

const HETRES: Product[] = [
  buildHetre({ stere: '1,7', volumeNote: '1,7 stère (1 RM)', poids: '600 kg',  slug: 'bois-de-chauffage-30cm-palette-17-stere-100-hetre', price: 149 }),
  buildHetre({ stere: '3',   volumeNote: '3 stères (env. 3 SRM)', poids: '800 kg', slug: 'bois-de-chauffage-30cm-palette-3-steres-100-hetre', price: 189 }),
]

/* ─────────────────────────────────────────────
   GRANULÉS & PELLETS
   ───────────────────────────────────────────── */
interface GranuleInput {
  name: string
  slug: string
  price: number
  bags: number
  bagKg?: number
  cert?: string | null
  comp?: string | null
}

function buildGranule({ name, slug, price, bags, bagKg = 15, cert = null, comp = null }: GranuleInput, index: number): Product {
  const totalWeight = bags * bagKg
  const specs: Spec[] = [
    { label: 'Conditionnement', value: `${bags} sacs de ${bagKg} kg` },
    { label: 'Poids palette',   value: `${totalWeight} kg` },
  ]
  if (comp) specs.push({ label: 'Composition', value: comp })
  if (cert) specs.push({ label: 'Certification', value: cert })

  const bits: string[] = []
  bits.push(`Palette de ${bags} sacs de ${bagKg} kg (${totalWeight} kg au total)`)
  if (comp) bits.push(comp.toLowerCase())
  if (cert) bits.push(`certifié ${cert}`)

  const keyPoints = [
    'Granulés secs, prêts à l’emploi dans votre poêle ou votre chaudière.',
    comp ? `Composition : ${comp}.` : null,
    cert ? `Certification ${cert}.` : null,
    `${bags} sacs de ${bagKg} kg, soit ${totalWeight} kg. Palette filmée.`,
    'Livraison offerte pour votre 1ère commande, partout en France métropolitaine.',
    'Paiement sécurisé en ligne. E-mail de confirmation avec votre numéro de commande.',
  ].filter((p): p is string => p !== null)

  return {
    id: nextId(),
    slug,
    name,
    tagline: cert ?? (comp ?? `Palette de ${totalWeight} kg`),
    keyPoints,
    description: `<p>${name}. ${bits.join(', ')}. Livraison soignée, palette filmée, expédition sous 48 h.</p>`,
    price,
    original_price: null,
    stock: 25,
    family: 'granules',
    subtype: 'granule',
    image: PELLET_IMAGES[index % PELLET_IMAGES.length],
    specs,
    category_id: cat('cat-granules').id,
    category: cat('cat-granules'),
    badge: null,
    rating: null,
    review_count: 0,
    created_at: '',
  }
}

const GRANULE_DEFS: GranuleInput[] = [
  { name: 'Granulés bois BADGER — 1/2 Palette de 36 sacs de 15 kg',                       slug: 'granules-bois-badger-demi-palette-36-sacs',            price: 200.00, bags: 36 },
  { name: 'Pellet Moulin Bois Energie — 65 sacs de 15 kg',                                 slug: 'pellet-moulin-bois-energie-65-sacs',                   price: 204.00, bags: 65 },
  { name: 'Pellet HELIOS — Palette de 65 sacs de 15 kg — 100% résineux',                   slug: 'pellet-helios-palette-65-sacs-resineux',               price: 205.00, bags: 65, comp: '100 % résineux' },
  { name: 'Pellets Green Energy DINplus — 65 Sacs de 15 KG',                               slug: 'pellets-green-energy-dinplus-65-sacs',                 price: 205.00, bags: 65, cert: 'DINplus' },
  { name: 'Granulés Holz Westerwalder — 1/2 Palette 36 sacs de 15 kg',                      slug: 'granules-holz-westerwalder-demi-palette-36-sacs',      price: 208.00, bags: 36 },
  { name: 'Granulés Forest Pellets — 1/2 Palette de 36 sacs de 15 kg',                      slug: 'granules-forest-pellets-demi-palette-36-sacs',         price: 210.00, bags: 36 },
  { name: 'Pellet Starforest 100% résineux — 70 sacs de 15 kg',                             slug: 'pellet-starforest-100-resineux-70-sacs',               price: 210.99, bags: 70, comp: '100 % résineux' },
  { name: 'Granulés de bois Limouzi — 66 sacs de 15 Kg',                                    slug: 'granules-bois-limouzi-66-sacs',                        price: 230.00, bags: 66 },
  { name: 'Pellets Pellini EN+ A1 — Palette de 66 sacs de 10 kg',                           slug: 'pellets-pellini-enplus-a1-66-sacs-10kg',               price: 244.40, bags: 66, bagKg: 10, cert: 'EN+ A1' },
  { name: 'Granulés de bois Dragon EN+ A1 — 65 sacs x 15kg',                                slug: 'granules-bois-dragon-enplus-a1-65-sacs',               price: 255.00, bags: 65, cert: 'EN+ A1' },
  { name: 'Pellet Badger — Palette de 65 sacs de 15 kg',                                    slug: 'pellet-badger-palette-65-sacs',                        price: 255.00, bags: 65 },
  { name: 'Pellets HS Timber — Palette de 66 sacs de 15 kg — 100% résineux',                slug: 'pellets-hs-timber-palette-66-sacs-resineux',           price: 256.74, bags: 66, comp: '100 % résineux' },
  { name: 'Pellet Excellent Pellets — Palette de 65 sacs de 15 kg',                         slug: 'pellet-excellent-pellets-palette-65-sacs',             price: 265.00, bags: 65 },
  { name: 'Pellet Confort — Palette de 70 sacs de 15 kg — 100% résineux',                   slug: 'pellet-confort-palette-70-sacs-resineux',              price: 275.00, bags: 70, comp: '100 % résineux' },
  { name: 'Pellet Van Roje — Palette de 65 sacs de 15 kg',                                  slug: 'pellet-van-roje-palette-65-sacs',                      price: 276.00, bags: 65 },
  { name: 'Granulés de bois Naturkraft — Palette de 66 sacs',                               slug: 'granules-bois-naturkraft-palette-66-sacs',             price: 285.00, bags: 66 },
  { name: 'Pellet Total Premium — Palette de 66 sacs de 15 kg',                             slug: 'pellet-total-premium-palette-66-sacs',                 price: 285.00, bags: 66 },
  { name: 'Granulés de bois Forest Pellets — Palette de 65 sacs de 15 kg',                  slug: 'granules-bois-forest-pellets-palette-65-sacs',         price: 288.00, bags: 65 },
  { name: 'Granulés de bois Holz Westerwalder — Palette 66 sacs de 15 kg',                  slug: 'granules-bois-holz-westerwalder-palette-66-sacs',      price: 290.00, bags: 66 },
  { name: 'Pellet ANVIL — Palette de 70 sacs de 15Kg — EN Plus A1',                         slug: 'pellet-anvil-palette-70-sacs-enplus-a1',               price: 300.00, bags: 70, cert: 'EN Plus A1' },
  { name: 'Granulés OLIMP Din+, EN+A1 — Palette de 15 sacs de 15kg',                        slug: 'granules-olimp-dinplus-enplus-a1-15-sacs',             price: 300.00, bags: 15, cert: 'Din+ / EN+ A1' },
  { name: 'Granulés GOLD 100% résineux — Palette de 65 sacs de 15 kg',                      slug: 'granules-gold-100-resineux-palette-65-sacs',           price: 302.00, bags: 65, comp: '100 % résineux' },
  { name: 'Granulés de bois BADGER — Palette de 65 sacs de 15 kg',                          slug: 'granules-bois-badger-palette-65-sacs',                 price: 302.00, bags: 65 },
  { name: 'Pellet LAVA 100% résineux — Palette de 65 sacs de 15 kg',                        slug: 'pellet-lava-100-resineux-palette-65-sacs',             price: 305.00, bags: 65, comp: '100 % résineux' },
  { name: 'Pellets Pellini EN+ A1 — Palette de 66 sacs de 15 kg',                           slug: 'pellets-pellini-enplus-a1-66-sacs-15kg',               price: 309.00, bags: 66, cert: 'EN+ A1' },
  { name: 'Pellet MAGIC POLAR — Palette de 70 sacs de 15kg — EN Plus A1',                   slug: 'pellet-magic-polar-palette-70-sacs-enplus-a1',         price: 310.00, bags: 70, cert: 'EN Plus A1' },
  { name: 'Pellet Rochefort — Palette de 65 sacs de 15kg — 100% résineux',                  slug: 'pellet-rochefort-palette-65-sacs-resineux',            price: 310.00, bags: 65, comp: '100 % résineux' },
  { name: 'Granulés de bois Crépito — Palette 72 sacs de 15 kg',                            slug: 'granules-bois-crepito-palette-72-sacs',                price: 310.00, bags: 72 },
  { name: 'Pellets Arapellet (En+ A1, Din+) — Palette de 77 sacs de 15 Kg',                 slug: 'pellets-arapellet-enplus-a1-dinplus-77-sacs',          price: 315.00, bags: 77, cert: 'EN+ A1 / Din+' },
  { name: 'Granulés German Flames 6mm EN+ A1 — Palette 990kg',                              slug: 'granules-german-flames-6mm-enplus-a1-990kg',           price: 315.00, bags: 66, cert: 'EN+ A1' },
  { name: 'Pellet Valboval — Palette de 65 sacs de 15 kg',                                  slug: 'pellet-valboval-palette-65-sacs',                      price: 316.00, bags: 65 },
  { name: 'Pellet Le petit scieur français — 65 sacs de 15 kg — 100% résineux',             slug: 'pellet-petit-scieur-francais-65-sacs-resineux',        price: 325.00, bags: 65, comp: '100 % résineux' },
  { name: 'Pellet SunPower — Palette de 70 sacs de 15 kg',                                  slug: 'pellet-sunpower-palette-70-sacs',                      price: 328.99, bags: 70 },
  { name: 'Granulés de bois Piveteau HP+ — 72 Sacs de 15kg',                                slug: 'granules-bois-piveteau-hp-plus-72-sacs',               price: 340.00, bags: 72 },
  { name: 'Granulés PIKS — Palette de 66 sacs (990kg) certifié Din Plus',                   slug: 'granules-piks-palette-66-sacs-990kg-dinplus',          price: 352.00, bags: 66, cert: 'Din Plus' },
  { name: 'Pellets Alpes Energie Bois — Palette de 70 sacs de 15 Kg',                       slug: 'pellets-alpes-energie-bois-palette-70-sacs',           price: 355.00, bags: 70 },
  { name: 'Pellet Moulin Bois Energie — Palette de 65 sacs de 15 kg',                       slug: 'pellet-moulin-bois-energie-palette-65-sacs-premium',   price: 355.00, bags: 65 },
  { name: 'Pellets Natural Energie — Palette de 70 sacs de 15 kg',                          slug: 'pellets-natural-energie-palette-70-sacs',              price: 377.00, bags: 70 },
  { name: 'Granulés HEIZFUXX bleu EN+ A1 — Palette 65 sacs x 15kg',                         slug: 'granules-heizfuxx-bleu-enplus-a1-65-sacs',             price: 379.00, bags: 65, cert: 'EN+ A1' },
  { name: 'Granulés de bois Woodstock — 78 sacs de 15 kg',                                  slug: 'granules-bois-woodstock-78-sacs',                      price: 380.00, bags: 78 },
  { name: 'Granulés HEIZFUXX gris EN+ A2 — Palette 65 sacs x 15kg',                         slug: 'granules-heizfuxx-gris-enplus-a2-65-sacs',             price: 387.00, bags: 65, cert: 'EN+ A2' },
  { name: 'Pellet Starforest — Palette de 70 sacs de 15 kg',                                slug: 'pellet-starforest-palette-70-sacs',                    price: 405.00, bags: 70 },
  { name: 'Granulés HEIZFUXX rouge EN+ A1 — Palette 65 sacs x 15kg',                        slug: 'granules-heizfuxx-rouge-enplus-a1-65-sacs',            price: 475.00, bags: 65, cert: 'EN+ A1' },
  { name: 'Pellet Ardenforest 100% résineux — 70 sacs de 15 kg',                            slug: 'pellet-ardenforest-100-resineux-70-sacs',              price: 480.00, bags: 70, comp: '100 % résineux' },
]

const GRANULES: Product[] = GRANULE_DEFS.map((def, i) => buildGranule(def, i))

export const PRODUCTS: Product[] = [...MELANGES, ...HETRES, ...GRANULES]

export const BOIS_CHAUFFAGE_PRODUCTS = PRODUCTS.filter(p => p.family === 'bois-de-chauffage')
export const GRANULES_PRODUCTS       = PRODUCTS.filter(p => p.family === 'granules')

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find(p => p.slug === slug)
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return PRODUCTS.filter(p => p.family === product.family && p.id !== product.id).slice(0, limit)
}
