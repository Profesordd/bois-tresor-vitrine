export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

export type ProductFamily = 'bois-de-chauffage' | 'granules'
export type ProductSubtype = 'buche' | 'bois-densifie' | 'buche-compressee' | 'granule'

export interface Spec {
  label: string
  value: string
}

export interface Category {
  id: string
  slug: string
  name: string
  family: ProductFamily
  created_at: string
}

export interface Product {
  id: string
  slug: string
  name: string
  tagline: string | null
  description: string | null
  price: number
  original_price: number | null
  stock: number
  family: ProductFamily
  subtype: ProductSubtype
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
