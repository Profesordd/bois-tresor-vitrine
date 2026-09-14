import { PlayCircle } from 'lucide-react'

/**
 * Emplacement réservé à la vidéo (dépôt / bois / fondateurs), fournie plus tard.
 * Remplacer ce composant par le <video> ou l'iframe une fois la vidéo tournée.
 */
export default function VideoSlot() {
  return (
    <div className="relative aspect-video rounded-2xl bg-ink overflow-hidden flex flex-col items-center justify-center text-center px-6">
      <div
        className="absolute inset-0 opacity-20"
        style={{ background: 'radial-gradient(ellipse at center, #0F8F6B 0%, transparent 70%)' }}
      />
      <PlayCircle size={52} className="text-brand-300 mb-3 relative" strokeWidth={1.4} />
      <p className="text-white font-semibold relative">Notre dépôt en vidéo</p>
      <p className="text-gray-400 text-sm mt-1 relative">
        Voyez notre bois, notre stock et notre équipe — vidéo bientôt disponible.
      </p>
      <span className="absolute top-3 right-3 bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5 rounded border border-dashed border-amber-400">
        emplacement vidéo à fournir
      </span>
    </div>
  )
}
