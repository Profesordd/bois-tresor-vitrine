export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

export type ProductFamily = 'bois-de-chauffage' | 'bois-densifie' | 'granules' | 'jardin'
export type ProductSubtype = 'buche' | 'bois-densifie' | 'buche-compressee' | 'granule' | 'herbicide'

export interface Spec {
  label: string
  value: string
}

export interface Category {
  id: string
  slug: string
  name: string
  /** Libellé abrégé, pour les pastilles de filtre sur téléphone. */
  shortName?: string
  family: ProductFamily
  /**
   * Catégorie accessible par son URL seulement : absente du menu, des
   * filtres, du « tout voir », des produits liés et de l'accueil.
   */
  hidden?: boolean
  created_at: string
}

/**
 * Format de vente d'un produit vendu par lot : un lot = un identifiant de
 * checkout, un multiplicateur et un prix, comme un produit à part entière.
 */
export interface Lot {
  /** Identifiant court, utilisé dans l'URL (`?lot=20`) et le panier. */
  id: string
  sacs: number
  /** Poids total, tel qu'affiché : « 300 kg ». */
  poids: string
  /** Libellé si « N sacs » ne suffit pas : « Palette complète · 134 sacs ». */
  label?: string
  price: number
  /** null tant que le produit Shopify n'existe pas : le lot est alors masqué. */
  variantId: string | null
  checkoutMultiplier: number
}

export interface Product {
  id: string
  slug: string
  name: string
  tagline: string | null
  description: string | null
  price: number
  original_price: number | null
  /**
   * Prix ramené au stère, pour le bois en bûches uniquement (`null` sinon).
   * Le prix à la palette ne dit rien à qui a toujours acheté au stère :
   * cette ligne rend les palettes comparables entre elles.
   */
  pricePerStere: number | null
  stock: number
  family: ProductFamily
  subtype: ProductSubtype
  image: string
  /** Points clés courts, un sujet par ligne, dans l'ordre de priorité du persona. */
  keyPoints: string[]
  /**
   * Affiche `description` en bloc « Description » sur la fiche. Par défaut
   * elle n'est pas montrée : les points clés suffisent au persona, et les
   * descriptions du catalogue d'origine ne font que les répéter.
   */
  richDescription?: boolean
  /** Formats de vente. Présent = fiche à choix de lot, sans quantité libre. */
  lots?: Lot[]
  /** Lot présélectionné sur la fiche. */
  defaultLotId?: string
  /** Sur un produit dérivé d'un lot (panier, checkout) : le lot choisi. */
  lot?: Lot
  /**
   * Produit accessible par son URL seulement : absent de la collection, de
   * l'accueil et des produits liés. Sert aux tests A/B — deux fiches du
   * même produit, chacune avec sa campagne.
   */
  unlisted?: boolean
  /**
   * Slug de la fiche de référence, pour le lien canonique. Deux fiches au
   * même contenu se cannibalisent sinon dans les résultats de recherche.
   */
  canonicalOf?: string
  /**
   * Offre à durée et quantité limitées.
   *
   * Les deux valeurs doivent être vraies : le compte à rebours vise une
   * date réelle, identique pour tous les visiteurs, et ne se réinitialise
   * jamais. Passée cette date, ou une fois les lots écoulés, la fiche ne
   * vend plus — sans quoi le site annoncerait une limite qu'il ne tient
   * pas, ce qui est précisément ce qui fait fuir ce public (et une
   * pratique commerciale trompeuse).
   */
  offre?: {
    /** Fin de l'offre, en ISO 8601 avec fuseau : '2026-09-30T23:59:00+02:00'. */
    finAt: string
    /** Nombre de lots encore disponibles à ce prix. */
    lotsRestants: number
  }
  /**
   * Identifiant de variante du checkout. `null` = produit pas encore
   * commandable en ligne (identifiant non fourni).
   */
  variantId: string | null
  /**
   * Multiplicateur de quantité imposé par le processeur de paiement :
   * la quantité envoyée au checkout vaut quantité choisie × ce nombre.
   * Ne jamais envoyer la quantité brute.
   */
  checkoutMultiplier: number | null
  specs: Spec[]
  category_id: string | null
  badge: string | null
  rating: number | null
  review_count: number | null
  created_at: string
  category?: Category
}

export interface Order {
  id: string
  status: OrderStatus
  total: number
  customer_email: string
  customer_name: string
  customer_phone: string | null
  shipping_address: ShippingAddress
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
}

export interface ShippingAddress {
  street: string
  city: string
  postal_code: string
  country: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  quantity: number
  price: number
  product_name: string
  product?: Product
}

export type ProductInsert = Omit<Product, 'id' | 'created_at' | 'category'>
export type OrderInsert = Omit<Order, 'id' | 'created_at' | 'updated_at' | 'order_items'>
export type OrderItemInsert = Omit<OrderItem, 'id' | 'product'>

export interface CartItem {
  product: Product
  quantity: number
}
