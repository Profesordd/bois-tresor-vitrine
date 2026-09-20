'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Comment passer commande ?',
    a: 'Choisissez votre quantité et cliquez sur Commander maintenant : vous passez directement au paiement sécurisé. Vous recevez immédiatement un e-mail de confirmation avec votre numéro de commande.',
  },
  {
    q: 'Livrez-vous partout en France, en Belgique et en Suisse ?',
    a: 'Oui, partout en France métropolitaine, en Belgique et en Suisse. La palette est déposée au plus près de votre lieu de stockage par un transporteur spécialisé, dont le camion est équipé d’un hayon et d’un chariot élévateur adapté au bois.',
  },
  {
    q: 'La livraison est-elle payante ?',
    a: 'Non : la livraison est offerte sur toutes nos commandes, sans montant minimum, en France métropolitaine, en Belgique et en Suisse. Le prix affiché est le prix payé, il ne s’ajoute rien au paiement.',
  },
  {
    q: 'Comment se passe le paiement ?',
    a: 'Le paiement se fait en ligne par carte bancaire, sur un formulaire bancaire chiffré avec authentification 3D-Secure. Nous ne voyons jamais votre numéro de carte. Vous recevez un e-mail de confirmation avec votre numéro de commande.',
  },
  {
    q: 'Votre bois est-il vraiment sec ?',
    a: 'Oui. Nous le séchons 18 à 24 mois, jusqu’à moins de 20 % d’humidité. Un bois à ce taux s’allume facilement, chauffe vraiment et ne fume pas.',
  },
  {
    q: 'En combien de temps suis-je livré ?',
    a: 'Votre commande est préparée sous 48 h ouvrées, puis livrée en 3 à 7 jours ouvrés selon votre région. Vous recevez un e-mail dès l’expédition.',
  },
  {
    q: 'Et si j’ai un problème ?',
    a: 'Écrivez-nous à contact@bois-tresor.com : nous répondons sous 24 h ouvrées. En cas de produit non conforme ou non livré, vous êtes livré ou remboursé.',
  },
  {
    q: 'Comment se passe la livraison ? Faut-il un accès particulier ?',
    a: 'Pas d’inquiétude : votre commande est livrée par palette directement chez vous. Le transporteur spécialisé intervient avec un camion équipé d’un hayon et d’un chariot élévateur adapté au bois : nous pouvons livrer même les endroits difficiles d’accès. Vous pourrez nous préciser les détails de votre accès après votre commande, pour que tout se passe au mieux le jour de la livraison. Dans la grande majorité des cas, il n’y a aucun souci.',
  },
]

function Row({ q, a }: { q: string; a: string }) {
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

export default function ProductFaq() {
  return (
    <section>
      <h2 className="font-serif text-2xl font-bold text-ink mb-4">Questions fréquentes</h2>
      <div className="border-2 border-gray-200 rounded-lg px-5">
        {FAQ.map(item => <Row key={item.q} {...item} />)}
      </div>
    </section>
  )
}
