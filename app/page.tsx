import Link from 'next/link'
import Image from 'next/image'
import { Star, Flame, Droplets, Truck } from 'lucide-react'
import { BOIS_CHAUFFAGE_PRODUCTS, GRANULES_PRODUCTS } from '@/lib/products'
import ProductGrid from '@/components/shop/ProductGrid'
import NewsletterForm from '@/components/ui/NewsletterForm'

/**
 * Chiffres clés et avis — repris tels quels du site en production du
 * client (bois-tresor.com), à la demande explicite du client.
 */
const KEY_FIGURES = [
  { value: '12 000+', label: 'stères livrés' },
  { value: '≤ 20 %',   label: 'd’humidité garantie' },
  { value: '4,9/5',    label: 'de satisfaction client' },
  { value: '48 h',     label: 'd’expédition moyenne' },
]

const STRENGTHS = [
  { icon: Flame,    title: 'Sélection exigeante', desc: 'Feuillus durs — chêne, charme, hêtre et frêne — choisis auprès des meilleures scieries françaises.' },
  { icon: Droplets, title: 'Séchage à cœur',       desc: 'Taux d’humidité garanti sous les 20 % pour un allumage facile et un rendement maximal.' },
  { icon: Truck,    title: 'Livraison soignée',    desc: 'Palettisé, filmé et déposé chez vous, offert partout en France métropolitaine.' },
]

const TESTIMONIALS = [
  { initials: 'PL', name: 'Pierre L.',    text: 'Livré en 5 jours, bois très sec et propre. Brûle parfaitement dans ma cheminée. Je recommande Bois Tresor.' },
  { initials: 'MD', name: 'Marie D.',     text: 'Les granulés sont de très bonne qualité, mon poêle fonctionne au top. Rapport qualité-prix imbattable.' },
  { initials: 'JB', name: 'Jean-Marc B.', text: 'Commande reçue en 4 jours, palette bien emballée. Le bois est sec et calibré. Deuxième commande chez eux.' },
  { initials: 'CR', name: 'Catherine R.', text: 'Bûches densifiées de qualité, faciles à stocker. Un peu plus cher qu’en grande surface mais la qualité est là.' },
  { initials: 'FM', name: 'François M.',  text: '3ème hiver avec Bois Tresor. Toujours la même qualité, toujours ponctuel. Les allume-feux sont top aussi.' },
  { initials: 'ST', name: 'Sophie T.',    text: 'Enfin un fournisseur sérieux avec du vrai bois français. Pas de surprises, tout est conforme à la description.' },
]

export default function HomePage() {
  const boisChauffageHighlights = BOIS_CHAUFFAGE_PRODUCTS.slice(0, 8)
  const granulesHighlights      = GRANULES_PRODUCTS.slice(0, 8)

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
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Le bois de chauffage, dans sa plus belle expression.
          </h1>
          <p className="text-lg sm:text-xl mb-10 text-gray-200 font-light max-w-2xl mx-auto">
            Bûches de feuillus durs séchées à cœur et granulés certifiés EN+ A1, sélectionnés
            auprès des meilleures scieries et livrés partout en France, palettisés et soignés
            — livraison offerte pour votre première commande.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link
              href="/produits?categorie=bois-de-chauffage"
              className="inline-block bg-brand-500 hover:bg-brand-400 text-white px-8 py-4 rounded-lg text-base font-semibold transition-colors shadow-lg"
            >
              Découvrir la collection
            </Link>
            <Link
              href="/produits?categorie=granules-et-pellets"
              className="inline-block bg-white/10 hover:bg-white/20 backdrop-blur border border-white/30 text-white px-8 py-4 rounded-lg text-base font-semibold transition-colors"
            >
              Granulés & pellets
            </Link>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-sm text-gray-200">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} className="fill-brand-400 text-brand-400" />)}
            </div>
            <span>Excellent 4,9/5 · 2 184 avis vérifiés</span>
          </div>
        </div>
      </section>

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

      {/* ── COLLECTION BOIS DE CHAUFFAGE ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="font-serif text-3xl font-bold text-ink">Bois de chauffage</h2>
            <p className="text-gray-500 mt-1">Mélange de feuillus durs et 100 % hêtre</p>
          </div>
          <Link href="/produits?categorie=bois-de-chauffage" className="text-brand-600 hover:text-brand-700 font-medium text-sm hidden sm:block whitespace-nowrap">
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
          <Link href="/produits?categorie=granules-et-pellets" className="text-brand-600 hover:text-brand-700 font-medium text-sm hidden sm:block whitespace-nowrap">
            Voir tout →
          </Link>
        </div>
        <ProductGrid products={granulesHighlights} />
      </section>

      {/* ── PRÊT POUR L'HIVER ── */}
      <section className="bg-ink py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-3">Prêt pour l’hiver</h2>
          <p className="text-brand-300 text-lg mb-6">Un feu d’exception commence par un bois d’exception.</p>
          <p className="text-gray-300 mb-10">
            Palettes à partir de 89,00 € — livraison offerte pour votre première commande, paiement 100 % sécurisé, expédition sous 48 h.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/produits?categorie=bois-de-chauffage" className="inline-block bg-brand-500 hover:bg-brand-400 text-white px-7 py-3 rounded-lg font-semibold transition-colors">
              Bois de chauffage →
            </Link>
            <Link href="/produits?categorie=granules-et-pellets" className="inline-block bg-white/10 hover:bg-white/20 border border-white/30 text-white px-7 py-3 rounded-lg font-semibold transition-colors">
              Granulés & Pellets →
            </Link>
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ── */}
      <section className="py-16 bg-brand-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl font-bold text-ink mb-2">Ils nous font confiance</h2>
            <p className="text-brand-700 font-medium">Excellent 4,9/5 · 2 184 avis vérifiés</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} className="fill-brand-500 text-brand-500" />)}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">{t.text}</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {t.initials}
                  </div>
                  <span className="text-sm font-semibold text-ink">{t.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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

      {/* ── NEWSLETTER ── */}
      <section className="relative overflow-hidden py-20 bg-ink">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight font-serif">
            Restez informé pour l’hiver
          </h2>
          <p className="text-gray-300 text-base mb-10 max-w-lg mx-auto">
            Conseils de stockage, disponibilités de saison et offres ponctuelles — pas de spam.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </>
  )
}
