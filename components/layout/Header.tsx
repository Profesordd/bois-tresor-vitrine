'use client'

import Link from 'next/link'
import { ShoppingCart, Menu, X, Package } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useCartStore } from '@/stores/cart'
import PromoBar from '@/components/ui/PromoBar'

const categories = [
  { label: 'Bois de chauffage',  href: '/produits?categorie=bois-de-chauffage' },
  { label: 'Granulés & pellets', href: '/produits?categorie=granules-et-pellets' },
]

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
      <svg width="30" height="30" viewBox="0 0 36 36" fill="none" aria-hidden>
        <path d="M18 30 C10 30 6 25 6 19 C6 13 10 9 12 5 C11 10 14 11 14 15 C14 18 16 15 16 12 C19 15 22 15 22 21 C22 27 26 22 25 17 C29 20 30 24 30 27 C30 29 26 30 18 30 Z" fill="#0F8F6B" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-serif font-semibold text-xl text-ink group-hover:text-brand-600 transition-colors">
          Bois Émeraude
        </span>
        <span className="text-[10px] uppercase tracking-widest text-gray-400">Maison du feu de bois</span>
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
