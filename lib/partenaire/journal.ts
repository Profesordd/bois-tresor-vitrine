import { createAdminClient } from '@/lib/supabase/server'

/**
 * Journal quotidien du canal partenaire : pour chaque jour, le CA (calculé
 * depuis les ventes réelles), le spend publicitaire saisi, et la
 * répartition du bénéfice, le tout en dollars.
 *
 * Tout passe en dollars sauf le CA d'origine, qui est en euros puis
 * converti par le taux enregistré avec le spend de ce jour-là.
 *
 * Partage : 50 % associé 1, 37,5 % associé 2 (il reverse 25 % de sa part),
 * 12,5 % pour le propriétaire.
 */

export interface LigneJournal {
  jour: string
  caEur: number
  caUsd: number
  spendUsd: number
  taux: number
  benefice: number
  associe1: number
  associe2: number
  maPart: number
}

/** Jour calendaire à l'heure de Paris. */
function jourParis(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })
}

export const TAUX_DEFAUT = 1.08

export async function journalPartenaire(): Promise<LigneJournal[]> {
  const supabase = createAdminClient()

  const depuis = new Date(Date.now() - 90 * 86_400_000).toISOString()
  const [{ data: ventes }, { data: spends }] = await Promise.all([
    supabase.from('commandes').select('created_at, montant_cents')
      .eq('statut', 'payee').eq('canal', 'partenaire').gte('created_at', depuis).limit(5000),
    supabase.from('partenaire_spend').select('jour, spend_usd, taux_eur_usd').limit(400),
  ])

  const caParJour = new Map<string, number>()
  for (const v of ventes ?? []) {
    const j = jourParis(v.created_at as string)
    caParJour.set(j, (caParJour.get(j) ?? 0) + Number(v.montant_cents) / 100)
  }
  const spendParJour = new Map<string, { spend: number; taux: number }>()
  for (const s of spends ?? []) {
    spendParJour.set(s.jour as string, { spend: Number(s.spend_usd), taux: Number(s.taux_eur_usd) })
  }

  const jours = new Set<string>()
  caParJour.forEach((_, k) => jours.add(k))
  spendParJour.forEach((_, k) => jours.add(k))
  const joursListe: string[] = []
  jours.forEach((j) => joursListe.push(j))

  const lignes: LigneJournal[] = []
  for (const jour of joursListe) {
    const caEur = caParJour.get(jour) ?? 0
    const sp = spendParJour.get(jour)
    const taux = sp?.taux ?? TAUX_DEFAUT
    const spendUsd = sp?.spend ?? 0
    const caUsd = caEur * taux
    const benefice = caUsd - spendUsd
    lignes.push({
      jour, caEur, caUsd, spendUsd, taux, benefice,
      associe1: benefice * 0.5,
      associe2: benefice * 0.375,
      maPart: benefice * 0.125,
    })
  }
  lignes.sort((a, b) => (a.jour < b.jour ? 1 : -1))
  return lignes
}
