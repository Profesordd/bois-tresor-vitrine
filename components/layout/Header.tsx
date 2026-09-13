'use client'

import Link from 'next/link'
import { ShoppingCart, ChevronDown, Menu, X, Package } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useCartStore } from '@/stores/cart'
import PromoBar from '@/components/ui/PromoBar'

const categories = [
  { label: 'Bûches de chauffage', href: '/produits?categorie=buches-de-chauffage' },
  { label: 'Bois densifié',       href: '/produits?categorie=bois-densifie' },
  { label: 'Bûches compressées',  href: '/produits?categorie=buches-compressees' },
  { label: 'Granulés & pellets',  href: '/produits?categorie=granules-de-bois' },
]

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
      <svg width="30" height="30" viewBox="0 0 36 36" fill="none" aria-hidden>
        <circle cx="12" cy="24" r="7" fill="none" stroke="#9C5F2C" strokeWidth="2.5" />
        <circle cx="22" cy="24" r="7" fill="none" stroke="#9C5F2C" strokeWidth="2.5" />
        <path d="M17 15 C14 11 14 7 17 3 C20 7 20 11 17 15 Z" fill="#DD7A2E" />
        <path d="M17 13 C15.3 10.5 15.3 8 17 5.5 C18.7 8 18.7 10.5 17 13 Z" fill="#F6B26B" />
      </svg>
      <span className="font-serif font-semibold text-xl text-brand-900 group-hover:text-brand-600 transition-colors">
        Bois Trésor
      </span>
    </Link>
  )
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [catOpen, setCatOpen]       = useState(false)
  const [mounted, setMounted]       = useState(false)
  const closeTimer                  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { getTotalItems, setOpen }  = useCartStore()
  const totalItems                  = getTotalItems()

  useEffect(() => { setMounted(true) }, [])

  function openCat()  {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setCatOpen(true)
  }
  function closeCat() {
    closeTimer.current = setTimeout(() => setCatOpen(false), 120)
  }

  return (
    <header className="sticky top-0 z-50 bg-cream border-b border-brand-100 shadow-sm">
      <PromoBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-8">

          <Logo />

          <nav className="hidden md:flex items-center gap-1 flex-1">
            <Link href="/" className="px-3 py-2 text-sm font-medium text-brand-800 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
              Accueil
            </Link>
            <Link href="/produits" className="px-3 py-2 text-sm font-medium text-brand-800 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
              Catalogue
            </Link>

            <div className="relative" onMouseEnter={openCat} onMouseLeave={closeCat}>
              <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-brand-800 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                Catégories <ChevronDown size={15} className={`transition-transform duration-200 ${catOpen ? 'rotate-180' : ''}`} />
              </button>

              {catOpen && <div className="absolute top-full left-0 w-full h-2" />}

              {catOpen && (
                <div
                  className="absolute top-[calc(100%+6px)] left-0 w-64 bg-white border border-brand-100 rounded-2xl shadow-xl py-2 z-50"
                  onMouseEnter={openCat}
                  onMouseLeave={closeCat}
                >
                  {categories.map((c) => (
                    <Link
                      key={c.href}
                      href={c.href}
                      onClick={() => setCatOpen(false)}
                      className="block px-4 py-2.5 text-sm text-brand-800 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/contact" className="px-3 py-2 text-sm font-medium text-brand-800 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
              Contact
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/suivi-commande"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-brand-700 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
            >
              <Package size={16} />
              Suivi
            </Link>

            <button
              onClick={() => setOpen(true)}
              className="relative flex items-center gap-2 px-3 py-2 text-sm font-medium text-brand-800 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
              aria-label="Panier"
            >
              <ShoppingCart size={20} />
              <span>Panier</span>
              {mounted && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-ember-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button onClick={() => setOpen(true)} className="relative p-2 text-brand-800" aria-label="Panier">
              <ShoppingCart size={22} />
              {mounted && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-ember-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
            <button className="p-2 text-brand-700 hover:text-brand-900" onClick={() => setMobileOpen(v => !v)} aria-label="Menu">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-brand-100 bg-white">
          <nav className="flex flex-col py-3 px-4 gap-1">
            <Link href="/" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm font-medium text-brand-800 hover:bg-brand-50 hover:text-brand-600 rounded-lg">Accueil</Link>
            <Link href="/produits" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm font-medium text-brand-800 hover:bg-brand-50 hover:text-brand-600 rounded-lg">Catalogue</Link>
            <Link href="/contact" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm font-medium text-brand-800 hover:bg-brand-50 hover:text-brand-600 rounded-lg">Contact</Link>
            <Link href="/suivi-commande" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-sm font-medium text-brand-800 hover:bg-brand-50 hover:text-brand-600 rounded-lg flex items-center gap-2">
              <Package size={15} /> Suivi de commande
            </Link>
            <p className="px-3 pt-3 pb-1 text-xs font-bold uppercase tracking-wider text-brand-400">Catégories</p>
            <div className="pl-2 flex flex-col gap-0.5">
              {categories.map(c => (
                <Link key={c.href} href={c.href} onClick={() => setMobileOpen(false)} className="px-3 py-2 text-sm text-brand-700 hover:text-brand-600 hover:bg-brand-50 rounded-lg">
                  {c.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
