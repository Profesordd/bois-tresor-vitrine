'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/shop/CartDrawer'
import AvisModal from '@/components/avis/AvisModal'

/**
 * Habillage du site public.
 *
 * L'espace d'administration en est exclu : le bandeau promotionnel, le menu
 * boutique et le panier n'y ont rien à faire, et gênent la lecture des
 * statistiques.
 */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')

  if (isAdmin) {
    return <main className="min-h-screen bg-gray-50">{children}</main>
  }

  return (
    <>
      <Header />
      <CartDrawer />
      <AvisModal />
      <main>{children}</main>
      <Footer />
    </>
  )
}
