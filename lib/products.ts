import type { Product, Category, Spec } from '@/types/database'
import { slugify } from '@/lib/utils'

/**
 * Catalogue de démonstration — Bois Trésor.
 *
 * Les prix ci-dessous sont des ESTIMATIONS INDICATIVES pour l'aperçu visuel.
 * Ils doivent être remplacés par la grille tarifaire réelle du client avant
 * toute mise en production (voir aussi la barre de chiffres clés en page
 * d'accueil, à ajuster avec les vraies statistiques de l'activité).
 */

export const CATEGORIES: Category[] = [
  { id: 'cat-buches',       slug: 'buches-de-chauffage', name: 'Bûches de chauffage', family: 'bois-de-chauffage', created_at: '' },
  { id: 'cat-densifie',     slug: 'bois-densifie',       name: 'Bois densifié',       family: 'bois-de-chauffage', created_at: '' },
  { id: 'cat-compressees',  slug: 'buches-compressees',  name: 'Bûches compressées',  family: 'bois-de-chauffage', created_at: '' },
  { id: 'cat-granules',     slug: 'granules-de-bois',    name: 'Granulés & pellets',  family: 'granules',          created_at: '' },
]

function cat(id: string): Category {
  return CATEGORIES.find(c => c.id === id)!
}

let _n = 0
function nextId() { _n += 1; return `bt-${String(_n).padStart(3, '0')}` }

interface BucheInput {
  length: number
  price: number
  originalPrice: number
  badge?: string | null
}

function buildBuche({ length, price, originalPrice, badge = null }: BucheInput): Product {
  const name = `Bois de chauffage ${length} cm — prix au stère`
  const specs: Spec[] = [
    { label: 'Essence',           value: 'Feuillus durs mélangés (chêne, charme, hêtre)' },
    { label: 'Longueur des bûches', value: `${length} cm` },
    { label: 'Taux d’humidité', value: '< 20 % — séché à cœur' },
    { label: 'Conditionnement',    value: 'Vendu au stère, livraison en vrac ou palette filmée' },
    { label: 'Usage conseillé',    value: 'Cheminée, insert, poêle à bûches' },
  ]
  return {
    id: nextId(),
    slug: slugify(name),
    name,
    tagline: 'Feuillus durs séchés à cœur, prêts à brûler',
    description: `<p>Ce bois de chauffage ${length} cm est composé de feuillus durs (chêne, charme, hêtre) séchés à cœur pendant plusieurs saisons, pour un taux d’humidité contrôlé sous les 20 %. Une bûche bien sèche s’allume plus facilement, brûle plus longtemps et encrasse beaucoup moins vos conduits qu’un bois humide.</p><ul><li>Coupe calibrée ${length} cm, compatible avec la plupart des foyers fermés et inserts</li><li>Fendu pour une combustion homogène et un allumage rapide</li><li>Vendu au stère — quantité ajustable selon vos besoins</li><li>Livraison en vrac ou sur palette filmée selon le volume commandé</li></ul>`,
    price,
    original_price: originalPrice,
    stock: 24,
    family: 'bois-de-chauffage',
    subtype: 'buche',
    specs,
    category_id: cat('cat-buches').id,
    category: cat('cat-buches'),
    badge,
    rating: null,
    review_count: 0,
    created_at: '',
  }
}

interface DensifieInput {
  name: string
  essence: string
  weightLabel: string
  price: number
  originalPrice: number
  badge?: string | null
}

function buildDensifie({ name, essence, weightLabel, price, originalPrice, badge = null }: DensifieInput): Product {
  const specs: Spec[] = [
    { label: 'Composition',        value: `Bois densifié 100 % ${essence}, sans additif` },
    { label: 'Conditionnement',    value: weightLabel },
    { label: 'Taux d’humidité', value: '< 12 %' },
    { label: 'Pouvoir calorifique', value: 'Supérieur à la bûche traditionnelle à volume égal' },
    { label: 'Usage conseillé',    value: 'Cheminée, insert, poêle à bûches — grande autonomie' },
  ]
  return {
    id: nextId(),
    slug: slugify(name),
    name,
    tagline: 'Combustion longue durée, très faible taux d’humidité',
    description: `<p>Ce bois densifié 100 % ${essence} est compressé sans additif ni liant chimique, ce qui lui confère un pouvoir calorifique élevé et une combustion nettement plus longue qu’une bûche classique. Son taux d’humidité très bas (moins de 12 %) garantit un allumage propre et peu de cendres.</p><ul><li>Format compact et calibré, facile à stocker</li><li>Rendement supérieur à volume égal comparé au bois traditionnel</li><li>Conditionnement : ${weightLabel}</li><li>Livraison sur palette filmée, dépose au plus près de votre accès</li></ul>`,
    price,
    original_price: originalPrice,
    stock: 10,
    family: 'bois-de-chauffage',
    subtype: 'bois-densifie',
    specs,
    category_id: cat('cat-densifie').id,
    category: cat('cat-densifie'),
    badge,
    rating: null,
    review_count: 0,
    created_at: '',
  }
}

interface CompresseeInput {
  name: string
  essence: string
  weightLabel: string
  price: number
  originalPrice: number
  badge?: string | null
}

function buildCompressee({ name, essence, weightLabel, price, originalPrice, badge = null }: CompresseeInput): Product {
  const specs: Spec[] = [
    { label: 'Composition',        value: essence },
    { label: 'Conditionnement',    value: weightLabel },
    { label: 'Taux d’humidité', value: '< 10 %' },
    { label: 'Durée de combustion', value: 'Longue durée, braises persistantes' },
    { label: 'Usage conseillé',    value: 'Cheminée, insert, poêle à bûches' },
  ]
  return {
    id: nextId(),
    slug: slugify(name),
    name,
    tagline: 'Bûche compressée haute densité, très peu de résidus',
    description: `<p>Cette bûche de bois compressé est fabriquée à partir de sciures et copeaux compactés à haute pression, sans liant ajouté. Résultat : un combustible dense, très sec (moins de 10 % d’humidité) qui brûle longtemps en laissant peu de cendres.</p><ul><li>Composition : ${essence}</li><li>Conditionnement : ${weightLabel}</li><li>Idéale en complément ou en remplacement de la bûche traditionnelle</li><li>Livraison sur palette filmée</li></ul>`,
    price,
    original_price: originalPrice,
    stock: 14,
    family: 'bois-de-chauffage',
    subtype: 'buche-compressee',
    specs,
    category_id: cat('cat-compressees').id,
    category: cat('cat-compressees'),
    badge,
    rating: null,
    review_count: 0,
    created_at: '',
  }
}

interface GranuleInput {
  name: string
  brandLabel: string
  cert: string
  totalWeightKg: number
  bags: number
  price: number
  originalPrice: number
  badge?: string | null
  blurb: string
}

function buildGranule({ name, brandLabel, cert, totalWeightKg, bags, price, originalPrice, badge = null, blurb }: GranuleInput): Product {
  const bagWeight = Math.round((totalWeightKg / bags) * 10) / 10
  const specs: Spec[] = [
    { label: 'Certification',   value: cert },
    { label: 'Poids du sac',    value: `${bagWeight} kg` },
    { label: 'Nombre de sacs',  value: `${bags} sacs` },
    { label: 'Poids palette',   value: `${totalWeightKg} kg` },
    { label: 'Taux de cendres', value: '< 0,7 % — combustion propre' },
  ]
  return {
    id: nextId(),
    slug: slugify(name),
    name,
    tagline: `${cert} — palette de ${totalWeightKg} kg`,
    description: `<p>${blurb}</p><ul><li>Certification : ${cert}</li><li>Conditionnement : ${bags} sacs de ${bagWeight} kg, soit ${totalWeightKg} kg au total</li><li>Faible taux de cendres pour un poêle ou une chaudière toujours propre</li><li>Livraison sur palette filmée, housse de protection incluse</li></ul>`,
    price,
    original_price: originalPrice,
    stock: 30,
    family: 'granules',
    subtype: 'granule',
    specs,
    category_id: cat('cat-granules').id,
    category: cat('cat-granules'),
    badge,
    rating: null,
    review_count: 0,
    created_at: '',
  }
}

/* ─────────────────────────────────────────────
   BOIS DE CHAUFFAGE — bûches naturelles
   ───────────────────────────────────────────── */
const BUCHES: Product[] = [
  buildBuche({ length: 33, price: 89.9,  originalPrice: 109.9, badge: 'bestseller' }),
  buildBuche({ length: 40, price: 94.9,  originalPrice: 114.9 }),
  buildBuche({ length: 45, price: 99.9,  originalPrice: 119.9 }),
  buildBuche({ length: 50, price: 104.9, originalPrice: 124.9 }),
]

/* ─────────────────────────────────────────────
   BOIS DENSIFIÉ
   ───────────────────────────────────────────── */
const DENSIFIE: Product[] = [
  buildDensifie({
    name: 'Bois densifié — feuillus — 1/2 palette de 538 kg',
    essence: 'feuillus', weightLabel: '1/2 palette de 538 kg',
    price: 229, originalPrice: 269, badge: 'new',
  }),
  buildDensifie({
    name: 'Bois densifié — résineux — palette de 960 kg',
    essence: 'résineux', weightLabel: 'palette de 960 kg',
    price: 339, originalPrice: 399,
  }),
  buildDensifie({
    name: 'Bois densifié — feuillus — palette 1 tonne',
    essence: 'feuillus', weightLabel: 'palette de 1000 kg',
    price: 369, originalPrice: 429, badge: 'bestseller',
  }),
]

/* ─────────────────────────────────────────────
   BÛCHES COMPRESSÉES
   ───────────────────────────────────────────── */
const COMPRESSEES: Product[] = [
  buildCompressee({
    name: 'Bûches compressées 100% feuillus — palette de 1040kg',
    essence: '100 % feuillus compactés', weightLabel: 'palette de 1040 kg',
    price: 319, originalPrice: 379,
  }),
  buildCompressee({
    name: 'Bûches de bois compressé Tecsabuch Crépito (palette de 1t)',
    essence: 'Bois compressé Tecsabuch Crépito', weightLabel: 'palette de 1000 kg',
    price: 299, originalPrice: 349,
  }),
]

/* ─────────────────────────────────────────────
   GRANULÉS & PELLETS
   ───────────────────────────────────────────── */
const GRANULE_DEFS: GranuleInput[] = [
  {
    name: 'Granulés de Bois Belges Badger Pellets — Palette 975kg (65 sacs)',
    brandLabel: 'Badger Pellets', cert: 'ENplus A1', totalWeightKg: 975, bags: 65,
    price: 349, originalPrice: 399,
    blurb: 'Les granulés Badger Pellets sont fabriqués en Belgique à partir de sciures de résineux non traitées. Un pellet dense et homogène, pensé pour un rendement stable dans les poêles comme dans les chaudières automatiques.',
  },
  {
    name: 'Granulés de Bois d’Auvergne Moulin Bois Energie — Palette 975kg (65 sacs)',
    brandLabel: 'Moulin Bois Energie', cert: 'DINplus', totalWeightKg: 975, bags: 65,
    price: 359, originalPrice: 409,
    blurb: 'Produits en Auvergne à partir de résineux locaux, les granulés Moulin Bois Energie associent circuit court et pouvoir calorifique élevé. Un choix apprécié des utilisateurs soucieux de l’origine de leur combustible.',
  },
  {
    name: 'Granulés de Bois Excellent Pellets Premium — Palette 975kg (65 sacs)',
    brandLabel: 'Excellent Pellets', cert: 'ENplus A1', totalWeightKg: 975, bags: 65,
    price: 339, originalPrice: 389,
    blurb: 'Excellent Pellets Premium se distingue par sa faible teneur en fines et son taux de cendres très bas, pour un entretien réduit de votre appareil de chauffage.',
    badge: 'bestseller',
  },
  {
    name: 'Granulés de Bois Français Crépito® Premium — Palette 1080kg (72 sacs)',
    brandLabel: 'Crépito® Premium', cert: 'DIN+ / EN+ A1', totalWeightKg: 1080, bags: 72,
    price: 369, originalPrice: 419,
    blurb: 'Fabriqués en France, les granulés Crépito® Premium offrent un très bon pouvoir calorifique et une combustion régulière, avec une double certification DIN+ et EN+ A1.',
  },
  {
    name: 'Granulés de Bois Français Natural Energie — Palette 1050kg (70 sacs)',
    brandLabel: 'Natural Energie', cert: 'ENplus A1', totalWeightKg: 1050, bags: 70,
    price: 349, originalPrice: 399,
    blurb: 'Natural Energie propose un granulé français issu de sciures de résineux, calibré pour limiter les fines et préserver l’alimentation automatique de votre chaudière.',
  },
  {
    name: 'Granulés de Bois Français Piveteau HP+ — Palette 1080kg (72 sacs)',
    brandLabel: 'Piveteau HP+', cert: 'DINplus / EN+ A1', totalWeightKg: 1080, bags: 72,
    price: 379, originalPrice: 429,
    blurb: 'Piveteau HP+ est un granulé haute performance produit en France, réputé pour sa densité élevée et son faible taux d’humidité, gage d’un rendement thermique optimal.',
    badge: 'bestseller',
  },
  {
    name: 'Granulés de Bois Français SunPower (Triple Certification) — Palette 1050kg',
    brandLabel: 'SunPower', cert: 'ENplus A1 · DINplus · NF Biocombustibles', totalWeightKg: 1050, bags: 70,
    price: 389, originalPrice: 439,
    blurb: 'SunPower cumule trois certifications de qualité, un gage de constance sur toute la palette : faible taux de cendres, faible humidité et pouvoir calorifique élevé.',
  },
  {
    name: 'Granulés de Bois Français Valboval — Palette 975kg (65 sacs)',
    brandLabel: 'Valboval', cert: 'ENplus A1', totalWeightKg: 975, bags: 65,
    price: 319, originalPrice: 379,
    blurb: 'Valboval propose un granulé français au excellent rapport qualité-prix, adapté à un usage quotidien en poêle à granulés.',
  },
  {
    name: 'Granulés de Bois Français Woodstock® Premium — Palette 1170kg (78 sacs)',
    brandLabel: 'Woodstock® Premium', cert: 'ENplus A1', totalWeightKg: 1170, bags: 78,
    price: 409, originalPrice: 459,
    blurb: 'La gamme Woodstock® Premium en grand conditionnement (78 sacs) permet de couvrir une consommation hivernale complète en une seule livraison.',
  },
  {
    name: 'Granulés de Bois Français Woodstock® Premium — Palette 990kg (66 sacs)',
    brandLabel: 'Woodstock® Premium', cert: 'ENplus A1', totalWeightKg: 990, bags: 66,
    price: 359, originalPrice: 409,
    blurb: 'Même qualité Woodstock® Premium que la grande palette, en conditionnement 66 sacs pour les besoins plus modestes ou les espaces de stockage réduits.',
  },
  {
    name: 'Granulés de Bois HELIOS Haute Performance — Palette 975kg (65 sacs)',
    brandLabel: 'Helios Haute Performance', cert: 'ENplus A1', totalWeightKg: 975, bags: 65,
    price: 349, originalPrice: 399,
    blurb: 'Helios Haute Performance mise sur une granulométrie régulière et un séchage optimal pour une alimentation fluide des systèmes automatiques.',
  },
  {
    name: 'Granulés de Bois Naturels Badger Pellets — Palette 990kg (66 sacs)',
    brandLabel: 'Badger Pellets Naturels', cert: 'ENplus A1', totalWeightKg: 990, bags: 66,
    price: 349, originalPrice: 399,
    blurb: 'Version « Naturels » de la gamme Badger Pellets, issue exclusivement de résineux non traités, sans écorce.',
  },
  {
    name: 'Granulés de Bois Premium Allemands Van Roje — Palette 975kg (65 sacs)',
    brandLabel: 'Van Roje', cert: 'ENplus A1', totalWeightKg: 975, bags: 65,
    price: 359, originalPrice: 409,
    blurb: 'Van Roje est un granulé premium d’origine allemande, reconnu pour sa régularité de calibre et sa faible production de fines pendant le transport.',
  },
  {
    name: 'Granulés de Bois Premium TotalEnergies — Palette 990kg (66 sacs)',
    brandLabel: 'TotalEnergies', cert: 'ENplus A1', totalWeightKg: 990, bags: 66,
    price: 369, originalPrice: 419,
    blurb: 'Le granulé premium TotalEnergies offre une combustion stable et un bon pouvoir calorifique, avec une disponibilité fiable tout au long de la saison.',
  },
  {
    name: 'Granulés de Bois Premium TotalEnergies (DIN+/EN+ A1) — Palette 990kg',
    brandLabel: 'TotalEnergies DIN+/EN+ A1', cert: 'DIN+ / EN+ A1', totalWeightKg: 990, bags: 66,
    price: 379, originalPrice: 429,
    blurb: 'Version double-certifiée DIN+ et EN+ A1 du granulé TotalEnergies, pour les foyers qui recherchent la meilleure garantie de qualité disponible sur le marché.',
  },
  {
    name: 'Granulés de Bois Starforest Premium (DINplus) — Palette 1050kg (70 sacs)',
    brandLabel: 'Starforest Premium', cert: 'DINplus', totalWeightKg: 1050, bags: 70,
    price: 359, originalPrice: 409,
    blurb: 'Starforest Premium associe certification DINplus et prix maîtrisé, un bon compromis pour un usage régulier en poêle à granulés.',
  },
  {
    name: 'Granulés de bois Woodstock qualité premium — palette de 78 sacs de 15 kg',
    brandLabel: 'Woodstock Qualité Premium', cert: 'ENplus A1', totalWeightKg: 1170, bags: 78,
    price: 399, originalPrice: 449,
    blurb: 'Grand conditionnement Woodstock en sacs de 15 kg, pratique à manipuler et à stocker, pour une autonomie de chauffage prolongée.',
  },
  {
    name: 'Palette de pellets MM Royal (Royal Pellets) — 78 sacs plastique',
    brandLabel: 'MM Royal Pellets', cert: 'ENplus A1', totalWeightKg: 1170, bags: 78,
    price: 389, originalPrice: 439,
    blurb: 'Royal Pellets propose un granulé régulier conditionné en sacs plastique renforcés, faciles à stocker à l’abri de l’humidité.',
  },
  {
    name: 'Pellets de bois Helios — palette de 65 sacs de 15 kg',
    brandLabel: 'Helios', cert: 'ENplus A1', totalWeightKg: 975, bags: 65,
    price: 349, originalPrice: 399,
    blurb: 'La gamme Helios classique complète l’offre Haute Performance avec un pellet fiable au quotidien, au meilleur rapport qualité-prix.',
  },
]

const GRANULES: Product[] = GRANULE_DEFS.map(buildGranule)

export const PRODUCTS: Product[] = [...BUCHES, ...DENSIFIE, ...COMPRESSEES, ...GRANULES]

export const BOIS_CHAUFFAGE_PRODUCTS = PRODUCTS.filter(p => p.family === 'bois-de-chauffage')
export const GRANULES_PRODUCTS       = PRODUCTS.filter(p => p.family === 'granules')

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find(p => p.slug === slug)
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return PRODUCTS.filter(p => p.family === product.family && p.id !== product.id).slice(0, limit)
}
