import { cn } from '@/lib/utils'

interface BadgeProps {
  variant: 'promo' | 'low-stock' | 'out-of-stock' | 'bestseller' | 'new'
  label?: string
  className?: string
}

export default function Badge({ variant, label, className }: BadgeProps) {
  const variants = {
    promo:        'bg-promo text-white',
    'low-stock':  'bg-amber-500 text-white',
    'out-of-stock': 'bg-brand-400 text-white',
    bestseller:   'bg-ember-500 text-white',
    new:          'bg-brand-500 text-white',
  }

  const defaultLabels = {
    promo:          label ?? 'Promo',
    'low-stock':    'Rupture bientôt',
    'out-of-stock': 'Rupture de stock',
    bestseller:     'Best-seller',
    new:            'Nouveauté',
  }

  return (
    <span
      className={cn(
        'inline-block rounded px-2 py-0.5 text-xs font-700 uppercase tracking-wide',
        variants[variant],
        className
      )}
    >
      {label ?? defaultLabels[variant]}
    </span>
  )
}
