import { createAdminClient } from '@/lib/supabase/server'
import { formatDate, formatDuration } from '@/lib/analytics/queries'

/**
 * Rapport complet en un seul document, destiné à être lu par une IA.
 *
 * Le Markdown est retenu plutôt que le CSV : un modèle de langage y lit des
 * tableaux et des paragraphes de contexte, là où un CSV multi-jeux devrait
 * être deviné. Le contexte est d'ailleurs l'essentiel — sans lui, une IA
 * lirait « 0 mise au panier depuis une carte » comme un effondrement, alors
 * que ce chemin a simplement été supprimé du site.
 *
 * Les demandes de contact en sont volontairement exclues : elles
 * contiennent des noms et des adresses e-mail, qui n'ont rien à faire dans
 * un document transmis à un tiers.
 */

const MAX_PARCOURS = 200

const ACTION: Record<string, string> = {
  pageview: 'arrive sur',
  page_exit: 'quitte',
  click: 'clique sur',
  form_field: 'champ',
}

function tableau(entetes: string[], lignes: (string | number)[][]): string {
  if (lignes.length === 0) return '_Aucune donnée sur la période._\n'
  return [
    `| ${entetes.join(' | ')} |`,
    `| ${entetes.map(() => '---').join(' | ')} |`,
    ...lignes.map((l) => `| ${l.join(' | ')} |`),
  ].join('\n') + '\n'
}

export async function construireRapport(du: string, au: string): Promise<string> {
  const supabase = createAdminClient()

  const [apercu, sessions, appareils, produits, evenements] = await Promise.all([
    supabase.rpc('analytics_overview_dates', { p_from: du, p_to: au }).then((r) => r.data),
    supabase.rpc('analytics_recent_sessions_dates', { p_from: du, p_to: au, p_limit: MAX_PARCOURS }).then((r) => r.data ?? []),
    supabase.rpc('analytics_funnel_by_device_dates', { p_from: du, p_to: au }).then((r) => r.data ?? []),
    supabase.rpc('analytics_product_performance_dates', { p_from: du, p_to: au }).then((r) => r.data ?? []),
    supabase.rpc('analytics_events_dates', { p_from: du, p_to: au, p_limit: 50000 }).then((r) => r.data ?? []),
  ])

  const r = apercu?.resume ?? {}
  const v = Number(r.visites ?? 0)
  const pct = (n: number) => (v > 0 ? Math.round((n * 100) / v) : 0)
  const periode = du === au ? `journée du ${formatDate(du)}` : `du ${formatDate(du)} au ${formatDate(au)}`

  const L: string[] = []

  L.push(`# Bois Tresor — données de fréquentation`)
  L.push('')
  L.push(`**Période analysée :** ${periode} _(journées en heure française)_`)
  L.push(`**Document généré le :** ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`)
  L.push('')

  /* ── Contexte : sans lui, une IA interprète les chiffres de travers ── */
  L.push(`## Comment lire ces données`)
  L.push('')
  L.push(`Bois Tresor vend du bois de chauffage, des granulés et du bois densifié, livrés par palette en France, Belgique, Suisse et Luxembourg. La clientèle visée est âgée, rurale, peu à l'aise avec internet, et sa première crainte est l'arnaque — la réassurance prime sur la promotion.`)
  L.push('')
  L.push(`**Le parcours d'achat est volontairement linéaire :** page collection → fiche produit → paiement. Il n'y a pas d'étape de panier. Cliquer « Commander maintenant » sur une fiche envoie directement vers un système de paiement externe, hors de portée de cette mesure. « Mise au panier » et « départ vers le paiement » désignent donc le même clic, et c'est la dernière étape observable ici : **les ventes réellement conclues ne figurent pas dans ce document.**`)
  L.push('')
  L.push(`**Un changement récent doit être connu :** l'achat direct depuis les cartes de la page collection a été supprimé, pour forcer le passage par la fiche produit et sa réassurance. La colonne « depuis une carte » du tableau produits tend donc vers zéro — ce n'est pas une chute de performance, c'est la disparition volontaire de ce chemin.`)
  L.push('')
  L.push(`**Périmètre :** seules les visites venues de France, Belgique, Suisse, Luxembourg et Monaco sont enregistrées. Les robots sont écartés avant tout enregistrement. Aucune adresse IP n'est conservée, uniquement le code pays.`)
  L.push('')

  /* ── Vue d'ensemble ── */
  L.push(`## Vue d'ensemble`)
  L.push('')
  L.push(tableau(
    ['Indicateur', 'Valeur'],
    [
      ['Visites', v],
      ['Temps moyen par visite', formatDuration(Number(r.duree_moyenne_s ?? 0) * 1000)],
      ['Pages par visite', String(r.pages_par_visite ?? 0)],
      ['Visites d\'une seule page', `${r.visites_une_page ?? 0} (${pct(Number(r.visites_une_page ?? 0))} %)`],
    ]
  ))

  /* ── Jour par jour ── */
  const jours = (apercu?.jours ?? []) as { jour: string; visites: number; achats: number }[]
  if (jours.length > 0) {
    L.push(`## Évolution jour par jour`)
    L.push('')
    L.push(tableau(
      ['Journée', 'Visites', 'Mises au panier', 'Taux'],
      jours.map((j) => [
        formatDate(String(j.jour).slice(0, 10)),
        j.visites,
        j.achats,
        `${j.visites > 0 ? Math.round((j.achats * 1000) / j.visites) / 10 : 0} %`,
      ])
    ))
  }

  /* ── Entonnoir ── */
  L.push(`## Entonnoir`)
  L.push('')
  const etapes: [string, number][] = [
    ['Visites', v],
    ['A vu une page collection', Number(r.etape_collection ?? 0)],
    ['A ouvert une fiche produit', Number(r.etape_produit ?? 0)],
    ['A cliqué sur Commander (départ vers le paiement)', Number(r.etape_achat ?? 0)],
  ]
  L.push(tableau(
    ['Étape', 'Visiteurs', 'Part des visites', 'Évolution vs étape précédente'],
    etapes.map(([nom, n], i) => {
      const prec = i === 0 ? n : etapes[i - 1][1]
      const ecart = prec > 0 ? Math.round(((n - prec) / prec) * 100) : 0
      return [nom, n, `${pct(n)} %`, i === 0 ? '—' : `${ecart > 0 ? '+' : ''}${ecart} %`]
    })
  ))
  if (Number(r.etape_achat ?? 0) > Number(r.etape_produit ?? 0)) {
    L.push('')
    L.push(`> **Anomalie apparente :** la dernière étape dépasse la précédente. C'est normal ici : certains visiteurs ont commandé directement depuis une carte de la page collection, sans jamais ouvrir de fiche produit. Ce chemin a depuis été supprimé du site, le phénomène va donc disparaître.`)
  }

  /* ── Appareils ── */
  L.push(`## Par appareil`)
  L.push('')
  L.push(`Un appareil qui convertit nettement moins qu'un autre signale en général un défaut d'affichage sur cet appareil, et non une préférence des visiteurs.`)
  L.push('')
  L.push(tableau(
    ['Appareil', 'Visites', 'Collection', 'Fiche produit', 'Commander', 'Taux', 'Temps moyen'],
    (appareils as Record<string, unknown>[]).map((d) => [
      String(d.device),
      Number(d.visites),
      Number(d.saw_collection),
      Number(d.saw_product),
      Number(d.clicked_buy),
      `${Number(d.visites) > 0 ? Math.round((Number(d.clicked_buy) * 1000) / Number(d.visites)) / 10 : 0} %`,
      formatDuration(Number(d.duree_moyenne_s) * 1000),
    ])
  ))

  /* ── Produits ── */
  L.push(`## Produits`)
  L.push('')
  L.push(`« Taux depuis la fiche » ne compare que ce qui est comparable : parmi les visiteurs ayant ouvert la fiche, la part qui a ensuite cliqué sur Commander. Les clics venus d'une carte de collection sont comptés à part, ces visiteurs n'ayant jamais vu la fiche.`)
  L.push('')
  L.push(tableau(
    ['Produit', 'Fiches vues', 'Commandes', 'Depuis la fiche', 'Depuis une carte', 'Taux fiche', 'Montant total', 'Scroll moyen'],
    (produits as Record<string, unknown>[]).map((p) => [
      String(p.name).replace(/\|/g, '/'),
      Number(p.vues),
      Number(p.achats),
      Number(p.achats_fiche),
      Number(p.achats_carte),
      Number(p.vues) > 0 ? `${p.taux} %` : '—',
      `${Number(p.valeur_totale).toFixed(2)} €`,
      `${p.scroll_moyen} %`,
    ])
  ))

  /* ── Pages ── */
  L.push(`## Pages`)
  L.push('')
  L.push(`Un scroll moyen faible sur une page longue indique un contenu que personne n'atteint. Un taux de sortie élevé désigne une page d'où les visiteurs quittent le site.`)
  L.push('')
  L.push(tableau(
    ['Page', 'Vues', 'Temps moyen', 'Scroll moyen', 'Taux de sortie'],
    ((apercu?.pages ?? []) as Record<string, unknown>[]).map((p) => [
      String(p.path),
      Number(p.vues),
      formatDuration(Number(p.duree_moyenne_s) * 1000),
      `${p.scroll_moyen} %`,
      `${Number(p.vues) > 0 ? Math.round((Number(p.sorties) * 100) / Number(p.vues)) : 0} %`,
    ])
  ))

  /* ── Clics ── */
  L.push(`## Éléments les plus cliqués`)
  L.push('')
  L.push(tableau(
    ['Élément', 'Page', 'Clics'],
    ((apercu?.clics ?? []) as Record<string, unknown>[]).map((c) => [
      String(c.label ?? '').replace(/\|/g, '/'),
      String(c.path),
      Number(c.total),
    ])
  ))

  /* ── Formulaires ── */
  const champs = (apercu?.champs ?? []) as Record<string, unknown>[]
  if (champs.length > 0) {
    L.push(`## Champs de formulaire abandonnés`)
    L.push('')
    L.push(tableau(
      ['Champ', 'Ouvertures', 'Laissés vides', 'Taux d\'abandon'],
      champs.map((f) => [
        String(f.label),
        Number(f.ouvertures),
        Number(f.abandons),
        `${Number(f.ouvertures) > 0 ? Math.round((Number(f.abandons) * 100) / Number(f.ouvertures)) : 0} %`,
      ])
    ))
  }

  /* ── Provenance et pays ── */
  L.push(`## Provenance`)
  L.push('')
  L.push(tableau(
    ['Source', 'Visites'],
    ((apercu?.sources ?? []) as Record<string, unknown>[]).map((s) => [String(s.source), Number(s.visites)])
  ))
  L.push(`## Pays`)
  L.push('')
  L.push(tableau(
    ['Pays', 'Visites'],
    ((apercu?.pays ?? []) as Record<string, unknown>[]).map((p) => [String(p.code), Number(p.visites)])
  ))

  /* ── Parcours détaillés ── */
  L.push(`## Parcours détaillés`)
  L.push('')

  const parSession = new Map<string, Record<string, unknown>[]>()
  for (const e of evenements as Record<string, unknown>[]) {
    const id = String(e.session_id)
    if (!parSession.has(id)) parSession.set(id, [])
    parSession.get(id)!.push(e)
  }

  const listees = (sessions as Record<string, unknown>[]).slice(0, MAX_PARCOURS)
  L.push(`${listees.length} visite(s) détaillée(s)${(sessions as unknown[]).length >= MAX_PARCOURS ? `, limité aux ${MAX_PARCOURS} plus récentes` : ''}. Le décalage indiqué est le temps écoulé depuis le début de la visite.`)
  L.push('')

  for (const s of listees) {
    const evts = parSession.get(String(s.id)) ?? []
    const debut = new Date(String(s.started_at)).getTime()
    const etapes = [
      s.saw_collection ? 'collection' : null,
      s.saw_product ? 'fiche produit' : null,
      s.clicked_buy ? 'a commandé' : null,
    ].filter(Boolean).join(' → ') || 'aucune étape'

    L.push(`### ${new Date(String(s.started_at)).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })} · ${s.country} · ${s.device ?? 'inconnu'} · via ${s.source}`)
    L.push(`${s.pageviews} page(s) · ${formatDuration(Number(s.duration_ms))} · ${etapes}`)
    L.push('')
    for (const e of evts) {
      const t = Math.max(0, new Date(String(e.occurred_at)).getTime() - debut)
      const quoi =
        e.type === 'click' ? `« ${e.label} »`
        : e.type === 'form_field' ? `${e.label} — ${e.champ_rempli === 'false' ? 'laissé vide' : 'rempli'}`
        : String(e.path)
      const extra = e.type === 'page_exit'
        ? ` _(y est resté ${formatDuration(Number(e.duration_ms ?? 0))}, a lu ${e.scroll_pct ?? '?'} % de la page)_`
        : e.produit ? ` _(${e.produit}, quantité ${e.quantite}, ${e.montant} €)_` : ''
      L.push(`- \`+${formatDuration(t)}\` ${ACTION[String(e.type)] ?? e.type} ${quoi}${extra}`)
    }
    L.push('')
  }

  return L.join('\n')
}
