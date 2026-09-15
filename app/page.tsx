import Link from 'next/link'
import Image from 'next/image'
import { Flame, Droplets, Truck } from 'lucide-react'
import { BOIS_CHAUFFAGE_PRODUCTS, GRANULES_PRODUCTS } from '@/lib/products'
import ProductGrid from '@/components/shop/ProductGrid'
import StarRating from '@/components/shop/StarRating'
import Testimonials from '@/components/shop/Testimonials'
import FamilyBlock from '@/components/ui/FamilyBlock'
import UrgencyNote from '@/components/ui/UrgencyNote'
import LivraisonBelgique from '@/components/ui/LivraisonBelgique'

/**
 * Chiffres clés repris tels quels du site en production du client
 * (bois-tresor.com), à la demande explicite du client.
 */
const KEY_FIGURES = [
  { value: '12 000+', label: 'stères livrés' },
  { value: '≤ 20 %',   label: 'd’humidité garantie' },
  { value: '4,9/5',    label: 'de satisfaction client' },
  { value: '48 h',     label: 'd’expédition moyenne' },
]

const STRENGTHS = [
  {
    icon: Flame,
    title: 'D’où vient notre bois',
    desc: '100 % bois français, feuillus durs : chêne, charme, hêtre et frêne. Nous le préparons nous-mêmes.',
  },
  {
    icon: Droplets,
    title: 'Comment il est séché',
    desc: 'Séché 18 à 24 mois, jusqu’à moins de 20 % d’humidité. Un bois sec chauffe vraiment et ne fume pas.',
  },
  {
    icon: Truck,
    title: 'Comment il arrive chez vous',
    desc: 'Palettisé, filmé et déposé au plus près de votre stockage. Livraison offerte dès 89 € d’achat.',
  },
]

export default function HomePage() {
  /* 4 produits par famille : la page d'accueil donne un aperçu, le choix
     complet se fait sur la page de collection. */
  const boisChauffageHighlights = BOIS_CHAUFFAGE_PRODUCTS.slice(0, 4)
  const granulesHighlights      = GRANULES_PRODUCTS.slice(0, 4)

  return (
    <>
      {/* ── HERO ── */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-ink">
        <Image
          src="/hero-bois.jpg"
          alt="Feu de bois dans une cheminée en pierre"
          fill
          priority
          className="object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/20" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center text-white">
          <p className="text-brand-300 font-semibold text-base sm:text-lg mb-4">
            Entreprise familiale française — Jean-Paul &amp; Julien
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Du bois de chauffage sec, prêt à brûler.
          </h1>
          <p className="text-lg sm:text-xl mb-10 text-gray-200 max-w-2xl mx-auto">
            Moins de 20 % d’humidité : notre bois chauffe vraiment et ne fume pas.
            Livraison offerte dès 89 € d’achat, paiement sécurisé.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link
              href="/product-category/bois-de-chauffage/"
              className="inline-block bg-brand-500 hover:bg-brand-400 text-white px-8 py-4 rounded-lg text-base font-semibold transition-colors shadow-lg"
            >
              Découvrir la collection
            </Link>
            <Link
              href="/product-category/granules-et-pellets/"
              className="inline-block bg-white hover:bg-gray-100 text-brand-800 border-2 border-white px-8 py-4 rounded-lg text-base font-semibold transition-colors"
            >
              Granulés & pellets
            </Link>
          </div>

          <StarRating tone="dark" size={14} className="justify-center" />
        </div>
      </section>

      {/* ── Visiteur belge : message leve-doute, placé haut ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 empty:pt-0">
        <LivraisonBelgique />
      </div>

      {/* ── CHIFFRES CLÉS ── */}
      <section className="border-b border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {KEY_FIGURES.map((f) => (
              <div key={f.label}>
                <p className="font-serif text-2xl sm:text-4xl font-bold text-ink">{f.value}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUI NOUS SOMMES (message n°1 du persona) ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <FamilyBlock />
      </section>

      {/* ── COLLECTION BOIS DE CHAUFFAGE ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="font-serif text-3xl font-bold text-ink">Bois de chauffage</h2>
            <p className="text-gray-500 mt-1">Mélange de feuillus durs et 100 % hêtre</p>
          </div>
          <Link href="/product-category/bois-de-chauffage/" className="text-brand-600 hover:text-brand-700 font-medium text-sm hidden sm:block whitespace-nowrap">
            Voir tout →
          </Link>
        </div>
        <ProductGrid products={boisChauffageHighlights} columns={4} />
      </section>

      {/* ── 3 POINTS FORTS ── */}
      <section className="bg-brand-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STRENGTHS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Icon size={26} className="text-brand-600" />
                </div>
                <div>
                  <h3 className="font-bold text-ink mb-2 text-lg">{title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GRANULÉS & PELLETS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="font-serif text-3xl font-bold text-ink">Granulés & pellets</h2>
            <p className="text-gray-500 mt-1">Certifiés EN+ A1 ou DINplus selon les marques</p>
          </div>
          <Link href="/product-category/granules-et-pellets/" className="text-brand-600 hover:text-brand-700 font-medium text-sm hidden sm:block whitespace-nowrap">
            Voir tout →
          </Link>
        </div>
        <ProductGrid products={granulesHighlights} columns={4} />
      </section>

      {/* ── URGENCE CRÉDIBLE ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <UrgencyNote />
      </section>

      {/* ── PRÊT POUR L'HIVER ── */}
      <section className="bg-ink py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-3">Prêt pour l’hiver</h2>
          <p className="text-brand-300 text-lg mb-6">Un feu d’exception commence par un bois d’exception.</p>
          <p className="text-gray-300 mb-10">
            Palettes à partir de 89,00 € — livraison offerte dès 89 € d’achat, paiement 100 % sécurisé, expédition sous 48 h.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/product-category/bois-de-chauffage/" className="inline-block bg-brand-500 hover:bg-brand-400 text-white px-7 py-3 rounded-lg font-semibold transition-colors">
              Bois de chauffage →
            </Link>
            <Link href="/product-category/granules-et-pellets/" className="inline-block bg-white/10 hover:bg-white/20 border border-white/30 text-white px-7 py-3 rounded-lg font-semibold transition-colors">
              Granulés & Pellets →
            </Link>
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ── */}
      <Testimonials />

      {/* ── À PROPOS ── */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-serif text-2xl font-bold text-ink mb-4">Bois Tresor</h2>
          <p className="text-gray-600 leading-relaxed">
            La maison française du bois de chauffage haut de gamme : bûches de feuillus durs
            séchées à cœur et granulés certifiés EN+ A1, sélectionnés avec exigence et livrés
            partout en France.
          </p>
        </div>
      </section>
    </>
  )
}
