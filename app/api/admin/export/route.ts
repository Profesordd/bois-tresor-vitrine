import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ADMIN_COOKIE, verifyToken } from '@/lib/admin/session'
import { dateValide } from '@/lib/analytics/queries'
import { construireRapport } from '@/lib/analytics/rapport'

/**
 * Export CSV depuis le tableau de bord.
 *
 * Toutes les données passent par les fonctions SQL datées, qui ne renvoient
 * que la France, la Belgique, la Suisse, le Luxembourg et Monaco. L'ancien
 * script exportait la table brute : le client y retrouvait des visites de
 * Thaïlande ou du Cambodge, qui sont des robots et n'ont rien à faire dans
 * ses chiffres.
 *
 * Le middleware ne protège que les pages : l'autorisation est vérifiée ici.
 */

const JEUX = ['rapport', 'visites', 'parcours', 'produits', 'appareils', 'pages', 'contacts'] as const
type Jeu = (typeof JEUX)[number]

/** Excel francophone attend le point-virgule ; le BOM préserve les accents. */
function versCsv(lignes: Record<string, unknown>[], colonnes?: string[]): string {
  const cols = colonnes ?? (lignes[0] ? Object.keys(lignes[0]) : [])
  const cellule = (v: unknown) => {
    if (v === null || v === undefined) return ''
    let s = String(v).replace(/\r?\n/g, ' / ')
    if (s.includes(';') || s.includes('"')) s = '"' + s.replace(/"/g, '""') + '"'
    return s
  }
  return '﻿' + [cols.join(';'), ...lignes.map((l) => cols.map((c) => cellule(l[c])).join(';'))].join('\r\n')
}

const heureFr = (v: string | null) =>
  v ? new Date(v).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }) : ''

export async function GET(req: NextRequest) {
  const autorise = await verifyToken(
    req.cookies.get(ADMIN_COOKIE)?.value,
    process.env.ADMIN_SESSION_SECRET ?? ''
  )
  if (!autorise) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const jeu = searchParams.get('jeu') as Jeu
  const du = searchParams.get('du')
  const au = searchParams.get('au')

  if (!JEUX.includes(jeu)) return NextResponse.json({ error: 'Jeu inconnu' }, { status: 400 })
  if (!dateValide(du) || !dateValide(au)) {
    return NextResponse.json({ error: 'Dates invalides' }, { status: 400 })
  }

  /* Rapport complet : un seul document, tous les jeux réunis, destiné à
     être soumis à une IA. Les demandes de contact en sont exclues — noms
     et adresses e-mail n'ont rien à faire dans un fichier transmis à un
     tiers, et n'apportent rien à l'analyse du parcours. */
  if (jeu === 'rapport') {
    const md = await construireRapport(du, au)
    return new NextResponse(md, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="bois-tresor_rapport_${du}_au_${au}.md"`,
        'Cache-Control': 'no-store',
      },
    })
  }

  const supabase = createAdminClient()
  let lignes: Record<string, unknown>[] = []

  if (jeu === 'visites') {
    const { data } = await supabase.rpc('analytics_recent_sessions_dates', { p_from: du, p_to: au, p_limit: 1000 })
    lignes = (data ?? []).map((s: Record<string, unknown>) => ({
      'Date et heure': heureFr(s.started_at as string),
      Pays: s.country,
      Appareil: s.device ?? 'inconnu',
      Provenance: s.source,
      "Page d'arrivee": s.entry_path,
      'Page de sortie': s.exit_path,
      'Pages vues': s.pageviews,
      'Temps passe (s)': Math.round(Number(s.duration_ms) / 1000),
      'A vu une collection': s.saw_collection ? 'oui' : 'non',
      'A ouvert une fiche': s.saw_product ? 'oui' : 'non',
      'A mis au panier': s.clicked_buy ? 'oui' : 'non',
      'Identifiant visite': s.id,
    }))
  } else if (jeu === 'parcours') {
    const { data } = await supabase.rpc('analytics_events_dates', { p_from: du, p_to: au, p_limit: 50000 })
    const ACTION: Record<string, string> = {
      pageview: 'arrive sur', page_exit: 'quitte', click: 'clique sur', form_field: 'champ de formulaire',
    }
    lignes = (data ?? []).map((e: Record<string, unknown>) => ({
      'Date et heure': heureFr(e.occurred_at as string),
      'Identifiant visite': e.session_id,
      Pays: e.country,
      Appareil: e.device ?? 'inconnu',
      Action: ACTION[e.type as string] ?? e.type,
      Page: e.path,
      Element: e.label,
      'Temps sur la page (s)': e.duration_ms ? Math.round(Number(e.duration_ms) / 1000) : '',
      'Scroll atteint (%)': e.scroll_pct,
      Produit: e.produit,
      Quantite: e.quantite,
      'Montant (EUR)': e.montant,
      'Champ rempli': e.champ_rempli,
    }))
  } else if (jeu === 'produits') {
    const { data } = await supabase.rpc('analytics_product_performance_dates', { p_from: du, p_to: au })
    lignes = (data ?? []).map((p: Record<string, unknown>) => ({
      Produit: p.name,
      'Fiches vues': p.vues,
      'Mises au panier': p.achats,
      'Dont depuis la fiche': p.achats_fiche,
      'Dont depuis une carte': p.achats_carte,
      'Taux depuis la fiche (%)': Number(p.vues) > 0 ? p.taux : '',
      'Montant total (EUR)': p.valeur_totale,
      'Scroll moyen (%)': p.scroll_moyen,
      Identifiant: p.slug,
    }))
  } else if (jeu === 'appareils') {
    const { data } = await supabase.rpc('analytics_funnel_by_device_dates', { p_from: du, p_to: au })
    lignes = (data ?? []).map((d: Record<string, unknown>) => ({
      Appareil: d.device,
      Visites: d.visites,
      'A vu une collection': d.saw_collection,
      'A ouvert une fiche': d.saw_product,
      'A mis au panier': d.clicked_buy,
      'Taux (%)': Number(d.visites) ? Math.round((Number(d.clicked_buy) * 1000) / Number(d.visites)) / 10 : 0,
      'Temps moyen (s)': d.duree_moyenne_s,
      'Pages par visite': d.pages_par_visite,
    }))
  } else if (jeu === 'pages') {
    const { data } = await supabase.rpc('analytics_overview_dates', { p_from: du, p_to: au })
    lignes = ((data?.pages ?? []) as Record<string, unknown>[]).map((p) => ({
      Page: p.path,
      Vues: p.vues,
      'Temps moyen (s)': p.duree_moyenne_s,
      'Scroll moyen (%)': p.scroll_moyen,
      Sorties: p.sorties,
      'Taux de sortie (%)': Number(p.vues) ? Math.round((Number(p.sorties) * 100) / Number(p.vues)) : 0,
    }))
  } else {
    /* Les demandes de contact ne dépendent d'aucun pays : elles viennent
       d'un formulaire rempli à la main, jamais d'un robot. */
    const { data } = await supabase
      .from('contact_messages')
      .select('*')
      .gte('created_at', `${du}T00:00:00+02:00`)
      .lt('created_at', `${au}T23:59:59+02:00`)
      .order('created_at', { ascending: false })
    lignes = (data ?? []).map((m: Record<string, unknown>) => ({
      'Recu le': heureFr(m.created_at as string),
      Nom: m.name,
      'E-mail': m.email,
      Sujet: m.subject ?? '',
      Message: m.message,
      Traite: m.handled ? 'oui' : 'non',
    }))
  }

  const nom = `bois-tresor_${jeu}_${du}_au_${au}.csv`
  return new NextResponse(versCsv(lignes), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nom}"`,
      'Cache-Control': 'no-store',
    },
  })
}
