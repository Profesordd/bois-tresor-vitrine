import type { Product, Category, Spec, Lot } from '@/types/database'
import HERBICIDES from '@/lib/herbicides.json'

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
  /* Catégorie cachée (22/09/2026) : accessible par son URL uniquement,
     /product-category/desherbants-herbicides/. Jamais dans le menu ni sur
     l'accueil. */
  { id: 'cat-herbicides', slug: 'desherbants-herbicides', name: 'Désherbants & herbicides', shortName: 'Désherbants', family: 'jardin', hidden: true, created_at: '' },
  /* Catégorie cachée (29/09/2026), en préparation : accessible par son URL
     seulement, /product-category/rangement-granules/. */
  { id: 'cat-rangement', slug: 'rangement-granules', name: 'Rangement granulés', shortName: 'Rangement', family: 'rangement', hidden: true, created_at: '' },
]

/** Catégories visibles dans la navigation, les filtres et le « tout voir ». */
export const CATEGORIES_VISIBLES = CATEGORIES.filter((c) => !c.hidden)

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
      'Livraison offerte, en France métropolitaine, en Belgique, en Suisse et au Luxembourg.',
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
      'Livraison offerte, en France métropolitaine, en Belgique, en Suisse et au Luxembourg.',
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
      'Livraison offerte, en France métropolitaine, en Belgique, en Suisse et au Luxembourg.',
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
    'Livraison offerte, en France métropolitaine, en Belgique, en Suisse et au Luxembourg.',
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
   DÉSTOCKAGE — Granulés Limouzi, vendus par lot
   Une seule fiche, quatre formats : chaque lot a son propre produit
   Shopify (identifiant + multiplicateur), le site construit le lien de
   paiement du lot choisi. Un lot sans identifiant est masqué jusqu'à ce
   que le client le fournisse. Le slug historique est conservé : la fiche
   est déjà en ligne et référencée.
   ───────────────────────────────────────────── */
const LIMOUZI_BASE = buildGranule({
  name: 'Granulés de bois Limouzi – sacs de 15 kg',
  slug: 'granules-de-bois-limouzi-palette-de-134-sacs-de-15-kg',
  price: 119.88,
  image: '/products/limouzi-134.jpg',
  bags: 65,
  cert: 'ENplus A1',
  comp: 'Bois local et naturel',
  variantId: '',
  checkoutMultiplier: 12,
})

/* Prix calés sur la grille du checkout (produits Shopify créés le
   20/09/2026). Deux petits lots ne coûtent jamais moins qu'un grand, pour
   que « plus vous prenez, moins c'est cher » ne puisse pas être contourné.
   Le repère « meilleur prix au sac » et la phrase de progression sont
   calculés depuis ces prix, jamais écrits à la main. */
const LIMOUZI_LOTS: Lot[] = [
  { id: '20',      sacs: 20, poids: '300 kg', price: 49.98,  variantId: '58519088136536', checkoutMultiplier: 2 },  // 24,99 × 2 — 2,50 €/sac
  { id: '30',      sacs: 30, poids: '450 kg', price: 59.97,  variantId: '58519088169304', checkoutMultiplier: 3 },  // 19,99 × 3 — 2,00 €/sac
  { id: '40',      sacs: 40, poids: '600 kg', price: 74.97,  variantId: '58519088202072', checkoutMultiplier: 3 },  // 24,99 × 3 — 1,87 €/sac
  { id: 'palette', sacs: 65, poids: '975 kg', price: 119.88, variantId: '58513507058008', checkoutMultiplier: 12, label: 'Palette 65 sacs' },  // 9,99 × 12 — 1,84 €/sac
]

const LIMOUZI: Product = {
  ...LIMOUZI_BASE,
  variantId: '58513507058008',
  original_price: null,
  badge: 'destockage',
  /* Description longue volontairement non affichée : 250 mots de texte
     générique qui répètent les points clés. Le client venu de la pub veut
     le prix, le lot, la certification, et le bouton. */
  richDescription: false,
  lots: LIMOUZI_LOTS,
  defaultLotId: '30',
  stock: 20,
  tagline: 'Déstockage — ENplus A1, par lot de 20 sacs ou par palette',
  /* Cinq lignes, pas plus. La première sert aussi de description dans les
     résultats de recherche et les aperçus de partage. */
  keyPoints: [
    'Par lot de 20, 30 ou 40 sacs, ou palette de 65 sacs, à partir de 49,98 € — livraison offerte. Plus vous prenez, moins le sac est cher.',
    'Prix déstockage, dans la limite des stocks disponibles.',
    'Certification ENplus A1 : combustion propre, très peu de cendres.',
    'Sacs de 15 kg, faciles à porter et à ranger : 20 sacs tiennent sur moins d’un mètre carré.',
    'Paiement sécurisé en ligne. E-mail de confirmation avec votre numéro de commande.',
  ],
  description: `<p>Les granulés de bois Limouzi vous offrent une solution de chauffage performante et respectueuse de l’environnement, conçue pour apporter une chaleur durable et homogène. Produits localement avec des bois de qualité, ces granulés assurent une combustion propre et peu de résidus, tout en garantissant une performance thermique optimale.</p>
<h3>Avantages des granulés de bois Limouzi</h3>
<ul>
<li><strong>Haute efficacité thermique :</strong> une chaleur constante pour des journées d’hiver plus confortables.</li>
<li><strong>Certification ENplus A1 :</strong> gage de qualité et de fiabilité pour une combustion propre et écologique.</li>
<li><strong>Taux de cendres réduit :</strong> moins de résidus pour un entretien simplifié de votre appareil de chauffage.</li>
<li><strong>À votre mesure :</strong> par lot de 20, 30 ou 40 sacs pour un petit poêle ou un petit espace, ou par palette de 65 sacs pour toute la saison.</li>
</ul>
<h3>Qualité et respect de l’environnement</h3>
<p>Ces granulés Limouzi sont fabriqués à partir de bois de forêts locales, garantissant ainsi un impact environnemental réduit. Avec un faible taux d’humidité et un pouvoir calorifique élevé, ils assurent une excellente performance énergétique pour une chaleur douce et continue.</p>
<h3>Pourquoi choisir Limouzi ?</h3>
<p>Les granulés Limouzi sont parfaits pour les poêles et chaudières à granulés et conviennent à ceux qui souhaitent combiner économie et écoresponsabilité. Optez pour un chauffage de qualité, durable et respectueux de la nature.</p>
<h3>Stockage</h3>
<p>Stockez vos sacs dans un espace sec et bien ventilé pour préserver leur qualité et garantir une combustion optimale.</p>
<h3>En résumé</h3>
<p>Les granulés Limouzi, en sacs de 15 kg, sont idéaux pour un chauffage écologique et efficace, tout en offrant un rapport qualité-prix avantageux. Profitez d’une chaleur douce et respectueuse de l’environnement pour passer l’hiver sereinement.</p>`,
  specs: [
    { label: 'Type de bois',        value: 'Bois local et naturel' },
    { label: 'Formats',             value: '20, 30 ou 40 sacs, ou palette de 65 sacs (975 kg)' },
    { label: 'Poids par sac',       value: '15 kg' },
    { label: 'Pouvoir calorifique', value: 'Supérieur à 4,6 kWh/kg' },
    { label: 'Taux d’humidité',     value: 'Inférieur à 8 %' },
    { label: 'Taux de cendre',      value: 'Inférieur à 0,7 %' },
    { label: 'Certification',       value: 'ENplus A1' },
    { label: 'Conditionnement',     value: 'Sacs filmés sur palette' },
  ],
}

/* ─────────────────────────────────────────────
   DÉSHERBANTS & HERBICIDES — catégorie cachée
   28 fiches importées de naturejardin-fr.com (scripts/import-herbicides.mjs,
   données dans lib/herbicides.json, photos dans public/products/herbicides/).
   Aucun identifiant de checkout : non commandables tant que les produits
   Shopify n'existent pas et que les prix ne sont pas ramenés sur la grille.
   Les prix et prix barrés sont exactement ceux du site source (l'autre site
   du client). L'ordre du fichier est l'ordre de popularité de ce site
   (?orderby=popularity, relevé le 22/09/2026) : la collection l'affiche tel
   quel, les plus vendus d'abord.
   ───────────────────────────────────────────── */
interface HerbicideInput {
  slug: string
  name: string
  price: number
  original_price: number | null
  contenance: string | null
  matiere_active: string | null
  selectif: boolean
  image: string
  description: string
}

/* Au-dessus de ce prix, le produit est affiché en rupture (décision du
   client, 22/09/2026) : les gros bidons ne sont pas vendus ici. */
const HERBICIDE_PRIX_MAX = 170

function buildHerbicide(h: HerbicideInput): Product {
  const specs: Spec[] = [
    { label: 'Type', value: h.selectif ? 'Herbicide sélectif (gazon)' : 'Herbicide total, non sélectif' },
  ]
  if (h.matiere_active) specs.push({ label: 'Matière active', value: h.matiere_active })
  if (h.contenance) specs.push({ label: 'Contenance', value: h.contenance })
  specs.push({ label: 'Usage', value: 'Réservé aux utilisateurs professionnels' })

  return {
    id: nextId(),
    slug: h.slug,
    name: h.name,
    tagline: h.selectif ? 'Sélectif gazon — feuilles larges' : 'Herbicide total à action systémique',
    keyPoints: [
      h.selectif
        ? 'Herbicide sélectif pour pelouse : élimine les feuilles larges (trèfle, pissenlit, plantain) sans abîmer le gazon.'
        : 'Herbicide total à action systémique : absorbé par les feuilles, il descend jusqu’aux racines.',
      h.matiere_active ? `Matière active : ${h.matiere_active}.` : null,
      h.contenance ? `Contenance : ${h.contenance}.` : null,
      'Produit réservé aux utilisateurs professionnels (certificat Certiphyto). Lire l’étiquette avant toute utilisation.',
      'Livraison offerte, en France métropolitaine, en Belgique, en Suisse et au Luxembourg.',
      'Paiement sécurisé en ligne. E-mail de confirmation avec votre numéro de commande.',
    ].filter((p): p is string => p !== null),
    description: h.description,
    richDescription: true,
    price: h.price,
    original_price: h.original_price,
    pricePerStere: null,
    stock: h.price > HERBICIDE_PRIX_MAX ? 0 : 20,
    family: 'jardin',
    subtype: 'herbicide',
    image: h.image,
    variantId: null,
    checkoutMultiplier: null,
    specs,
    category_id: cat('cat-herbicides').id,
    category: cat('cat-herbicides'),
    badge: h.original_price ? 'destockage' : null,
    rating: null,
    review_count: 0,
    created_at: '',
  }
}

const HERBICIDES_PRODUITS: Product[] = (HERBICIDES as HerbicideInput[]).map(buildHerbicide)


/* ─────────────────────────────────────────────
   RANGEMENT GRANULÉS — collection cachée, en préparation (29/09/2026)

   Accessoires pour le client qui chauffe aux granulés. Chaque fiche est
   adossée à un produit réellement en vente, dont les caractéristiques et
   les photos ont été relevées sur sa fiche Amazon (ASIN indiqué au-dessus
   de chaque entrée) : dimensions, contenance, matière, contenu du colis.

   Photos : 5 à 6 par fiche, uniquement les visuels sans logo de marque ni
   texte publicitaire incrusté — les autres ont été écartés, ils ne peuvent
   pas figurer sur le site du client. La photo du pack est un montage des
   deux objets qui le composent : il n'existe pas tel quel chez un
   fournisseur.

   À COMPLÉTER AVANT TOUTE MISE EN VENTE :
     - les identifiants de variante Shopify (`variantId: null` = fiche non
       commandable, elle renvoie vers le contact) ;
     - les prix : ceux du brief, à caler sur la grille du checkout au
       centime près quand les produits Shopify existeront ;
     - le fournisseur retenu pour chaque référence.
   ───────────────────────────────────────────── */
interface RangementInput {
  slug: string
  name: string
  price: number
  tagline: string
  /** Contenance en sacs de 15 kg, si l'objet en stocke. */
  sacs?: string
  /**
   * Nombre de photos disponibles, nommées `<slug>-1.jpg` … `<slug>-N.jpg`.
   * Absent : la fiche affiche le visuel d'attente.
   */
  photos?: number
  /** Liste explicite, quand les photos ne portent pas le nom de la fiche. */
  images?: string[]
  keyPoints: string[]
  specs: Spec[]
  description: string
}

const PHOTO_RANGEMENT = '/products/rangement/a-venir.svg'
const photoRangement = (slug: string, n: number) => `/products/rangement/${slug}-${n}.jpg`

function buildRangement(r: RangementInput): Product {
  const images =
    r.images ??
    (r.photos ? Array.from({ length: r.photos }, (_, i) => photoRangement(r.slug, i + 1)) : [PHOTO_RANGEMENT])
  return {
    id: nextId(),
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    keyPoints: [
      ...r.keyPoints,
      'Livraison offerte, en France métropolitaine, en Belgique, en Suisse et au Luxembourg.',
      'Paiement sécurisé en ligne. E-mail de confirmation avec votre numéro de commande.',
    ],
    description: r.description,
    richDescription: true,
    price: r.price,
    original_price: null,
    pricePerStere: null,
    stock: 20,
    family: 'rangement',
    subtype: 'rangement',
    image: images[0],
    images,
    variantId: null,
    checkoutMultiplier: null,
    specs: r.specs,
    category_id: cat('cat-rangement').id,
    category: cat('cat-rangement'),
    badge: null,
    rating: null,
    review_count: 0,
    created_at: '',
  }
}

const RANGEMENT: Product[] = ([
  /* IDMarket — ASIN B0CH3TXS89 */
  {
    slug: 'reservoir-granules-45-kg-roulettes',
    name: 'Réservoir à granulés 45 kg, à roulettes',
    price: 59.99,
    photos: 6,
    tagline: '3 sacs de 15 kg — métal, se déplace plein',
    sacs: '3 sacs de 15 kg',
    keyPoints: [
      'Contient 3 sacs de 15 kg : de quoi tenir plusieurs jours sans retourner au garage.',
      'Quatre roulettes : vous le déplacez plein, sans le porter.',
      'Fenêtre de niveau sur toute la hauteur : vous voyez ce qu’il reste sans ouvrir.',
      'Tamis perforé amovible au fond : il retient les fines, vous le sortez d’une main.',
      'Façade avant démontable : le remplissage se fait de face, sans soulever le sac au-dessus.',
      'Encombrement au sol : 36 × 36 cm, la place d’une petite poubelle.',
    ],
    specs: [
      { label: 'Contenance',        value: '45 kg, soit 3 sacs de 15 kg' },
      { label: 'Dimensions',        value: '36 × 36 × 76 cm (L × l × H)' },
      { label: 'Matière',           value: 'Métal, finition noire' },
      { label: 'Mobilité',          value: '4 roulettes' },
      { label: 'Fenêtre de niveau', value: 'Oui, verticale, sur toute la hauteur' },
      { label: 'Filtration',        value: 'Tamis perforé amovible' },
      { label: 'Couvercle',         value: 'Oui, avec poignée' },
    ],
    description: `<p>Le réservoir que l’on remplit une fois et qu’on oublie pendant une semaine. Trois sacs de 15 kg tiennent dedans, et il se déplace plein grâce à ses roulettes : plus besoin de porter les sacs du garage au salon.</p>
<h3>Pourquoi celui-ci</h3>
<ul>
<li><strong>Il est en métal.</strong> Pas de plastique qui se déforme à côté d’un poêle.</li>
<li><strong>Il roule chargé.</strong> Quatre roulettes, même à 45 kg.</li>
<li><strong>Vous voyez le niveau.</strong> Une fenêtre sur toute la hauteur, sans ouvrir le couvercle.</li>
<li><strong>Il se remplit sans forcer.</strong> La façade avant se démonte : on verse le sac de face, pas par-dessus.</li>
<li><strong>Il ne salit pas.</strong> Couvercle à poignée, et un tamis perforé au fond qui retient les fines de granulés.</li>
<li><strong>Il tient à côté du poêle.</strong> 36 cm sur 36 cm au sol.</li>
</ul>`,
  },

  /* Montage des deux références encadrantes : le pack n'existe pas chez un fournisseur */
  {
    slug: 'pack-reservoir-45-kg-seau-pelle',
    name: 'Pack confort : réservoir 45 kg + seau à cendres',
    price: 79.99,
    images: [
      '/products/rangement/pack-reservoir-seau-1.jpg',
      '/products/rangement/reservoir-granules-45-kg-roulettes-1.jpg',
      '/products/rangement/reservoir-granules-45-kg-roulettes-4.jpg',
      '/products/rangement/reservoir-granules-45-kg-roulettes-2.jpg',
      '/products/rangement/seau-cendres-19l-pelle-1.jpg',
      '/products/rangement/seau-cendres-19l-pelle-5.jpg',
    ],
    tagline: 'Le plein d’un côté, les cendres de l’autre',
    sacs: '3 sacs de 15 kg',
    keyPoints: [
      'Les deux objets qu’on utilise tous les jours quand on chauffe aux granulés.',
      'Le réservoir 45 kg à roulettes : trois sacs de 15 kg, fenêtre de niveau, tamis amovible.',
      'Le seau à cendres 19 L en acier, son couvercle et sa pelle de 39 cm rangée sur le côté.',
      'Moins cher que les deux pris séparément.',
    ],
    specs: [
      { label: 'Contenu',          value: 'Réservoir à granulés 45 kg + seau à cendres 19 L avec pelle' },
      { label: 'Réservoir',        value: 'Métal, 36 × 36 × 76 cm, 4 roulettes, tamis amovible' },
      { label: 'Seau',             value: 'Acier, Ø 32,5 × 35,5 cm, couvercle et pelle de 39 cm' },
      { label: 'Ce que ça couvre', value: 'Le stockage des granulés et le vidage du poêle' },
    ],
    description: `<p>Les deux gestes du quotidien, quand on chauffe aux granulés : remplir le poêle, et vider le cendrier. Ce pack réunit l’objet qui sert à l’un et l’objet qui sert à l’autre.</p>
<h3>Ce que vous recevez</h3>
<ul>
<li><strong>Le réservoir 45 kg à roulettes.</strong> Trois sacs de 15 kg, fenêtre de niveau sur toute la hauteur, tamis perforé au fond, façade avant démontable.</li>
<li><strong>Le seau à cendres 19 L en acier.</strong> Couvercle, anse à poignée bois, et sa pelle de 39 cm qui se range dans un support sur le flanc du seau.</li>
</ul>
<p>La photo principale montre les deux objets réunis ; ils sont livrés dans leur emballage d’origine.</p>`,
  },

  /* EDA Jura Montania XL, fabriqué en France — ASIN B0BJW3SLCY */
  {
    slug: 'coffre-granules-70l-couvercle-bois',
    name: 'Coffre à granulés 70 L, couvercle bois',
    price: 89.99,
    photos: 6,
    tagline: '3 sacs de 15 kg — fabriqué en France, couvercle bois PEFC',
    sacs: '3 sacs de 15 kg',
    keyPoints: [
      'Contient 45 kg, soit trois sacs de 15 kg, dans un objet qui reste bas.',
      'Couvercle en bois PEFC : il ferme, et il sert de tablette à côté du poêle.',
      'Fabriqué en France, en plastique recyclé — il ne rouille pas, même dans une véranda.',
      'Quatre roulettes multidirectionnelles sous le fond : il pivote sur place.',
      'Ajours sur les flancs : vous voyez le niveau de granulés d’un coup d’œil.',
    ],
    specs: [
      { label: 'Contenance',  value: '70 L, soit 45 kg ou 3 sacs de 15 kg' },
      { label: 'Dimensions',  value: '49,6 × 37,9 × 66,4 cm (L × l × H)' },
      { label: 'Matière',     value: 'Plastique recyclé, couvercle bois PEFC' },
      { label: 'Mobilité',    value: '4 roulettes multidirectionnelles' },
      { label: 'Fabrication', value: 'France' },
      { label: 'Couvercle',   value: 'Bois, avec poignée encastrée' },
    ],
    description: `<p>Le coffre plutôt que la colonne : plus bas, plus large, il se glisse le long d’un mur ou derrière un fauteuil. Trois sacs de 15 kg tiennent dedans.</p>
<h3>Ce qui le distingue</h3>
<ul>
<li><strong>Fabriqué en France.</strong> Corps en plastique recyclé, couvercle en bois issu de forêts gérées durablement (PEFC).</li>
<li><strong>Le couvercle sert.</strong> On y pose la télécommande du poêle, le briquet, la pelle.</li>
<li><strong>Il pivote sur place.</strong> Quatre roulettes multidirectionnelles, y compris plein.</li>
<li><strong>Vous voyez le niveau.</strong> Les découpes sur les flancs laissent apparaître les granulés.</li>
</ul>`,
  },

  /* FACILITY'S 51 L, acier et bois — ASIN B0FSYRCKTC */
  {
    slug: 'reservoir-granules-51l-design',
    name: 'Bac à granulés 51 L, acier et bois, avec pelle et tamis',
    price: 119.99,
    photos: 6,
    tagline: 'Un sac entier, dans un objet qu’on laisse dans la pièce',
    sacs: '1 sac de 15 kg',
    keyPoints: [
      'Un sac de 15 kg entier tient dedans, sans déborder.',
      'Acier noir mat, couvercle en bois, poignées en corde tressée : il reste dans le salon.',
      'Livré avec sa pelle en métal perforée et son tamis central : les fines restent au fond.',
      '3,6 kg à vide seulement : on le déplace à la main, même rempli.',
      'Se porte à deux mains par les poignées corde, sans se salir.',
    ],
    specs: [
      { label: 'Contenance',   value: '51 L, soit un sac de 15 kg' },
      { label: 'Dimensions',   value: '40,5 × 40,5 × 52,5 cm (L × l × H)' },
      { label: 'Matière',      value: 'Acier 0,35 mm, finition noir mat' },
      { label: 'Couvercle',    value: 'Bois' },
      { label: 'Poignées',     value: 'Corde tressée' },
      { label: 'Fourni avec',  value: 'Pelle en métal perforée et tamis central en acier' },
      { label: 'Poids à vide', value: '3,6 kg' },
    ],
    description: `<p>Celui-là, on ne le cache pas derrière un meuble. Acier noir mat, couvercle en bois, poignées en corde : il a été dessiné pour rester à côté du poêle, dans la pièce de vie.</p>
<h3>Ce qu’il apporte</h3>
<ul>
<li><strong>Un sac entier.</strong> 51 litres : le sac de 15 kg y passe en une fois.</li>
<li><strong>La pelle est fournie.</strong> En métal, perforée : les fines retombent dans le bac au lieu d’aller dans le poêle.</li>
<li><strong>Un tamis central.</strong> Les impuretés se déposent en dessous, elles ne partent pas dans le brûleur.</li>
<li><strong>Il se porte.</strong> 3,6 kg à vide, deux poignées en corde tressée.</li>
</ul>`,
  },

  /* EDA Jura Montania 38 L, fabriqué en France — ASIN B0BJW6WZ8B */
  {
    slug: 'coffre-granules-38l-roulettes',
    name: 'Coffre à granulés 38 L, à roulettes',
    price: 39.99,
    photos: 5,
    tagline: '25 kg — le format qui rentre partout',
    sacs: '1 sac et demi de 15 kg',
    keyPoints: [
      'Contient 25 kg de granulés dans 40 cm de diamètre au sol.',
      'Roulettes sous le fond : vous le roulez du garage au poêle sans le porter.',
      'Couvercle en bois PEFC, avec une poignée encastrée pour l’ouvrir d’une main.',
      'Fabriqué en France, en plastique — il ne rouille pas et se lave à l’éponge.',
      'Fenêtres de niveau verticales : un coup d’œil suffit.',
    ],
    specs: [
      { label: 'Contenance',  value: '38 L, soit 25 kg de granulés' },
      { label: 'Dimensions',  value: 'Ø 39,7 × 60,5 cm' },
      { label: 'Matière',     value: 'Plastique, couvercle bois PEFC' },
      { label: 'Mobilité',    value: 'Roulettes sous le fond' },
      { label: 'Fabrication', value: 'France' },
    ],
    description: `<p>Le petit format, pour ceux qui n’ont pas la place d’une colonne de 76 cm de haut. Quarante centimètres de diamètre au sol, 25 kg de granulés dedans.</p>
<h3>À qui il convient</h3>
<p>À l’appartement, au studio, à la pièce où le poêle est déjà serré entre deux meubles. On le remplit avec un sac et demi, on le roule jusqu’au poêle, et il disparaît une fois le couvercle fermé.</p>`,
  },

  /* Relaxdays 19 L, acier — ASIN B07ZP22265 */
  {
    slug: 'seau-cendres-19l-pelle',
    name: 'Seau à cendres 19 L en acier, avec couvercle et pelle',
    price: 24.99,
    photos: 6,
    tagline: '19 L — le seau, son couvercle, sa pelle rangée sur le flanc',
    keyPoints: [
      'Acier thermolaqué noir mat : il encaisse les cendres encore tièdes.',
      'Couvercle : on transporte les cendres sans en semer dans la maison.',
      'Pelle de 39 cm fournie, rangée dans un support sur le flanc du seau — jamais perdue.',
      'Anse à poignée bois : on le porte plein sans se brûler les doigts.',
      '19 litres : plusieurs vidages de poêle avant d’aller le vider.',
    ],
    specs: [
      { label: 'Volume',       value: '19 L' },
      { label: 'Dimensions',   value: 'Ø 32,5 × 35,5 cm (hors anse)' },
      { label: 'Matière',      value: 'Acier thermolaqué, noir mat' },
      { label: 'Pelle',        value: '39 cm, acier, avec support sur le seau' },
      { label: 'Anse',         value: 'Acier, poignée bois' },
      { label: 'Poids à vide', value: '1,93 kg' },
      { label: 'Fourni avec',  value: 'Seau, couvercle et pelle' },
    ],
    description: `<p>L’objet qu’on garde à côté du poêle : le seau, son couvercle, et sa pelle rangée dans un support sur le flanc. On vide le cendrier, on referme, on sort le seau — rien ne tombe en chemin.</p>
<h3>Pourquoi un seau en métal</h3>
<p>L’acier thermolaqué encaisse les cendres encore tièdes. Un seau en plastique fond, et un sac poubelle prend feu : c’est l’accident domestique le plus courant autour d’un poêle.</p>
<h3>Pourquoi 19 litres</h3>
<p>Un seau de 5 litres se remplit en deux vidages. Celui-ci tient la semaine, et il se porte quand même d’une main grâce à son anse.</p>`,
  },

  /* EDA Jura Montania XL, fabriqué en France — ASIN B0BJW4F2CB */
  {
    slug: 'pelle-granules-xl',
    name: 'Pelle à granulés XL 2,4 L, avec tamis',
    price: 9.99,
    photos: 6,
    tagline: '1,5 kg par passage — et les fines restent dans la pelle',
    keyPoints: [
      '1,5 kg de granulés par passage : deux allers-retours suffisent à remplir le poêle.',
      'Tamis breveté dans le fond : la poussière de granulés y est retenue.',
      'La trappe à poussière s’ouvre pour vider les fines à la poubelle, et pas dans le poêle.',
      'Plastique 100 % recyclé : légère, elle ne raye pas le réservoir.',
      'Fabriquée en France.',
    ],
    specs: [
      { label: 'Contenance',  value: '2,4 L, soit 1,5 kg de granulés' },
      { label: 'Dimensions',  value: '19,3 × 16,5 × 21,9 cm (L × l × H)' },
      { label: 'Matière',     value: 'Plastique 100 % recyclé' },
      { label: 'Filtration',  value: 'Tamis breveté dans le fond, trappe de vidage' },
      { label: 'Fabrication', value: 'France' },
    ],
    description: `<p>La poussière de granulés est ce qui encrasse un poêle. Cette pelle la retient : le fond est un tamis, les fines tombent dedans, et une trappe permet de les vider à la poubelle.</p>
<h3>Pourquoi une XL</h3>
<p>2,4 litres, soit 1,5 kg par passage. Sur un poêle qui se remplit tous les deux jours, ça fait deux gestes au lieu de cinq.</p>`,
  },

  /* Ulsonix ASHCLEAN 20BW — ASIN B07Z7PN3BT */
  {
    slug: 'aspirateur-cendres-20l',
    name: 'Aspirateur à cendres 20 L, 1 200 W',
    price: 49.99,
    photos: 6,
    tagline: 'Le cendrier vidé en deux minutes, sans un nuage',
    keyPoints: [
      'Cuve acier de 20 L : plusieurs vidages de poêle avant de devoir la vider.',
      'Filtre HEPA : la cendre fine reste dans la cuve, elle ne ressort pas dans la pièce.',
      'Aspire les cendres froides et les cendres tièdes, jamais les braises.',
      'Tuyau métal et embouts : on va chercher la cendre au fond du foyer.',
      'Fonction soufflerie : le même appareil nettoie l’atelier ou la terrasse.',
      'Roulettes sous la cuve : il suit, on ne le porte pas.',
    ],
    specs: [
      { label: 'Capacité',     value: '20 L' },
      { label: 'Puissance',    value: '1 200 W' },
      { label: 'Alimentation', value: '230 V, avec fil' },
      { label: 'Filtration',   value: 'Filtre HEPA à cartouche' },
      { label: 'Cuve',         value: 'Acier' },
      { label: 'Fonctions',    value: 'Aspiration et soufflage' },
      { label: 'Mobilité',     value: 'Roulettes' },
      { label: 'Poids',        value: '4 kg' },
    ],
    description: `<p>Vider un cendrier à la pelle, c’est un nuage gris dans le salon. Avec celui-ci, on branche, on aspire, et il n’y a rien à balayer derrière.</p>
<h3>Ce qu’il faut savoir</h3>
<ul>
<li><strong>Il est fait pour la cendre.</strong> Un aspirateur de maison se bouche ou prend feu : la cendre fine traverse ses filtres.</li>
<li><strong>Filtre HEPA.</strong> Ce qui entre dans la cuve n’en ressort pas.</li>
<li><strong>20 litres.</strong> On le vide une fois par mois, pas à chaque flambée.</li>
<li><strong>Il souffle aussi.</strong> En branchant le tuyau sur la sortie d’air, il dégage les feuilles d’une terrasse.</li>
</ul>
<p>Les cendres doivent être froides ou tièdes, jamais incandescentes.</p>`,
  },
] as RangementInput[]).map(buildRangement)

/* ─────────────────────────────────────────────
   TEST A/B PRIX — fiche B des granulés Limouzi (23/09/2026)

   Même produit, mêmes photos, même texte que la fiche A ; seuls les prix
   et les lots changent. Non listée : accessible par son URL uniquement,
   elle reçoit sa propre campagne publicitaire. La décision se prendra sur
   les commandes payées par variante, côté processeur — pas sur les clics.

   Note de méthode : les formats diffèrent entre A (20/30/40 + palette 65)
   et B (20/30 + demi-palette 45). Le test mesure donc « prix bas + ces
   formats » contre « prix haut + ces formats », pas le prix seul.

   Prix contrôlés sur la grille, en centimes :
     89,98 € = 44,99 × 2   119,97 € = 39,99 × 3   149,95 € = 29,99 × 5
   ───────────────────────────────────────────── */
const LIMOUZI_B_LOTS: Lot[] = [
  { id: '20',  sacs: 20, poids: '300 kg', price: 89.98,  variantId: '58545343758680', checkoutMultiplier: 2 },  // 4,50 €/sac
  { id: '30',  sacs: 30, poids: '450 kg', price: 119.97, variantId: '58545345298776', checkoutMultiplier: 3 },  // 4,00 €/sac
  { id: 'demi', sacs: 45, poids: '675 kg', price: 149.95, variantId: '58545346675032', checkoutMultiplier: 5, label: 'Demi-palette 45 sacs' },  // 3,33 €/sac
]

const LIMOUZI_B: Product = {
  ...LIMOUZI,
  id: nextId(),
  slug: 'granules-de-bois-limouzi-sacs-de-15-kg',
  lots: LIMOUZI_B_LOTS,
  defaultLotId: '30',
  price: 89.98,
  variantId: '58545343758680',
  checkoutMultiplier: 2,
  unlisted: true,
  canonicalOf: LIMOUZI.slug,
  /* Arrivage limité, d'un autre fournisseur : quantité et date réelles,
     à tenir à jour. Le compte à rebours vise cette date exacte et la fiche
     cesse de vendre une fois passée. */
  offre: { finAt: '2026-09-27T23:59:00+02:00', lotsRestants: 3 },
  keyPoints: LIMOUZI.keyPoints.map((l) =>
    l.startsWith('Par lot de')
      ? 'Par lot de 20 ou 30 sacs, ou demi-palette de 45 sacs, à partir de 89,98 € — livraison offerte. Plus vous prenez, moins le sac est cher.'
      : l
  ),
  specs: LIMOUZI.specs.map((sp) =>
    sp.label === 'Formats' ? { ...sp, value: '20 ou 30 sacs, ou demi-palette de 45 sacs (675 kg)' } : sp
  ),
  tagline: 'Déstockage — ENplus A1, par lot de 20 sacs ou demi-palette',
}

/* Le déstockage passe en tête des granulés : il apparaît ainsi parmi les
   quatre mis en avant sur la page d'accueil. La fiche B suit, non listée :
   elle doit exister dans le catalogue pour que sa page soit générée. */
export const PRODUCTS: Product[] = [...MELANGES, ...HETRES, ...DENSIFIES, LIMOUZI, LIMOUZI_B, ...GRANULES, ...HERBICIDES_PRODUITS, ...RANGEMENT]

export const BOIS_CHAUFFAGE_PRODUCTS = PRODUCTS.filter(p => p.family === 'bois-de-chauffage')
export const DENSIFIE_PRODUCTS        = PRODUCTS.filter(p => p.family === 'bois-densifie')
export const GRANULES_PRODUCTS       = PRODUCTS.filter(p => p.family === 'granules')

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find(p => p.slug === slug)
}

/**
 * Produits proposés en bas de fiche. Même famille d'abord, puis les autres
 * familles si elle ne suffit pas — pour que le bloc ne montre jamais une
 * rangée de produits en rupture sous un produit en vente. Le stock réel
 * est appliqué par l'appelant (voir lib/stock.ts) ; ici on reçoit le
 * catalogue déjà filtré.
 */
export function getRelatedProducts(product: Product, limit = 4, catalogue: Product[] = PRODUCTS): Product[] {
  /* Une catégorie cachée ne s'invite sur aucune autre fiche, et ses propres
     fiches ne proposent qu'elle-même. */
  const cachee = (p: Product) => Boolean(p.category?.hidden)
  const autres = catalogue.filter(
    p => p.id !== product.id && p.stock > 0 && !p.unlisted && cachee(p) === cachee(product)
  )
  const memeFamille = autres.filter(p => p.family === product.family)
  const reste = autres.filter(p => p.family !== product.family)
  return [...memeFamille, ...reste].slice(0, limit)
}
