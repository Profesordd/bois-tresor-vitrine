'use client'

import { MessageSquareText } from 'lucide-react'
import { useAvisModal } from '@/stores/avis'
import { REVIEW_COUNT } from '@/lib/reviews'
import AvisModal from '@/components/avis/AvisModal'
import BandeauAvis from '@/components/avis/BandeauAvis'

/** Les éléments cliquables de l'aperçu, et la fenêtre qu'ils ouvrent. */
export default function ApercuAvisInteractif() {
  const { open } = useAvisModal()
  return (
    <>
      <div className="max-w-md mb-4"><BandeauAvis /></div>
      <button
        onClick={open}
        className="inline-flex items-center gap-2 rounded-lg border-2 border-brand-600 px-5 py-3 text-[15px] font-semibold text-brand-700 hover:bg-brand-50 transition-colors"
      >
        <MessageSquareText size={18} />
        Lire les {REVIEW_COUNT} avis
      </button>
      <AvisModal />
    </>
  )
}
