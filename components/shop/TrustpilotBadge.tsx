import { Star } from 'lucide-react'

export default function TrustpilotBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 border border-gray-200 rounded-full px-2.5 py-1">
      <Star size={12} className="fill-brand-500 text-brand-500" />
      Excellent 4,9/5 · 2 184 avis vérifiés
    </span>
  )
}
