import Image from 'next/image'

interface Props {
  image: string
  name: string
  className?: string
  priority?: boolean
}

export default function ProductVisual({ image, name, className = '', priority = false }: Props) {
  return (
    <Image
      src={image}
      alt={name}
      fill
      priority={priority}
      className={`object-cover ${className}`}
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
    />
  )
}
