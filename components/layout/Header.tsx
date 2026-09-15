'use client'

import Link from 'next/link'
import { ShoppingCart, Menu, X, Package } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useCartStore } from '@/stores/cart'
import PromoBar from '@/components/ui/PromoBar'

const categories = [
  { label: 'Bois de chauffage',  href: '/produits?categorie=bois-de-chauffage' },
  { label: 'Bois densifié',      href: '/produits?categorie=bois-densifie' },
  { label: 'Granulés & pellets', href: '/produits?categorie=granules-et-pellets' },
]

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-1.5 group flex-shrink-0">
      <span className="font-sans font-semibold text-xl tracking-tight" style={{ color: '#5B3A29' }}>
        Bois
      </span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="-mx-0.5">
        <path d="M12 3 C7 6 5 10 5 14 C5 18.4 8.1 21 12 21 C15.9 21 19 18.4 19 14 C19 10 17 6 12 3 Z" fill="none" stroke="#3E7A3E" strokeWidth="1.6" />
        <path d="M12 20 V9 M12 13 C10 13 8.5 12.2 7.5 11" fill="none" stroke="#3E7A3E" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className="font-sans font-semibold text-xl tracking-tight" style={{ color: '#3E7A3E' }}>
        Tresor
      </span>
    </Link>
  )
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted]       = useState(false)
  const { getTotalItems, setOpen }  = useCartStore()
  const totalItems                  = getTotalItems()

  useEffect(() => { setMounted(true) }, [])

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <PromoBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-8">

          <Logo />

          <nav className="hidden md:flex items-center gap-1 flex-1">
            <Link href="/" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
              Accueil
            </Link>
            {categories.map((c) => (
              <Link key={c.href} href={c.href} className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                {c.label}
              </Link>
            ))}
            <Link href="/a-propos" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
              Qui sommes-nous
            </Link>
            <Link href="/contact" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
              Contact
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/suivi-commande"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
            >
              <Package size={16} />
              Suivi
            </Link>

            <button
              onClick={() => setOpen(true)}
              className="relative flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
              aria-label="Panier"
            >
              <ShoppingCart size={20} />
              <span>Panier</span>
              {mounted && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button onClick={() => setOpen(true)} className="relative p-2 text-gray-700" aria-label="Panier">
              <ShoppingCart size={22} />
              {mounted && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900" onClick={() => setMobileOpen(v => !v)} aria-label="Menu">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <nav className="flex flex-col py-3 px-4 gap-1">
            <Link href="/" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-600 rounded-lg">Accueil</Link>
            {categories.map(c => (
              <Link key={c.href} href={c.href} onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-600 rounded-lg">
                {c.label}
              </Link>
            ))}
            <Link href="/a-propos" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-600 rounded-lg">Qui sommes-nous</Link>
            <Link href="/contact" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-600 rounded-lg">Contact</Link>
            <Link href="/suivi-commande" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-600 rounded-lg flex items-center gap-2">
              <Package size={15} /> Suivi de commande
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
