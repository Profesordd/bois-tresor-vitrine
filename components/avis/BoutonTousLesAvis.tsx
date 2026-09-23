'use client'

import { MessageSquareText } from 'lucide-react'
import { useAvisModal } from '@/stores/avis'

/** Ouvre la fenêtre des avis depuis un bloc de page. */
export default function BoutonTousLesAvis({ total }: { total: number }) {
  const { open } = useAvisModal()
  return (
    <button
      onClick={open}
      data-track="Voir tous les avis"
      className="inline-flex items-center gap-2 rounded-lg border-2 border-brand-600 px-5 py-3 text-[15px] font-semibold text-brand-700 hover:bg-brand-50 transition-colors"
    >
      <MessageSquareText size={18} />
      Lire les {total} avis
    </button>
  )
}
