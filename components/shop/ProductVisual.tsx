import type { ProductSubtype } from '@/types/database'

interface Props {
  subtype: ProductSubtype
  className?: string
}

/**
 * Visuel produit générique (illustration SVG originale).
 * Le catalogue de démonstration n'a pas encore de photos produit réelles —
 * ce composant tient lieu de placeholder premium en attendant les vraies
 * photos du client, à intégrer plus tard via `product.images`.
 */
function LogsIcon() {
  return (
    <svg viewBox="0 0 120 120" className="w-1/2 h-1/2" aria-hidden>
      {[0, 1, 2].map((row) => (
        <g key={row} transform={`translate(0 ${row * 30 - 8})`}>
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={26 + i * 34 + (row % 2 === 1 ? 17 : 0)}
              cy={70}
              r="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              opacity={0.9 - row * 0.15}
            />
          ))}
        </g>
      ))}
    </svg>
  )
}

function SackIcon() {
  return (
    <svg viewBox="0 0 120 120" className="w-1/2 h-1/2" aria-hidden>
      <path
        d="M42 20 h36 l6 18 c10 8 14 20 14 34 c0 24 -18 40 -38 40 s-38 -16 -38 -40 c0 -14 4 -26 14 -34 z"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path d="M42 20 l-4 18 M78 20 l4 18" stroke="currentColor" strokeWidth="3" fill="none" />
      <circle cx="60" cy="70" r="3" fill="currentColor" />
      <circle cx="48" cy="82" r="3" fill="currentColor" />
      <circle cx="72" cy="82" r="3" fill="currentColor" />
      <circle cx="60" cy="94" r="3" fill="currentColor" />
    </svg>
  )
}

const SUBTYPE_STYLES: Record<ProductSubtype, { from: string; to: string }> = {
  'buche':            { from: '#E6C299', to: '#9C5F2C' },
  'bois-densifie':    { from: '#D6A468', to: '#7E4A22' },
  'buche-compressee': { from: '#BD7F42', to: '#623A1B' },
  'granule':          { from: '#F6B26B', to: '#BC5F1E' },
}

export default function ProductVisual({ subtype, className = '' }: Props) {
  const { from, to } = SUBTYPE_STYLES[subtype]
  const Icon = subtype === 'granule' ? SackIcon : LogsIcon

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center overflow-hidden text-cream-100 ${className}`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            'repeating-linear-gradient(115deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 2px, transparent 2px, transparent 14px)',
        }}
      />
      <Icon />
    </div>
  )
}
