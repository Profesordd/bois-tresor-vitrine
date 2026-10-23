'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/shop/CartDrawer'

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

  /* Le checkout partenaire est une page de paiement nue : un autre site y
     redirige ses clients, et rien de bois-tresor ne doit y paraître — ni
     logo, ni menu, ni bandeau, ni pied de page. Strictement ce chemin. */
  if (pathname?.startsWith('/commande/partenaire')) {
    return <main className="min-h-screen bg-gray-50">{children}</main>
  }

  return (
    <>
      <Header />
      <CartDrawer />
      <main>{children}</main>
      <Footer />
    </>
  )
}
