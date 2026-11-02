import { getProductBySlug } from '@/lib/products'

export interface VenteCommande {
  statut: string
  produit_slug: string
  produit_nom: string
  lot: string | null
  quantite: number
  montant_cents: number
}

type Famille = 'bois-de-chauffage' | 'granules' | 'autres'

export interface VenteProduit {
  cle: string
  nom: string
  commandes: number
  quantite: number
  encaisseCents: number
}

export interface VenteFamille {
  famille: Famille
  commandes: number
  quantite: number
  encaisseCents: number
  produits: VenteProduit[]
}

/** Les montants et quantités viennent des commandes, jamais des prix actuels. */
export function resumerVentes(commandes: VenteCommande[]): VenteFamille[] {
  const familles: Famille[] = ['bois-de-chauffage', 'granules', 'autres']
  const resume = familles.map((famille): VenteFamille => ({
    famille, commandes: 0, quantite: 0, encaisseCents: 0, produits: [],
  }))

  for (const commande of commandes) {
    if (commande.statut !== 'payee') continue
    const familleCatalogue = getProductBySlug(commande.produit_slug)?.family
    const famille = familleCatalogue === 'bois-de-chauffage' || familleCatalogue === 'granules'
      ? familleCatalogue : 'autres'
    const ligne = resume.find((r) => r.famille === famille)!
    // Les anciennes commandes sans quantité correspondent à un seul lot.
    const quantite = Number.isInteger(commande.quantite) && commande.quantite > 0 ? commande.quantite : 1
    ligne.commandes++
    ligne.quantite += quantite
    ligne.encaisseCents += commande.montant_cents

    const cle = JSON.stringify([commande.produit_slug, commande.lot])
    let produit = ligne.produits.find((p) => p.cle === cle)
    if (!produit) {
      produit = {
        cle, nom: commande.produit_nom.replace(/ × \d+$/, ''),
        commandes: 0, quantite: 0, encaisseCents: 0,
      }
      ligne.produits.push(produit)
    }
    produit.commandes++
    produit.quantite += quantite
    produit.encaisseCents += commande.montant_cents
  }

  for (const famille of resume) {
    famille.produits.sort((a, b) => b.encaisseCents - a.encaisseCents || a.nom.localeCompare(b.nom, 'fr'))
  }
  return resume.filter((r) => r.famille !== 'autres' || r.commandes > 0)
}
