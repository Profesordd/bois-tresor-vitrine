'use client'

import { useEffect, useState } from 'react'
import { ShoppingBag, Package, Copy, Check, Mail } from 'lucide-react'
import { CANAUX, type Canal } from '@/lib/site'

const ICONES = { 'avant-vente': ShoppingBag, 'apres-vente': Package } as const

/** Lien mailto complet : adresse, objet, et corps pré-rempli s'il y en a un. */
function lienMail(canal: Canal): string {
  const p = new URLSearchParams()
  p.set('subject', canal.objet)
  if (canal.corps) p.set('body', canal.corps)
  /* URLSearchParams encode les espaces en « + », que les messageries
     affichent tels quels : on les remet en %20. */
  return `mailto:${canal.email}?${p.toString().replace(/\+/g, '%20')}`
}

function BoutonCopier({ email }: { email: string }) {
  const [copie, setCopie] = useState(false)

  async function copier(e: React.MouseEvent) {
    /* Le bouton vit dans un lien mailto : on ne veut pas ouvrir la
       messagerie en plus de copier. */
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(email)
    } catch {
      /* Navigateurs anciens : sélectionner le texte reste possible à la main. */
      return
    }
    setCopie(true)
    setTimeout(() => setCopie(false), 2500)
  }

  return (
    <button
      type="button"
      onClick={copier}
      data-track={`Copier l’adresse (${email})`}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[14px] font-semibold transition-colors ${
        copie
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-gray-300 bg-white text-gray-700 hover:border-brand-500 hover:text-brand-700'
      }`}
    >
      {copie ? <><Check size={15} /> Adresse copiée</> : <><Copy size={15} /> Copier l’adresse</>}
    </button>
  )
}

/**
 * Le contact, sans formulaire : deux grandes cartes, une par situation.
 *
 * Cliquer une carte ouvre la messagerie du visiteur, adresse et objet déjà
 * remplis. Sur ordinateur, ce clic n'ouvre parfois rien (messagerie lue
 * dans le navigateur) : l'adresse est donc écrite en clair, avec un bouton
 * pour la copier. Trois chemins vers la même boîte, aucun menu.
 *
 * `?canal=apres-vente` dans l'URL met la carte « J'ai déjà commandé » en
 * premier : la page de confirmation et l'e-mail après achat peuvent y
 * envoyer directement.
 */
export default function CartesContact() {
  const [prioritaire, setPrioritaire] = useState<Canal['id'] | null>(null)

  useEffect(() => {
    const voulu = new URLSearchParams(window.location.search).get('canal')
    if (voulu === 'apres-vente' || voulu === 'avant-vente') setPrioritaire(voulu)
  }, [])

  const cartes = prioritaire
    ? [...CANAUX].sort((a, b) => Number(b.id === prioritaire) - Number(a.id === prioritaire))
    : CANAUX

  return (
    <div>
      <h2 className="font-serif text-[22px] sm:text-3xl font-bold text-ink text-center mb-1.5 sm:mb-2">
        Vous nous écrivez à quel sujet ?
      </h2>
      <p className="text-center text-gray-600 text-[15px] sm:text-base mb-5 sm:mb-8">
        Cliquez sur votre situation : votre messagerie s’ouvre, à la bonne adresse.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        {cartes.map((canal) => {
          const Icone = ICONES[canal.id]
          const misEnAvant = prioritaire === canal.id
          return (
            <a
              key={canal.id}
              href={lienMail(canal)}
              data-track={`Contact : ${canal.titre}`}
              className={`group block rounded-xl border-2 p-6 sm:p-7 transition-colors ${
                misEnAvant
                  ? 'border-brand-600 bg-brand-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-brand-500 hover:bg-brand-50/40'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="w-12 h-12 rounded-lg bg-brand-600 text-white flex items-center justify-center flex-shrink-0">
                  <Icone size={24} />
                </span>
                <span className="text-[20px] sm:text-[22px] font-bold text-ink leading-tight">{canal.titre}</span>
              </div>

              <p className="text-[16px] text-gray-700 leading-snug mb-5">{canal.description}</p>

              <p className="flex items-center gap-2 text-[15px] sm:text-[16px] font-semibold text-brand-700 break-all mb-3">
                <Mail size={18} className="flex-shrink-0" />
                {canal.email}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-lg bg-brand-600 group-hover:bg-brand-700 text-white px-4 py-2 text-[15px] font-semibold transition-colors">
                  Écrire un e-mail
                </span>
                <BoutonCopier email={canal.email} />
              </div>
            </a>
          )
        })}
      </div>

      <p className="text-center text-[14px] text-gray-500 mt-6 leading-snug">
        Le clic n’a rien ouvert ? Copiez l’adresse et collez-la dans votre messagerie habituelle.
        Nous répondons sous 24 h ouvrées, du lundi au vendredi.
      </p>
    </div>
  )
}
