'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { ProductFamily } from '@/types/database'
import { SIRET, TVA_INTRACOM, ADRESSE_SIEGE, ANNUAIRE_URL, APRES_VENTE_EMAIL } from '@/lib/site'

interface Item { q: string; a: React.ReactNode; /** Familles concernées ; absent = toutes. */ familles?: ProductFamily[] }

/* Les questions sur le bois sec ne s'affichent pas sur les granulés, et
   inversement : une question qui ne concerne pas le produit fait douter de
   tout le reste. */
const FAQ: Item[] = [
  {
    q: 'Comment passer commande ?',
    a: 'Choisissez votre quantité et cliquez sur Commander maintenant : vous passez directement au paiement sécurisé. Vous recevez immédiatement un e-mail de confirmation avec votre numéro de commande.',
  },
  {
    q: 'Livrez-vous partout en France, en Belgique, en Suisse et au Luxembourg ?',
    a: 'Oui, partout en France métropolitaine, en Belgique, en Suisse et au Luxembourg. La palette est déposée au plus près de votre lieu de stockage par un transporteur spécialisé, dont le camion est équipé d’un hayon et d’un chariot élévateur adapté au bois.',
    familles: ['bois-de-chauffage', 'bois-densifie', 'granules'],
  },
  {
    q: 'Livrez-vous partout en France, en Belgique, en Suisse et au Luxembourg ?',
    a: 'Oui, partout en France métropolitaine, en Belgique, en Suisse et au Luxembourg, en colis, livraison offerte.',
    familles: ['jardin'],
  },
  {
    q: 'Puis-je acheter ce produit en tant que particulier ?',
    a: 'Ces herbicides sont réservés aux utilisateurs professionnels titulaires du certificat Certiphyto, conformément à la réglementation. Lisez toujours l’étiquette et respectez les doses et précautions indiquées.',
    familles: ['jardin'],
  },
  {
    q: 'La livraison est-elle payante ?',
    a: 'Non : la livraison est offerte sur toutes nos commandes, sans montant minimum, en France métropolitaine, en Belgique, en Suisse et au Luxembourg. Le prix affiché est le prix payé, il ne s’ajoute rien au paiement.',
  },
  {
    q: 'Comment se passe le paiement ?',
    a: 'Le paiement se fait en ligne par carte bancaire, sur un formulaire bancaire chiffré avec authentification 3D-Secure. Nous ne voyons jamais votre numéro de carte. Vous recevez un e-mail de confirmation avec votre numéro de commande.',
  },
  {
    q: 'Votre bois est-il vraiment sec ?',
    a: 'Oui. Nous le séchons 18 à 24 mois, jusqu’à moins de 20 % d’humidité. Un bois à ce taux s’allume facilement, chauffe vraiment et ne fume pas.',
    familles: ['bois-de-chauffage', 'bois-densifie'],
  },
  {
    q: 'Vos granulés conviennent-ils à mon poêle ?',
    a: 'Oui : ce sont des granulés certifiés ENplus A1, la norme que demandent les fabricants de poêles et de chaudières à granulés. Très peu de cendres, humidité inférieure à 8 %.',
    familles: ['granules'],
  },
  {
    q: 'Pourquoi ce prix, si bas par rapport aux magasins ?',
    a: 'C’est un déstockage : nous écoulons un stock à prix réduit, dans la limite des quantités disponibles. Ce sont les mêmes sacs de 15 kg certifiés ENplus A1 que ceux vendus 6,50 € en magasin — simplement, nous n’avons pas de rayon à faire tourner.',
    familles: ['granules'],
  },
  {
    q: 'En combien de temps suis-je livré ?',
    a: 'Votre commande est préparée sous 48 h ouvrées, puis livrée en 3 à 7 jours ouvrés selon votre région. Vous recevez un e-mail dès l’expédition.',
  },
  {
    /* La question que les clients posent par e-mail : on y répond avant,
       avec de quoi vérifier eux-mêmes. */
    q: 'Qui êtes-vous ? Puis-je vérifier votre entreprise ?',
    a: (
      <>
        Bois Tresor est une entreprise familiale française. Siège social : {ADRESSE_SIEGE.rue},{' '}
        {ADRESSE_SIEGE.ville}. SIRET {SIRET}, TVA intracommunautaire {TVA_INTRACOM}. Vous pouvez vérifier
        ces informations sur{' '}
        <a href={ANNUAIRE_URL} target="_blank" rel="noopener noreferrer" className="text-brand-700 underline">
          l’annuaire officiel des entreprises
        </a>{' '}
        (service public), et consulter nos{' '}
        <a href="/mentions-legales" className="text-brand-700 underline">mentions légales</a>.
      </>
    ),
  },
  {
    q: 'Et si j’ai un problème ?',
    a: `Écrivez-nous à ${APRES_VENTE_EMAIL} avec votre numéro de commande : nous répondons sous 24 h ouvrées. En cas de produit non conforme ou non livré, vous êtes livré ou remboursé.`,
  },
  {
    familles: ['bois-de-chauffage', 'bois-densifie', 'granules'],
    q: 'Comment se passe la livraison ? Faut-il un accès particulier ?',
    a: 'Pas d’inquiétude : votre commande est livrée par palette directement chez vous. Le transporteur spécialisé intervient avec un camion équipé d’un hayon et d’un chariot élévateur adapté au bois : nous pouvons livrer même les endroits difficiles d’accès. Vous pourrez nous préciser les détails de votre accès après votre commande, pour que tout se passe au mieux le jour de la livraison. Dans la grande majorité des cas, il n’y a aucun souci.',
  },
]

function Row({ q, a }: { q: string; a: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left hover:text-brand-700 transition-colors"
        aria-expanded={open}
      >
        <span className="font-semibold text-ink text-[17px]">{q}</span>
        <ChevronDown
          size={20}
          className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <p className="pb-4 pr-8 text-[16px] text-gray-700 leading-relaxed">{a}</p>}
    </div>
  )
}

export default function ProductFaq({ family, parLot = false }: { family?: ProductFamily; parLot?: boolean }) {
  const items = FAQ
    .filter((i) => !i.familles || !family || i.familles.includes(family))
    .map((i) =>
      /* Vendu par lot : on ne choisit pas une quantité, on choisit un lot. */
      parLot && i.q === 'Comment passer commande ?' && typeof i.a === 'string'
        ? { ...i, a: i.a.replace('Choisissez votre quantité', 'Choisissez votre lot') }
        : i
    )
  return (
    <section>
      <h2 className="font-serif text-2xl font-bold text-ink mb-4">Questions fréquentes</h2>
      <div className="border-2 border-gray-200 rounded-lg px-5">
        {items.map(item => <Row key={item.q} q={item.q} a={item.a} />)}
      </div>
    </section>
  )
}
