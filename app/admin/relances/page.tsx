import Link from 'next/link'
import { ArrowLeft, Send, AlertTriangle } from 'lucide-react'
import { composer, DELAIS_HEURES, NB_ETAPES, type LeadRelance } from '@/lib/emails/relances'
import { emailConfigure } from '@/lib/emails/envoi'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Les relances' }

/* Un destinataire fictif, uniquement pour l'aperçu. Rien n'est envoyé. */
const EXEMPLE: LeadRelance = {
  id: 'apercu',
  email: 'client@exemple.fr',
  produit_slug: 'granules-de-bois-limouzi-palette-de-134-sacs-de-15-kg',
  produit_nom: 'Granulés de bois Limouzi – sacs de 15 kg — 30 sacs (450 kg)',
  montant: 59.97,
}

function delai(heures: number): string {
  if (heures < 24) return `${heures} h après le clic`
  return `J+${heures / 24}`
}

/** Combien de relances sont parties, par étape. */
async function compter(): Promise<{ parEtape: Map<number, number>; echecs: number }> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('relances').select('etape, erreur').limit(5000)
  const parEtape = new Map<number, number>()
  let echecs = 0
  if (!error) {
    for (const r of data ?? []) {
      const e = Number(r.etape)
      parEtape.set(e, (parEtape.get(e) ?? 0) + 1)
      if (r.erreur) echecs++
    }
  }
  return { parEtape, echecs }
}

export default async function AdminRelancesPage() {
  const configure = emailConfigure()
  const { parEtape, echecs } = await compter()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/admin/leads/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6">
        <ArrowLeft size={15} /> Retour aux adresses
      </Link>

      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink flex items-center gap-2.5">
        <Send size={24} className="text-brand-600" />
        Les relances
      </h1>
      <p className="text-gray-500 text-sm mt-1">
        Les cinq messages envoyés à qui n’est pas allé au bout du paiement. Ils s’arrêtent
        dès que la personne commande ou se désinscrit.
      </p>

      {!configure && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-4 mt-5 text-[15px] text-amber-900">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <span>
            L’envoi n’est pas encore branché : il manque <code>RESEND_API_KEY</code> et{' '}
            <code>EMAIL_FROM</code> dans la configuration. Les messages ci-dessous sont prêts,
            rien ne part tant que ces deux valeurs sont vides.
          </span>
        </p>
      )}

      {echecs > 0 && (
        <p className="rounded-lg border border-red-300 bg-red-50 p-4 mt-5 text-[15px] text-red-800">
          {echecs} envoi{echecs > 1 ? 's' : ''} en échec. Le motif est indiqué au survol de
          l’étiquette rouge, sur la fiche de l’adresse concernée.
        </p>
      )}

      <div className="space-y-6 mt-8">
        {Array.from({ length: NB_ETAPES }, (_, i) => i + 1).map((etape) => {
          const m = composer(etape, EXEMPLE, '#')
          const envoyes = parEtape.get(etape) ?? 0
          return (
            <section key={etape} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3.5 border-b border-gray-100">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                    {etape}. {delai(DELAIS_HEURES[etape - 1])}
                  </p>
                  <p className="font-semibold text-ink mt-0.5">{m.sujet}</p>
                </div>
                <p className="text-sm text-gray-500 whitespace-nowrap">
                  {envoyes === 0 ? 'jamais envoyé' : `${envoyes} envoyé${envoyes > 1 ? 's' : ''}`}
                </p>
              </div>
              {/* `sandbox` vide : l'aperçu ne peut rien exécuter ni naviguer. */}
              <iframe
                title={`Aperçu du message ${etape}`}
                srcDoc={m.html}
                sandbox=""
                className="w-full h-[680px] border-0 bg-gray-50"
              />
            </section>
          )
        })}
      </div>
    </div>
  )
}
