import Link from 'next/link'
import { Axe, Sun, Truck } from 'lucide-react'
import { BOIS_CHAUFFAGE_PRODUCTS, GRANULES_PRODUCTS } from '@/lib/products'
import ProductGrid from '@/components/shop/ProductGrid'
import ReviewsSection from '@/components/ui/ReviewsSection'
import NewsletterForm from '@/components/ui/NewsletterForm'

/**
 * Chiffres clés — VALEURS D'EXEMPLE pour l'aperçu visuel.
 * À remplacer par les vraies statistiques du client avant mise en production.
 */
const KEY_FIGURES = [
  { value: '2 500+', label: 'stères livrés' },
  { value: '< 20 %',  label: 'taux d’humidité garanti' },
  { value: '48–72 h', label: 'délai d’expédition' },
]

const STRENGTHS = [
  {
    icon: Axe,
    title: 'Sélection rigoureuse',
    desc: 'Feuillus durs (chêne, charme, hêtre) choisis pour leur pouvoir calorifique et leur combustion longue durée.',
  },
  {
    icon: Sun,
    title: 'Séchage maîtrisé',
    desc: 'Bois séché à cœur, taux d’humidité contrôlé sous les 20 % — allumage facile, moins de fumée, moins de résidus.',
  },
  {
    icon: Truck,
    title: 'Livraison soignée',
    desc: 'Expédition sur palette filmée, livraison offerte dès 150 € d’achat en France métropolitaine.',
  },
]

export default function HomePage() {
  const boisChauffageHighlights = BOIS_CHAUFFAGE_PRODUCTS.slice(0, 8)
  const granulesHighlights      = GRANULES_PRODUCTS.slice(0, 8)

  return (
    <>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-brand-900">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            background: 'radial-gradient(ellipse 70% 60% at 30% 20%, #DD7A2E 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 80%, #9C5F2C 0%, transparent 60%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'repeating-linear-gradient(100deg, #fff 0px, #fff 1px, transparent 1px, transparent 18px)',
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <p className="text-ember-300 text-sm font-semibold uppercase tracking-widest mb-4">
              Bois de chauffage & granulés premium
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-white">
              Un feu qui dure,<br className="hidden sm:block" /> un bois qui le mérite
            </h1>
            <p className="text-lg sm:text-xl mb-10 text-brand-100 font-light max-w-xl mx-auto lg:mx-0">
              Feuillus durs séchés à cœur, taux d’humidité contrôlé sous les 20 %.
              Une chaleur intense, une combustion propre, livrées chez vous.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/produits"
                className="inline-block bg-ember-500 hover:bg-ember-600 text-white px-8 py-4 rounded-lg text-base font-semibold transition-colors shadow-lg"
              >
                Voir la collection
              </Link>
              <Link
                href="/produits?categorie=granules-de-bois"
                className="inline-block bg-white/10 hover:bg-white/20 backdrop-blur border border-white/30 text-white px-8 py-4 rounded-lg text-base font-semibold transition-colors"
              >
                Nos granulés
              </Link>
            </div>
          </div>

          {/* Illustration foyer — 100% originale (SVG/CSS, aucune photo tierce) */}
          <div className="relative aspect-square max-w-md mx-auto w-full rounded-3xl overflow-hidden shadow-2xl">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #452812, #2A180A)' }} />
            <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full">
              {/* Bûches */}
              <g transform="translate(0 30)">
                {[0, 1, 2, 3].map((i) => (
                  <circle key={i} cx={40 + i * 30} cy={150} r="17" fill="none" stroke="#D6A468" strokeWidth="4" opacity={0.9} />
                ))}
                {[0, 1, 2].map((i) => (
                  <circle key={`b-${i}`} cx={55 + i * 30} cy={122} r="17" fill="none" stroke="#BD7F42" strokeWidth="4" opacity={0.95} />
                ))}
              </g>
              {/* Flamme */}
              <path d="M100 40 C80 70 78 95 100 118 C122 95 120 70 100 40 Z" fill="#F6B26B" opacity="0.95" />
              <path d="M100 62 C88 80 87 96 100 112 C113 96 112 80 100 62 Z" fill="#EE9145" />
              <path d="M100 82 C94 92 94 100 100 108 C106 100 106 92 100 82 Z" fill="#FBF6EE" opacity="0.9" />
            </svg>
          </div>
        </div>
      </section>

      {/* ── CHIFFRES CLÉS ── */}
      <section className="border-b border-brand-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-3 gap-6 text-center">
            {KEY_FIGURES.map((f) => (
              <div key={f.label}>
                <p className="font-serif text-2xl sm:text-4xl font-bold text-brand-800">{f.value}</p>
                <p className="text-xs sm:text-sm text-brand-500 mt-1">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COLLECTION BOIS DE CHAUFFAGE ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="font-serif text-3xl font-bold text-brand-900">Collection bois de chauffage</h2>
            <p className="text-brand-500 mt-1">Bûches, bois densifié et bûches compressées</p>
          </div>
          <Link href="/produits?categorie=buches-de-chauffage" className="text-brand-600 hover:text-brand-700 font-medium text-sm hidden sm:block whitespace-nowrap">
            Voir tout →
          </Link>
        </div>
        <ProductGrid products={boisChauffageHighlights} />
      </section>

      {/* ── 3 POINTS FORTS ── */}
      <section className="bg-brand-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STRENGTHS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Icon size={26} className="text-brand-600" />
                </div>
                <div>
                  <h3 className="font-bold text-brand-900 mb-2 text-lg">{title}</h3>
                  <p className="text-brand-600 text-sm leading-relaxed">{desc}</p>
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
            <h2 className="font-serif text-3xl font-bold text-brand-900">Granulés & pellets</h2>
            <p className="text-brand-500 mt-1">Certifiés ENplus A1 ou DINplus selon les marques</p>
          </div>
          <Link href="/produits?categorie=granules-de-bois" className="text-brand-600 hover:text-brand-700 font-medium text-sm hidden sm:block whitespace-nowrap">
            Voir tout →
          </Link>
        </div>
        <ProductGrid products={granulesHighlights} />
      </section>

      {/* ── AVIS CLIENTS ── */}
      <ReviewsSection />

      {/* ── NEWSLETTER ── */}
      <section className="relative overflow-hidden py-20 bg-brand-900">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-ember-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-ember-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight font-serif">
            Restez informé pour l’hiver
          </h2>
          <p className="text-brand-200 text-base mb-10 max-w-lg mx-auto">
            Conseils de stockage, disponibilités de saison et offres ponctuelles — pas de spam.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </>
  )
}
