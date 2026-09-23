import { create } from 'zustand'

interface AvisStore {
  isOpen: boolean
  open: () => void
  close: () => void
}

/**
 * Ouverture de la fenêtre des avis. Un magasin plutôt qu'un contexte : les
 * étoiles sont éparpillées dans des composants serveur (fiche, collection,
 * accueil) qui ne peuvent pas partager d'état React entre eux.
 */
export const useAvisModal = create<AvisStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))
