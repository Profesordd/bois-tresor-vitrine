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
  { id: 'cat-densifie',  slug: 'bois-densifie',        name: 'Bois densifié & bûches compressées', shortName: 'Bois densifié', family: 'bois-densifie', created_at: '' },
  { id: 'cat-granules',  slug: 'granules-et-pellets',  name: 'Granulés & pellets',  shortName: 'Granulés', family: 'granules',          created_at: '' },
]

function cat(id: string): Category {
  return CATEGORIES.find(c => c.id === id)!
}

let _n = 0
function nextId() { _n += 1; return `be-${String(_n).padStart(3, '0')}` }

const WOOD_IMAGE = '/products/buche-feuillus.jpg'

/** « 2,6 » → 89,91 / 2,6. Le stère est écrit à la française dans le catalogue. */
function prixAuStere(price: number, stere: string): number {
  return price / Number(stere.replace(',', '.'))
}

/* ─────────────────────────────────────────────
   BOIS DE CHAUFFAGE — Mélange de bois durs
   (chêne, charme, hêtre, frêne)
   ───────────────────────────────────────────── */
interface MelangeInput {
  length: string
  stere: string
  slug: string
  /** Prix exact du site d'origine, au centime : il doit correspondre au total calculé par le checkout. */
  price: number
  /** Prix barré d'origine (donnée conservée, non affichée pour l'instant). */
  originalPrice: number
  variantId: string
  checkoutMultiplier: number
  badge?: string | null
}

function buildMelange({ length, stere, slug, price, originalPrice, variantId, checkoutMultiplier, badge = null }: MelangeInput): Product {
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
      'Livraison offerte dès 89 € d’achat, en France métropolitaine, en Belgique et en Suisse.',
      'Paiement sécurisé en ligne. E-mail de confirmation avec votre numéro de commande.',
    ],
    description: `<p>Composé des meilleures essences de feuillus durs : chêne, charme, frêne et hêtre. Nous garantissons un rendement maximal de votre poêle à bois.</p><ul><li>Bûches fendues et en grande partie écorcées, longueur ${length} (±5 %)</li><li>100 % bois français, taux d’humidité ≤ 20 %</li><li>Palette de ${stere} stères, livraison soignée</li><li>Utilisation immédiate dès réception</li></ul>`,
    price,
    original_price: originalPrice,
    pricePerStere: prixAuStere(price, stere),
    stock: 20,
    family: 'bois-de-chauffage',
    subtype: 'buche',
    image: WOOD_IMAGE,
    variantId,
    checkoutMultiplier,
    specs,
    category_id: cat('cat-buches').id,
    category: cat('cat-buches'),
    badge,
    rating: null,
    review_count: 0,
    created_at: '',
  }
}

/* Prix au centime près : ils correspondent exactement à
   prix unitaire du processeur × multiplicateur. Les arrondir ferait
   apparaître un écart entre le site et le total du checkout. */
const MELANGES: Product[] = [
  buildMelange({ length: '45cm', stere: '2,6', slug: 'melange-de-bois-durs-45cm-palette-de-26-steres', price: 89.91,  originalPrice: 149, variantId: '58459585479000', checkoutMultiplier: 9,  badge: 'bestseller' }),
  buildMelange({ length: '50cm', stere: '2,5', slug: 'melange-de-bois-durs-50cm-palette-de-25-steres', price: 99.90,  originalPrice: 159, variantId: '58459585511768', checkoutMultiplier: 10 }),
  buildMelange({ length: '40cm', stere: '2,7', slug: 'melange-de-bois-durs-40cm-palette-de-27-steres', price: 104.97, originalPrice: 165, variantId: '58459585544536', checkoutMultiplier: 3 }),
  buildMelange({ length: '1m',   stere: '2',   slug: 'melange-de-bois-durs-1m-palette-de-2-steres',    price: 109.89, originalPrice: 140, variantId: '58459585610072', checkoutMultiplier: 11 }),
  buildMelange({ length: '33cm', stere: '2,9', slug: 'melange-de-bois-durs-33cm-palette-de-29-steres', price: 119.88, originalPrice: 159, variantId: '58459585642840', checkoutMultiplier: 12 }),
  buildMelange({ length: '25cm', stere: '3,3', slug: 'melange-de-bois-durs-25cm-palette-de-33-steres', price: 119.97, originalPrice: 185, variantId: '58459585675608', checkoutMultiplier: 3 }),
  buildMelange({ length: '30cm', stere: '3',   slug: 'melange-de-bois-durs-30cm-palette-de-3-steres',  price: 129.87, originalPrice: 169, variantId: '58459585708376', checkoutMultiplier: 13 }),
]

/* ─────────────────────────────────────────────
   BOIS DE CHAUFFAGE — 100 % Hêtre
   ───────────────────────────────────────────── */
interface HetreInput {
  stere: string
  volumeNote: string
  poids: string
  slug: string
  price: number
  originalPrice: number
  variantId: string
  checkoutMultiplier: number
}

function buildHetre({ stere, volumeNote, poids, slug, price, originalPrice, variantId, checkoutMultiplier }: HetreInput): Product {
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
      'Livraison offerte dès 89 € d’achat, en France métropolitaine, en Belgique et en Suisse.',
      'Paiement sécurisé en ligne. E-mail de confirmation avec votre numéro de commande.',
    ],
    description: `<p>Bois de chauffage 100 % hêtre en bûches de 30 cm, séché au four et prêt à brûler immédiatement. Palette de ${volumeNote} livrée filmée.</p>`,
    price,
    original_price: originalPrice,
    pricePerStere: prixAuStere(price, stere),
    stock: 15,
    family: 'bois-de-chauffage',
    subtype: 'buche',
    image: WOOD_IMAGE,
    variantId,
    checkoutMultiplier,
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
  buildHetre({ stere: '1,7', volumeNote: '1,7 stère (1 RM)', poids: '600 kg',  slug: 'bois-de-chauffage-30cm-palette-17-stere-100-hetre', price: 149.85, originalPrice: 189, variantId: '58459585741144', checkoutMultiplier: 15 }),
  buildHetre({ stere: '3',   volumeNote: '3 stères (env. 3 SRM)', poids: '800 kg', slug: 'bois-de-chauffage-30cm-palette-3-steres-100-hetre', price: 189.81, originalPrice: 249, variantId: '58459585839448', checkoutMultiplier: 19 }),
]


/* ─────────────────────────────────────────────
   BOIS DENSIFIÉ & BÛCHES COMPRESSÉES
   Catalogue réel bois-tresor.com : intitulés, prix et photos du site,
   identifiants de variante et multiplicateurs du checkout.
   ───────────────────────────────────────────── */
interface DensifieInput {
  name: string
  slug: string
  price: number
  image: string
  poids: string
  composition: string
  subtype: 'bois-densifie' | 'buche-compressee'
  variantId: string
  checkoutMultiplier: number
}

function buildDensifie(d: DensifieInput): Product {
  const isDensifie = d.subtype === 'bois-densifie'
  const specs: Spec[] = [
    { label: 'Type',            value: isDensifie ? 'Bois densifié' : 'Bûches compressées' },
    { label: 'Composition',     value: d.composition },
    { label: 'Poids',           value: d.poids },
    { label: 'Taux d’humidité', value: '≤ 10 %' },
    { label: 'Conditionnement', value: 'Palette filmée' },
    { label: 'Utilisation',     value: 'Immédiate — poêle, insert ou cheminée' },
  ]
  return {
    id: nextId(),
    slug: d.slug,
    name: d.name,
    tagline: `${d.composition} — ${d.poids}`,
    keyPoints: [
      'Bois très sec, prêt à brûler : moins de 10 % d’humidité. Il ne fume pas.',
      `Composition : ${d.composition}.`,
      isDensifie
        ? 'Compressé à haute pression, sans liant chimique : plus de chaleur et moins de cendres qu’une bûche classique.'
        : 'Combustion longue durée, idéale pour tenir la nuit.',
      `${d.poids}, livré sur palette filmée.`,
      'Livraison offerte dès 89 € d’achat, en France métropolitaine, en Belgique et en Suisse.',
      'Paiement sécurisé en ligne. E-mail de confirmation avec votre numéro de commande.',
    ],
    description: `<p>${d.name}. ${d.composition}, ${d.poids}, livré sur palette filmée et prêt à brûler.</p>`,
    price: d.price,
    original_price: null,
    pricePerStere: null,
    stock: 20,
    family: 'bois-densifie',
    subtype: d.subtype,
    image: d.image,
    variantId: d.variantId,
    checkoutMultiplier: d.checkoutMultiplier,
    specs,
    category_id: cat('cat-densifie').id,
    category: cat('cat-densifie'),
    badge: null,
    rating: null,
    review_count: 0,
    created_at: '',
  }
}

const DENSIFIES: Product[] = ([
  { name: 'Bois densifié – feuillus – 1/2 palette de 538 kg', slug: 'bois-densifie-feuillus-1-2-palette-de-538-kg', price: 149.95, image: '/products/densifie-538.webp',      poids: '1/2 palette de 538 kg', composition: '100 % feuillus', subtype: 'bois-densifie',    variantId: '58436085645656', checkoutMultiplier: 5 },
  { name: 'Bois densifié – résineux – palette de 960 kg',     slug: 'bois-densifie-resineux-palette-de-960-kg',     price: 199.95, image: '/products/densifie-resineux.webp', poids: 'Palette de 960 kg',     composition: '100 % résineux', subtype: 'bois-densifie',    variantId: '58436085678424', checkoutMultiplier: 5 },
  { name: 'Bois densifié – feuillus – palette 1 tonne',       slug: 'bois-densifie-feuillus-palette-1-tonne',       price: 199.95, image: '/products/densifie-1t.webp',      poids: 'Palette de 1 tonne',    composition: '100 % feuillus', subtype: 'bois-densifie',    variantId: '58436085711192', checkoutMultiplier: 5 },
  { name: 'Bûches compressées 100% feuillus – palette de 1040kg', slug: 'buches-compressees-100-feuillus-palette-de-1040kg', price: 299.90, image: '/products/compressees-1040.webp', poids: 'Palette de 1040 kg', composition: '100 % feuillus', subtype: 'buche-compressee', variantId: '58436085875032', checkoutMultiplier: 10 },
  { name: 'Bûches de bois compressé tecsabuch crépito (palette de 1t)', slug: 'buches-de-bois-compresse-tecsabuch-crepito-palette-de-1t', price: 269.91, image: '/products/tecsabuch.webp', poids: 'Palette de 1 tonne', composition: 'Bûches compressées Tecsabuch Crépito', subtype: 'buche-compressee', variantId: '58436085940568', checkoutMultiplier: 9 },
] as DensifieInput[]).map(buildDensifie)

/* ─────────────────────────────────────────────
   GRANULÉS & PELLETS — catalogue réel bois-tresor.com
   ───────────────────────────────────────────── */
interface GranuleInput {
  name: string
  slug: string
  price: number
  image: string
  bags: number
  bagKg?: number
  cert?: string | null
  comp?: string | null
  variantId: string
  checkoutMultiplier: number
}

function buildGranule(g: GranuleInput): Product {
  const bagKg = g.bagKg ?? 15
  const totalWeight = g.bags * bagKg
  const specs: Spec[] = [
    { label: 'Conditionnement', value: `${g.bags} sacs de ${bagKg} kg` },
    { label: 'Poids palette',   value: `${totalWeight} kg` },
  ]
  if (g.comp) specs.push({ label: 'Composition', value: g.comp })
  if (g.cert) specs.push({ label: 'Certification', value: g.cert })

  const keyPoints = [
    'Granulés secs, prêts à l’emploi dans votre poêle ou votre chaudière.',
    g.comp ? `Composition : ${g.comp}.` : null,
    g.cert ? `Certification ${g.cert}.` : null,
    `${g.bags} sacs de ${bagKg} kg, soit ${totalWeight} kg. Palette filmée.`,
    'Livraison offerte dès 89 € d’achat, en France métropolitaine, en Belgique et en Suisse.',
    'Paiement sécurisé en ligne. E-mail de confirmation avec votre numéro de commande.',
  ].filter((p): p is string => p !== null)

  return {
    id: nextId(),
    slug: g.slug,
    name: g.name,
    tagline: g.cert ?? g.comp ?? `Palette de ${totalWeight} kg`,
    keyPoints,
    description: `<p>${g.name}. Palette de ${g.bags} sacs de ${bagKg} kg, soit ${totalWeight} kg au total, livrée filmée.</p>`,
    price: g.price,
    original_price: null,
    pricePerStere: null,
    stock: 25,
    family: 'granules',
    subtype: 'granule',
    image: g.image,
    variantId: g.variantId,
    checkoutMultiplier: g.checkoutMultiplier,
    specs,
    category_id: cat('cat-granules').id,
    category: cat('cat-granules'),
    badge: null,
    rating: null,
    review_count: 0,
    created_at: '',
  }
}

const GRANULES: Product[] = ([
  { name: 'Granulés de Bois Belges Badger Pellets – Palette 975kg (65 sacs)',              slug: 'granules-de-bois-belges-badger-pellets-palette-975kg-65-sacs',              price: 279.93, image: '/products/badger-belges.webp',     bags: 65, variantId: '58436085973336', checkoutMultiplier: 7 },
  { name: 'Granulés de Bois d’Auvergne Moulin Bois Energie – Palette 975kg (65 sacs)',     slug: 'granules-de-bois-dauvergne-moulin-bois-energie-palette-975kg-65-sacs',     price: 329.89, image: '/products/moulin-auvergne.webp',   bags: 65, variantId: '58436086137176', checkoutMultiplier: 11 },
  { name: 'Granulés de Bois Excellent Pellets Premium – Palette 975kg (65 sacs)',          slug: 'granules-de-bois-excellent-pellets-premium-palette-975kg-65-sacs',          price: 299.90, image: '/products/excellent-pellets.webp', bags: 65, variantId: '58436086268248', checkoutMultiplier: 10 },
  { name: 'Granulés de Bois Français Crépito® Premium – Palette 1080kg (72 sacs)',         slug: 'granules-de-bois-francais-crepito-premium-palette-1080kg-72-sacs',         price: 384.89, image: '/products/crepito-premium.png',    bags: 72, cert: 'DIN+ / EN+ A1', variantId: '58436086301016', checkoutMultiplier: 11 },
  { name: 'Granulés de Bois Français Natural Energie – Palette 1050kg (70 sacs)',          slug: 'granules-de-bois-francais-natural-energie-palette-1050kg-70-sacs',          price: 269.94, image: '/products/natural-energie.webp',   bags: 70, variantId: '58436086399320', checkoutMultiplier: 6 },
  { name: 'Granulés de Bois Français Piveteau HP+ – Palette 1080kg (72 sacs)',             slug: 'granules-de-bois-francais-piveteau-hp-palette-1080kg-72-sacs',             price: 329.89, image: '/products/piveteau-hp.png',        bags: 72, variantId: '58436086497624', checkoutMultiplier: 11 },
  { name: 'Granulés de Bois Français SunPower (Triple Certification) – Palette 1050kg',    slug: 'granules-de-bois-francais-sunpower-triple-certification-palette-1050kg',    price: 349.90, image: '/products/sunpower.webp',          bags: 70, cert: 'Triple certification', variantId: '58436086563160', checkoutMultiplier: 10 },
  { name: 'Granulés de Bois Français Valboval DESTOCKAGE – Palette 975kg (65 sacs)',       slug: 'granules-de-bois-francais-valboval-destockage-palette-975kg-65-sacs',       price: 199.95, image: '/products/valboval.webp',          bags: 65, variantId: '58436086759768', checkoutMultiplier: 5 },
  { name: 'Granulés de Bois Français Woodstock® Premium – Palette 1170kg (78 sacs)',       slug: 'granules-de-bois-francais-woodstock-premium-palette-1170kg-78-sacs',       price: 299.90, image: '/products/woodstock-1170.png',     bags: 78, variantId: '58436086890840', checkoutMultiplier: 10 },
  { name: 'Granulés de Bois Français Woodstock® Premium – Palette 990kg (66 sacs)',        slug: 'granules-de-bois-francais-woodstock-premium-palette-990kg-66-sacs',        price: 244.93, image: '/products/woodstock-990.jpg',      bags: 66, variantId: '58436086956376', checkoutMultiplier: 7 },
  { name: 'Granulés de Bois HELIOS Haute Performance – Palette 975kg (65 sacs)',           slug: 'granules-de-bois-helios-haute-performance-palette-975kg-65-sacs',           price: 389.87, image: '/products/helios-hp.webp',         bags: 65, variantId: '58436086989144', checkoutMultiplier: 13 },
  { name: 'Granulés de Bois Naturels Badger Pellets – Palette 990kg (66 sacs)',            slug: 'granules-de-bois-naturels-badger-pellets-palette-990kg-66-sacs',            price: 279.93, image: '/products/badger-naturels.webp',   bags: 66, variantId: '58436087087448', checkoutMultiplier: 7 },
  { name: 'Granulés de Bois Premium Allemands Van Roje – Palette 975kg (65 sacs)',         slug: 'granules-de-bois-premium-allemands-van-roje-palette-975kg-65-sacs',         price: 244.93, image: '/products/van-roje.webp',          bags: 65, variantId: '58436087120216', checkoutMultiplier: 7 },
  { name: 'Granulés de Bois Premium TotalEnergies – Palette 990kg (66 sacs)',              slug: 'granules-de-bois-premium-totalenergies-palette-990kg-66-sacs',              price: 269.91, image: '/products/totalenergies.png',      bags: 66, variantId: '58436087185752', checkoutMultiplier: 9 },
  { name: 'Granulés de Bois Premium TotalEnergies (DIN+/EN+ A1) – Palette 990kg',          slug: 'granules-de-bois-premium-totalenergies-din-en-a1-palette-990kg',            price: 399.90, image: '/products/totalenergies-din.webp', bags: 66, cert: 'DIN+ / EN+ A1', variantId: '58436087284056', checkoutMultiplier: 10 },
  { name: 'Granulés de Bois Starforest Premium (DINplus) – Palette 1050kg (70 sacs)',      slug: 'granules-de-bois-starforest-premium-dinplus-palette-1050kg-70-sacs',        price: 449.90, image: '/products/starforest.webp',        bags: 70, cert: 'DINplus', variantId: '58436087316824', checkoutMultiplier: 10 },
  { name: 'Granulés de bois woodstock qualité premium – palette de 78 sacs de 15 kg',      slug: 'granules-de-bois-woodstock-qualite-premium-palette-de-78-sacs-de-15-kg',    price: 244.93, image: '/products/woodstock-78.webp',      bags: 78, variantId: '58436087382360', checkoutMultiplier: 7 },
  { name: 'Palette de pellets mm royal (royal pellets) – 78 sacs plastique',               slug: 'palette-de-pellets-mm-royal-royal-pellets-78-sacs-plastique',               price: 299.90, image: '/products/mm-royal.webp',          bags: 78, variantId: '58436087447896', checkoutMultiplier: 10 },
  { name: 'Pellets de bois helios – palette de 65 sacs de 15 kg',                          slug: 'pellets-de-bois-helios-palette-de-65-sacs-de-15-kg',                        price: 224.95, image: '/products/helios-65.webp',         bags: 65, variantId: '58436087611736', checkoutMultiplier: 5 },
] as GranuleInput[]).map(buildGranule)

/* ─────────────────────────────────────────────
   DÉSTOCKAGE — Granulés Limouzi, palette de 134 sacs
   Fiche reprise de depot-avenues.pro à la demande du client, qui veut
   écouler ce stock vite. Variante Shopify 58513507058008, palier 19,99 €
   × 8. Le prix barré reste à confirmer par le client.
   ───────────────────────────────────────────── */
const LIMOUZI_BASE = buildGranule({
  name: 'Granulés de bois Limouzi – Palette de 134 sacs de 15 kg',
  slug: 'granules-de-bois-limouzi-palette-de-134-sacs-de-15-kg',
  /* 159,90 € sur le site d'origine : hors grille. 19,99 × 8 = 159,92 est
     le prix le plus proche que le checkout sait facturer. */
  price: 159.92,
  image: '/products/limouzi-134.jpg',
  bags: 134,
  cert: 'ENplus A1',
  comp: 'Bois local et naturel',
  variantId: '',
  checkoutMultiplier: 8,
})

const LIMOUZI: Product = {
  ...LIMOUZI_BASE,
  variantId: '58513507058008',
  /* Une seule palette à vendre. Stock 1 = « dernier exemplaire » : limite
     à 1 par commande, et le webhook Shopify le passe en rupture dès qu'une
     commande payée le contient. */
  stock: 1,
  original_price: 879,
  richDescription: true,
  badge: 'destockage',
  tagline: 'Déstockage — ENplus A1, 2 010 kg',
  keyPoints: [
    'Offre de déstockage, dans la limite des stocks disponibles.',
    'Certification ENplus A1 : combustion propre, peu de résidus.',
    'Pouvoir calorifique supérieur à 4,6 kWh/kg, humidité inférieure à 8 %.',
    '134 sacs de 15 kg, soit 2 010 kg : de quoi tenir toute la saison de chauffe.',
    'Livraison offerte dès 89 € d’achat, en France métropolitaine, en Belgique et en Suisse.',
    'Paiement sécurisé en ligne. E-mail de confirmation avec votre numéro de commande.',
  ],
  description: `<p>Les granulés de bois Limouzi vous offrent une solution de chauffage performante et respectueuse de l’environnement, conçue pour apporter une chaleur durable et homogène. Produits localement avec des bois de qualité, ces granulés assurent une combustion propre et peu de résidus, tout en garantissant une performance thermique optimale.</p>
<h3>Avantages des granulés de bois Limouzi</h3>
<ul>
<li><strong>Haute efficacité thermique :</strong> une chaleur constante pour des journées d’hiver plus confortables.</li>
<li><strong>Certification ENplus A1 :</strong> gage de qualité et de fiabilité pour une combustion propre et écologique.</li>
<li><strong>Taux de cendres réduit :</strong> moins de résidus pour un entretien simplifié de votre appareil de chauffage.</li>
<li><strong>Grande capacité :</strong> palette de 134 sacs pour une autonomie prolongée durant toute la saison de chauffage.</li>
</ul>
<h3>Qualité et respect de l’environnement</h3>
<p>Ces granulés Limouzi sont fabriqués à partir de bois de forêts locales, garantissant ainsi un impact environnemental réduit. Avec un faible taux d’humidité et un pouvoir calorifique élevé, ils assurent une excellente performance énergétique pour une chaleur douce et continue.</p>
<h3>Pourquoi choisir Limouzi ?</h3>
<p>Les granulés Limouzi sont parfaits pour les poêles et chaudières à granulés et conviennent à ceux qui souhaitent combiner économie et écoresponsabilité. Optez pour un chauffage de qualité, durable et respectueux de la nature.</p>
<h3>Stockage</h3>
<p>Stockez votre palette de granulés dans un espace sec et bien ventilé pour préserver leur qualité et garantir une combustion optimale.</p>
<h3>En résumé</h3>
<p>Les granulés Limouzi – palette de 134 sacs de 15 kg – sont idéaux pour un chauffage écologique et efficace, tout en offrant un rapport qualité-prix avantageux. Profitez d’une chaleur douce et respectueuse de l’environnement pour passer l’hiver sereinement.</p>`,
  specs: [
    { label: 'Type de bois',        value: 'Bois local et naturel' },
    { label: 'Nombre de sacs',      value: '134 sacs' },
    { label: 'Poids par sac',       value: '15 kg' },
    { label: 'Poids total',         value: '2 010 kg' },
    { label: 'Pouvoir calorifique', value: 'Supérieur à 4,6 kWh/kg' },
    { label: 'Taux d’humidité',     value: 'Inférieur à 8 %' },
    { label: 'Taux de cendre',      value: 'Inférieur à 0,7 %' },
    { label: 'Certification',       value: 'ENplus A1' },
    { label: 'Conditionnement',     value: 'Palette de 134 sacs' },
  ],
}

/* Le déstockage passe en tête des granulés : il apparaît ainsi parmi les
   quatre mis en avant sur la page d'accueil. */
export const PRODUCTS: Product[] = [...MELANGES, ...HETRES, ...DENSIFIES, LIMOUZI, ...GRANULES]

export const BOIS_CHAUFFAGE_PRODUCTS = PRODUCTS.filter(p => p.family === 'bois-de-chauffage')
export const DENSIFIE_PRODUCTS        = PRODUCTS.filter(p => p.family === 'bois-densifie')
export const GRANULES_PRODUCTS       = PRODUCTS.filter(p => p.family === 'granules')

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find(p => p.slug === slug)
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return PRODUCTS.filter(p => p.family === product.family && p.id !== product.id).slice(0, limit)
}
