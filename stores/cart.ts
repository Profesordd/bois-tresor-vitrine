import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Product, CartItem } from '@/types/database'

/**
 * Au-delà de ce délai, une commande commencée puis abandonnée est effacée
 * à la réouverture du site. Retrouver des produits choisis trois semaines
 * plus tôt sans s'en souvenir inquiète plus que ça n'aide — et le prix a
 * pu changer entre-temps.
 */
const DUREE_DE_VIE_MS = 7 * 24 * 60 * 60 * 1000

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  /** Début de la commande en cours, pour en signaler l'ancienneté. */
  startedAt: number | null

  // Actions
  addItem: (product: Product, quantity?: number, options?: { open?: boolean }) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  setOpen: (open: boolean) => void

  // Getters
  getTotalItems: () => number
  getTotalPrice: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      startedAt: null,

      /**
       * `open` est laissé au choix de l'appelant : l'achat direct ajoute le
       * produit juste avant de quitter le site, et faire surgir le tiroir à
       * cet instant produirait un clignotement inutile.
       */
      addItem: (product, quantity = 1, options) => {
        const open = options?.open ?? false
        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id)
          const startedAt = state.startedAt ?? Date.now()

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
              ),
              isOpen: open,
              startedAt,
            }
          }
          return {
            items: [...state.items, { product, quantity }],
            isOpen: open,
            startedAt,
          }
        })
      },

      removeItem: (productId) => {
        set((state) => {
          const items = state.items.filter((i) => i.product.id !== productId)
          return { items, startedAt: items.length === 0 ? null : state.startedAt }
        })
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        }))
      },

      clearCart: () => set({ items: [], startedAt: null }),

      setOpen: (open) => set({ isOpen: open }),

      getTotalItems: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),

      getTotalPrice: () =>
        get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    }),
    {
      name: 'bois-tresor-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items, startedAt: state.startedAt }),

      /* Une commande trop ancienne est écartée au chargement, avant même
         d'être affichée : le client ne doit pas tomber sur un reste dont il
         n'a aucun souvenir. */
      onRehydrateStorage: () => (state) => {
        if (!state?.startedAt) return
        if (Date.now() - state.startedAt > DUREE_DE_VIE_MS) {
          state.items = []
          state.startedAt = null
        }
      },
    }
  )
)
