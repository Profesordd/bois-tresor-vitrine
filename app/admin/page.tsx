import Link from 'next/link'
import { Inbox, Receipt, Users, BarChart3, ChevronRight } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import RefreshButton from '@/components/admin/RefreshButton'
import CalculateurPartenaire from '@/components/admin/CalculateurPartenaire'
import { journalPartenaire, TAUX_DEFAUT } from '@/lib/partenaire/journal'

/**
 * Accueil du super-admin, volontairement minimal.
 *
 * Trois portes d'entrée : les demandes de contact, le checkout de
 * bois-tresor, le checkout du partenaire. Plus un bouton vers l'analyse,
 * où vivent toutes les statistiques détaillées. Rien d'autre : le reste
 * encombrait sans servir au quotidien.
 */

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Tableau de bord' }

/** Minuit à Paris. Le serveur tourne en UTC. */
function minuitParis(): string {
  const now = new Date()
  const paris = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
  const ecart = now.getTime() - paris.getTime()
  paris.setHours(0, 0, 0, 0)
  return new Date(paris.getTime() + ecart).toISOString()
}

async function messagesEnAttente(): Promise<number> {
  const supabase = createAdminClient()
  const { count } = await supabase.from('contact_messages')
    .select('id', { count: 'exact', head: true }).eq('handled', false)
  return count ?? 0
}

/** Ventes payées du jour pour un canal. */
async function ventesDuJour(canal: 'site' | 'partenaire'): Promise<{ n: number; ca: number }> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('commandes')
    .select('montant_cents')
    .eq('statut', 'payee').eq('canal', canal)
    .gte('created_at', minuitParis()).limit(2000)
  const d = data ?? []
  return { n: d.length, ca: d.reduce((s, c) => s + Number(c.montant_cents), 0) }
}

export default async function AdminAccueil() {
  const [messages, site, partenaire, journal] = await Promise.all([
    messagesEnAttente(),
    ventesDuJour('site'),
    ventesDuJour('partenaire'),
    journalPartenaire(),
  ])

  const PORTES = [
    {
      href: '/admin/commandes/',
      icon: Receipt,
      titre: 'Checkout Bois Tresor',
      chiffre: `${site.n} vente${site.n > 1 ? 's' : ''} aujourd’hui`,
      detail: formatPrice(site.ca / 100),
      accent: 'text-brand-600',
    },
    {
      href: '/admin/partenaire/',
      icon: Users,
      titre: 'Checkout partenaire',
      chiffre: `${partenaire.n} vente${partenaire.n > 1 ? 's' : ''} aujourd’hui`,
      detail: formatPrice(partenaire.ca / 100),
      accent: 'text-amber-600',
    },
    {
      href: '/admin/messages/',
      icon: Inbox,
      titre: 'Demandes de contact',
      chiffre: messages > 0 ? `${messages} en attente` : 'Rien en attente',
      detail: messages > 0 ? 'À traiter' : '—',
      accent: messages > 0 ? 'text-red-600' : 'text-gray-400',
    },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">Tableau de bord</h1>
        <div className="flex items-center gap-3">
          <RefreshButton label="Actualiser" />
          <a href="/admin/deconnexion/" className="text-sm text-gray-500 hover:text-gray-800">Se déconnecter</a>
        </div>
      </div>

      <div className="space-y-3">
        {PORTES.map((p) => {
          const Icone = p.icon
          return (
            <Link
              key={p.href}
              href={p.href}
              className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 hover:border-brand-400 hover:shadow-sm transition-all"
            >
              <span className="flex-shrink-0 w-11 h-11 rounded-lg bg-gray-50 flex items-center justify-center">
                <Icone size={22} className={p.accent} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink">{p.titre}</p>
                <p className="text-[13px] text-gray-500">{p.chiffre}</p>
              </div>
              <span className="text-lg font-bold text-ink whitespace-nowrap">{p.detail}</span>
              <ChevronRight size={18} className="text-gray-300 flex-shrink-0" />
            </Link>
          )
        })}
      </div>

      <Link
        href="/admin/analyse/"
        className="mt-6 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-5 text-gray-700 font-medium hover:border-gray-400 hover:text-ink transition-colors"
      >
        <BarChart3 size={20} /> Voir l’analyse complète
      </Link>

      <div className="mt-8">
        <CalculateurPartenaire lignes={journal} tauxDefaut={TAUX_DEFAUT} />
      </div>
    </div>
  )
}
