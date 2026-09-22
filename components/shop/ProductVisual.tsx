import Image from 'next/image'

interface Props {
  image: string
  name: string
  className?: string
  priority?: boolean
  /** 'contain' pour un objet détouré (bidon, flacon) : le recadrage coupe le produit. */
  fit?: 'cover' | 'contain'
}

export default function ProductVisual({ image, name, className = '', priority = false, fit = 'cover' }: Props) {
  return (
    <Image
      src={image}
      alt={name}
      fill
      priority={priority}
      className={`${fit === 'contain' ? 'object-contain p-3' : 'object-cover'} ${className}`}
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
    />
  )
}
