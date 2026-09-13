'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Spec } from '@/types/database'

interface AccordionItem {
  title: string
  content: React.ReactNode
  defaultOpen?: boolean
}

function AccordionRow({ title, content, defaultOpen = false }: AccordionItem) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-brand-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-brand-50 transition-colors"
      >
        <span className="font-semibold text-brand-900 text-sm">{title}</span>
        <ChevronDown size={18} className={`text-brand-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 bg-white text-sm text-brand-700 leading-relaxed border-t border-brand-100">
          {content}
        </div>
      )}
    </div>
  )
}

interface Props {
  description: string | null
  specs: Spec[]
}

export default function ProductAccordion({ description, specs }: Props) {
  return (
    <div className="space-y-2">

      <AccordionRow
        title="Description du produit"
        defaultOpen={true}
        content={
          description
            ? <div className="product-description" dangerouslySetInnerHTML={{ __html: description }} />
            : <p className="text-brand-400 text-sm">Aucune description disponible.</p>
        }
      />

      <AccordionRow
        title="Caractéristiques techniques"
        defaultOpen={false}
        content={
          <dl className="divide-y divide-brand-100">
            {specs.map((s) => (
              <div key={s.label} className="flex justify-between gap-4 py-2 text-sm">
                <dt className="text-brand-500">{s.label}</dt>
                <dd className="text-brand-900 font-medium text-right">{s.value}</dd>
              </div>
            ))}
          </dl>
        }
      />

      <AccordionRow
        title="Livraison"
        defaultOpen={false}
        content={
          <ul className="space-y-2 text-sm text-brand-700">
            {[
              'Livraison offerte pour votre première commande, en France métropolitaine',
              'Expédition sur palette filmée pour les gros conditionnements',
              'Un e-mail de suivi vous est envoyé dès l’expédition',
            ].map(item => <li key={item}>{item}</li>)}
          </ul>
        }
      />
    </div>
  )
}
